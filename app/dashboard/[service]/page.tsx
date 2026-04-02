"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ServiceType, SERVICE_METADATA } from "@/lib/constants/services";
import { useUsageStore } from "@/lib/store/usageStore";
import { useCredentialStore } from "@/lib/store/credentialStore";
import { useManualUsageStore } from "@/lib/store/manualUsageStore";
import { useRefreshUsage } from "@/lib/hooks/useRefreshUsage";
import { SpendChart } from "@/components/SpendChart";
import { UsageSummary } from "@/lib/models/usageSummary";
import { useAlertStore } from "@/lib/store/alertStore";
import { timeAgo } from "@/lib/utils/timeAgo";
import { AnthropicCredential } from "@/lib/models/credential";

const DASHBOARD_URLS: Partial<Record<ServiceType, string>> = {
  [ServiceType.Anthropic]: "https://console.anthropic.com/usage",
  [ServiceType.OpenAI]: "https://platform.openai.com/usage",
  [ServiceType.Gemini]: "https://aistudio.google.com",
};

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

function calcDailyAvg(summary: UsageSummary): number {
  if (summary.dailyRecords.length === 0) return 0;
  return summary.currentPeriodCostUsd / summary.dailyRecords.length;
}

function calcPeakDay(summary: UsageSummary): { date: string; costUsd: number } | null {
  if (summary.dailyRecords.length === 0) return null;
  return summary.dailyRecords.reduce((max, r) => (r.costUsd > max.costUsd ? r : max));
}

function MoMChange({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return <span className="text-muted-foreground">— no prev data</span>;
  const pct = ((current - previous) / previous) * 100;
  const isUp = pct > 0;
  return (
    <span className={isUp ? "text-danger" : "text-safe"}>
      {isUp ? "▲" : "▼"} {Math.abs(pct).toFixed(1)}% vs last month
      <span className="text-muted-foreground ml-1">({formatUsd(previous)})</span>
    </span>
  );
}

// ── Manual entry form ─────────────────────────────────────────────────────────

function ManualEntryForm({
  service,
  onSaved,
}: {
  service: ServiceType;
  onSaved: () => void;
}) {
  const existing = useManualUsageStore((s) => s.getEntry(service));
  const setEntry = useManualUsageStore((s) => s.setEntry);
  const [current, setCurrent] = useState(
    existing ? existing.currentMonthSpend.toFixed(2) : ""
  );
  const [previous, setPrevious] = useState(
    existing ? existing.previousMonthSpend.toFixed(2) : ""
  );
  const [saved, setSaved] = useState(false);

  const dashboardUrl = DASHBOARD_URLS[service];

  const handleSave = () => {
    const currentVal = parseFloat(current) || 0;
    const previousVal = parseFloat(previous) || 0;
    setEntry(service, currentVal, previousVal);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    onSaved();
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium">Update spend</p>
        {dashboardUrl && (
          <a
            href={dashboardUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            View actual usage ↗
          </a>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">This month (MTD)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={current}
              onChange={(e) => setCurrent(e.target.value)}
              placeholder="0.00"
              className="w-full bg-background border border-border rounded-md pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-burn/50 focus:border-burn/50"
            />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-muted-foreground">Last month</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={previous}
              onChange={(e) => setPrevious(e.target.value)}
              placeholder="0.00"
              className="w-full bg-background border border-border rounded-md pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-burn/50 focus:border-burn/50"
            />
          </div>
        </div>
      </div>

      <button
        onClick={handleSave}
        className="w-full py-2 rounded-lg bg-burn text-burn-foreground text-sm font-medium transition-opacity hover:opacity-90"
      >
        {saved ? "Saved!" : "Save"}
      </button>

      <p className="text-xs text-muted-foreground mt-3 text-center">
        Copy your spend from the provider&apos;s usage dashboard and paste it here.
      </p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceSlug = params.service as string;
  const service = Object.values(ServiceType).find((s) => s === serviceSlug);

  const state = useUsageStore((s) =>
    service ? s.services[service] : { status: "unconfigured" as const }
  );
  const alert = useAlertStore((s) =>
    service ? s.alerts.find((a) => a.serviceType === service) : undefined
  );
  const getCredential = useCredentialStore((s) => s.getCredential);
  const { refresh } = useRefreshUsage();

  // Determine if this service uses manual entry
  const [isManual, setIsManual] = useState(false);
  useEffect(() => {
    if (!service) return;
    if (service === ServiceType.OpenAI || service === ServiceType.Gemini) {
      setIsManual(true);
      return;
    }
    if (service === ServiceType.Anthropic) {
      getCredential(service).then((cred) => {
        setIsManual((cred as AnthropicCredential)?.accountType === "individual");
      });
    }
  }, [service, getCredential]);

  const isOverBudget =
    alert?.isEnabled &&
    state.status === "loaded" &&
    state.data.currentPeriodCostUsd >= alert.thresholdUsd;

  if (!service) {
    router.replace("/dashboard");
    return null;
  }

  const meta = SERVICE_METADATA[service];

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          ← Dashboard
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
              style={{ backgroundColor: meta.color + "22", color: meta.color }}
            >
              {meta.label[0]}
            </div>
            <div>
              <h1 className="text-xl font-semibold">{meta.label}</h1>
              <p className="text-xs text-muted-foreground">
                {isManual ? "Manual entry" : meta.description}
              </p>
            </div>
          </div>

          {!isManual && (
            <button
              onClick={() => refresh(service)}
              disabled={state.status === "loading"}
              className="text-xs text-muted-foreground border border-border rounded-md px-3 py-1.5 hover:bg-accent transition-colors disabled:opacity-40"
            >
              {state.status === "loading" ? "Refreshing…" : "Refresh"}
            </button>
          )}
        </div>

        {/* Loading */}
        {state.status === "loading" && (
          <div className="flex flex-col gap-4">
            <div className="h-28 rounded-lg bg-card border border-border animate-pulse" />
            <div className="h-56 rounded-lg bg-card border border-border animate-pulse" />
          </div>
        )}

        {/* Error */}
        {state.status === "error" && (
          <div className="rounded-lg border border-danger/30 bg-danger/10 p-5">
            <p className="text-sm font-medium text-danger mb-1">Failed to fetch data</p>
            <p className="text-xs text-muted-foreground">{state.message}</p>
            <button
              onClick={() => refresh(service)}
              className="mt-3 text-xs text-danger underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Unconfigured */}
        {state.status === "unconfigured" && (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              {meta.label} is not configured yet.
            </p>
            <button
              onClick={() => router.push(`/onboarding/${service}`)}
              className="text-xs bg-burn text-burn-foreground px-4 py-2 rounded-lg"
            >
              Connect {meta.label}
            </button>
          </div>
        )}

        {/* Loaded */}
        {state.status === "loaded" && (() => {
          const { data } = state;
          const peakDay = calcPeakDay(data);
          const hasData = data.currentPeriodCostUsd > 0 || data.previousPeriodCostUsd > 0;
          return (
            <div className="flex flex-col gap-5">
              {/* Over budget banner */}
              {isOverBudget && alert && (
                <div className="rounded-lg border border-danger/40 bg-danger/10 px-4 py-3 flex items-center gap-3">
                  <span className="text-danger text-lg">⚠</span>
                  <div>
                    <p className="text-sm font-medium text-danger">Over budget</p>
                    <p className="text-xs text-muted-foreground">
                      {formatUsd(data.currentPeriodCostUsd)} spent ·{" "}
                      {formatUsd(alert.thresholdUsd)} monthly limit
                    </p>
                  </div>
                </div>
              )}

              {/* Stats — only shown if there's something to display */}
              {hasData && (
                <>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <StatCard
                      label="MTD Total"
                      value={formatUsd(data.currentPeriodCostUsd)}
                      accent
                      color={meta.color}
                    />
                    <StatCard
                      label="Daily Average"
                      value={data.dailyRecords.length > 0 ? formatUsd(calcDailyAvg(data)) : "—"}
                    />
                    <StatCard
                      label="Peak Day"
                      value={peakDay ? formatUsd(peakDay.costUsd) : "—"}
                      sub={
                        peakDay
                          ? new Date(peakDay.date + "T00:00:00").toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : undefined
                      }
                    />
                    <StatCard label="Last Month" value={formatUsd(data.previousPeriodCostUsd)} />
                  </div>

                  <p className="text-xs">
                    <MoMChange
                      current={data.currentPeriodCostUsd}
                      previous={data.previousPeriodCostUsd}
                    />
                  </p>
                </>
              )}

              {/* Manual entry form */}
              {isManual && (
                <ManualEntryForm service={service} onSaved={() => refresh(service)} />
              )}

              {/* Daily chart — only for API-tracked services with daily data */}
              {!isManual && data.dailyRecords.length > 0 && (
                <div className="rounded-lg border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-sm font-medium">Daily spend</p>
                    <p className="text-xs text-muted-foreground">
                      Updated {timeAgo(data.fetchedAt)}
                    </p>
                  </div>
                  <SpendChart data={data.dailyRecords} color={meta.color} height={220} />
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  accent?: boolean;
  color?: string;
}) {
  return (
    <div
      className="rounded-lg border border-border bg-card p-4 flex flex-col gap-1"
      style={accent && color ? { borderColor: color + "44" } : undefined}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className="text-lg font-mono font-semibold"
        style={accent && color ? { color } : undefined}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}
