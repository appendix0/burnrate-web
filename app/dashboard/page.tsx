"use client";

import Link from "next/link";
import { useCredentialStore } from "@/lib/store/credentialStore";
import { useUsageStore } from "@/lib/store/usageStore";
import { SERVICE_METADATA, ALL_SERVICES } from "@/lib/constants/services";
import { useTotalSpend } from "@/lib/hooks/useUsage";

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
  const totalSpend = useTotalSpend();

  return (
    <main className="min-h-screen p-6">
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
              href="/onboarding"
              className="text-xs text-muted-foreground border border-border rounded-md px-3 py-1.5 hover:bg-accent transition-colors"
            >
              + Add service
            </Link>
            <button className="text-xs text-muted-foreground border border-border rounded-md px-3 py-1.5 hover:bg-accent transition-colors">
              Refresh all
            </button>
          </div>
        </div>

        {/* Empty state */}
        {configuredServices.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="text-4xl mb-4">📊</div>
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
            {ALL_SERVICES.filter((s) => configuredServices.includes(s)).map((service) => {
              const meta = SERVICE_METADATA[service];
              const state = services[service];
              return (
                <Link
                  key={service}
                  href={`/dashboard/${service}`}
                  className="rounded-lg border border-border bg-card p-5 flex flex-col gap-3 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          backgroundColor: meta.color + "22",
                          color: meta.color,
                        }}
                      >
                        {meta.label[0]}
                      </div>
                      <span className="text-sm font-medium">{meta.label}</span>
                    </div>
                    <StatusBadge state={state.status} />
                  </div>

                  <div className="text-2xl font-mono font-semibold">
                    {state.status === "loaded"
                      ? formatUsd(state.data.currentPeriodCostUsd)
                      : state.status === "loading"
                      ? "…"
                      : "—"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {state.status === "loaded"
                      ? `MTD · fetched ${new Date(state.data.fetchedAt).toLocaleTimeString()}`
                      : state.status === "error"
                      ? state.message
                      : "MTD spend"}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

function StatusBadge({ state }: { state: string }) {
  const styles: Record<string, string> = {
    loaded: "bg-safe/20 text-safe",
    loading: "bg-muted text-muted-foreground",
    error: "bg-danger/20 text-danger",
    unconfigured: "bg-muted text-muted-foreground",
  };
  return (
    <span className={`text-xs rounded px-2 py-0.5 ${styles[state] ?? styles.unconfigured}`}>
      {state}
    </span>
  );
}
