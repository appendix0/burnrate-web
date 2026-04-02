"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useCredentialStore } from "@/lib/store/credentialStore";
import { useUsageStore, ServiceLoadState } from "@/lib/store/usageStore";
import { useAlertStore } from "@/lib/store/alertStore";
import { SERVICE_METADATA, ALL_SERVICES, ServiceType } from "@/lib/constants/services";
import { ServiceIcon } from "@/components/ServiceIcon";
import { useTotalSpend } from "@/lib/hooks/useUsage";
import { useRefreshUsage } from "@/lib/hooks/useRefreshUsage";
import { timeAgo } from "@/lib/utils/timeAgo";

function formatUsd(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export default function DashboardPage() {
  const configuredServices = useCredentialStore((s) => s.configuredServices);
  const services = useUsageStore((s) => s.services);
  const alerts = useAlertStore((s) => s.alerts);
  const totalSpend = useTotalSpend();
  const { refreshAll } = useRefreshUsage();

  const hasFetched = useRef(false);
  useEffect(() => {
    if (configuredServices.length > 0 && !hasFetched.current) {
      hasFetched.current = true;
      refreshAll();
    }
  }, [configuredServices, refreshAll]);

  const isAnyLoading = configuredServices.some(
    (s) => services[s].status === "loading"
  );

  return (
    <main className="min-h-screen p-6 pb-24">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-burn">Burn</span>Rate
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              {configuredServices.length > 0
                ? `MTD total · ${formatUsd(totalSpend)}`
                : "No services configured yet"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/settings"
              className="text-xs text-muted-foreground border border-border rounded-md px-3 py-1.5 hover:bg-accent transition-colors"
            >
              Settings
            </Link>
            <Link
              href="/onboarding"
              className="text-xs text-muted-foreground border border-border rounded-md px-3 py-1.5 hover:bg-accent transition-colors"
            >
              + Add service
            </Link>
            {configuredServices.length > 0 && (
              <button
                onClick={refreshAll}
                disabled={isAnyLoading}
                className="text-xs text-muted-foreground border border-border rounded-md px-3 py-1.5 hover:bg-accent transition-colors disabled:opacity-40"
              >
                {isAnyLoading ? "Refreshing…" : "Refresh all"}
              </button>
            )}
          </div>
        </div>

        {/* Empty state */}
        {configuredServices.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <h2 className="text-lg font-semibold mb-2">Nothing to track yet</h2>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Connect your first service to start monitoring LLM and cloud spend.
            </p>
            <Link
              href="/onboarding"
              className="px-4 py-2 rounded-lg bg-burn text-burn-foreground text-sm font-medium"
            >
              Set up services
            </Link>
          </div>
        )}

        {/* Service card grid */}
        {configuredServices.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {ALL_SERVICES.filter((s) => configuredServices.includes(s)).map(
              (service) => {
                const state = services[service];
                const alert = alerts.find((a) => a.serviceType === service);
                const isOverBudget =
                  alert?.isEnabled &&
                  state.status === "loaded" &&
                  state.data.currentPeriodCostUsd >= alert.thresholdUsd;

                return (
                  <ServiceCard
                    key={service}
                    service={service}
                    state={state}
                    isOverBudget={!!isOverBudget}
                    alertThreshold={alert?.isEnabled ? alert.thresholdUsd : undefined}
                  />
                );
              }
            )}
          </div>
        )}
      </div>
    </main>
  );
}

function ServiceCard({
  service,
  state,
  isOverBudget,
  alertThreshold,
}: {
  service: ServiceType;
  state: ServiceLoadState;
  isOverBudget: boolean;
  alertThreshold?: number;
}) {
  const meta = SERVICE_METADATA[service];

  return (
    <Link
      href={`/dashboard/${service}`}
      className={`rounded-lg border bg-card p-5 flex flex-col gap-3 hover:bg-accent/50 transition-colors ${
        isOverBudget ? "border-danger/50" : "border-border"
      }`}
    >
      {/* Name + status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center"
            style={{ backgroundColor: meta.color + "22", color: meta.color }}
          >
            <ServiceIcon service={service} className="w-4 h-4" />
          </div>
          <span className="text-sm font-medium">{meta.label}</span>
        </div>
        {isOverBudget ? (
          <span className="text-xs bg-danger/20 text-danger rounded px-2 py-0.5">
            over budget
          </span>
        ) : (
          <StatusBadge status={state.status} />
        )}
      </div>

      {/* Spend amount */}
      {state.status === "loading" ? (
        <div className="flex flex-col gap-2">
          <div className="h-7 w-28 rounded bg-muted animate-pulse" />
          <div className="h-3 w-40 rounded bg-muted animate-pulse" />
        </div>
      ) : (
        <>
          <div className="text-2xl font-mono font-semibold">
            {state.status === "loaded"
              ? state.data.needsManualInput
                ? <span className="text-base text-warning">Enter spend →</span>
                : formatUsd(state.data.currentPeriodCostUsd)
              : state.status === "error"
              ? <span className="text-base text-danger">Error</span>
              : <span className="text-muted-foreground">—</span>}
          </div>

          {/* Footer */}
          <div className="text-xs text-muted-foreground">
            {state.status === "loaded" && (
              <span>
                MTD
                {state.data.previousPeriodCostUsd > 0 && (
                  <MoMDiff
                    current={state.data.currentPeriodCostUsd}
                    previous={state.data.previousPeriodCostUsd}
                  />
                )}
                {" · "}
                {timeAgo(state.data.fetchedAt)}
                {alertThreshold && (
                  <span className={isOverBudget ? "text-danger" : "text-muted-foreground"}>
                    {" · "}${alertThreshold} limit
                  </span>
                )}
              </span>
            )}
            {state.status === "error" && (
              <span className="text-danger">{state.message}</span>
            )}
            {state.status === "unconfigured" && "MTD spend"}
          </div>
        </>
      )}
    </Link>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    loaded: "bg-safe/20 text-safe",
    loading: "bg-muted text-muted-foreground",
    error: "bg-danger/20 text-danger",
    unconfigured: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`text-xs rounded px-2 py-0.5 ${styles[status] ?? styles.unconfigured}`}>
      {status}
    </span>
  );
}

function MoMDiff({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) return null;
  const pct = ((current - previous) / previous) * 100;
  const isUp = pct > 0;
  return (
    <span className={isUp ? "text-danger" : "text-safe"}>
      {" "}
      {isUp ? "▲" : "▼"}{Math.abs(pct).toFixed(0)}%
    </span>
  );
}
