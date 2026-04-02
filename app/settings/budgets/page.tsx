"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCredentialStore } from "@/lib/store/credentialStore";
import { useAlertStore } from "@/lib/store/alertStore";
import { ALL_SERVICES, SERVICE_METADATA, ServiceType } from "@/lib/constants/services";
import { ServiceIcon } from "@/components/ServiceIcon";

export default function BudgetsSettingsPage() {
  const router = useRouter();
  const configuredServices = useCredentialStore((s) => s.configuredServices);
  const alerts = useAlertStore((s) => s.alerts);
  const setAlert = useAlertStore((s) => s.setAlert);
  const toggleAlert = useAlertStore((s) => s.toggleAlert);

  // Local form state — one threshold value per service
  const [thresholds, setThresholds] = useState<Record<ServiceType, string>>(
    () =>
      ALL_SERVICES.reduce(
        (acc, s) => ({ ...acc, [s]: "" }),
        {} as Record<ServiceType, string>
      )
  );
  const [saved, setSaved] = useState(false);

  // Populate inputs from existing alerts on mount
  useEffect(() => {
    setThresholds((prev) => {
      const next = { ...prev };
      alerts.forEach((a) => {
        next[a.serviceType] = a.thresholdUsd.toString();
      });
      return next;
    });
  }, [alerts]);

  const handleSave = () => {
    configuredServices.forEach((service) => {
      const raw = thresholds[service];
      const value = parseFloat(raw);
      if (!isNaN(value) && value > 0) {
        setAlert(service, value);
      }
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getAlertForService = (service: ServiceType) =>
    alerts.find((a) => a.serviceType === service);

  if (configuredServices.length === 0) {
    return (
      <main className="min-h-screen p-6">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => router.push("/settings")}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            ← Settings
          </button>
          <h1 className="text-xl font-semibold mb-6">Budget Alerts</h1>
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground mb-4">
              No services configured yet.
            </p>
            <button
              onClick={() => router.push("/onboarding")}
              className="text-xs bg-burn text-burn-foreground px-4 py-2 rounded-lg"
            >
              Set up services
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push("/settings")}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          ← Settings
        </button>

        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold">Budget Alerts</h1>
          <p className="text-xs text-muted-foreground">Monthly spend limits</p>
        </div>

        <p className="text-xs text-muted-foreground mb-5">
          BurnRate checks your spend against these thresholds each time data is
          refreshed. Alerts are shown inline on the dashboard.
        </p>

        <div className="flex flex-col gap-3 mb-6">
          {configuredServices.map((service) => {
            const meta = SERVICE_METADATA[service];
            const alert = getAlertForService(service);
            const isEnabled = alert?.isEnabled ?? false;

            return (
              <div
                key={service}
                className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card"
              >
                {/* Avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    backgroundColor: meta.color + "22",
                    color: meta.color,
                  }}
                >
                  <ServiceIcon service={service} className="w-5 h-5" />
                </div>

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{meta.label}</p>
                  {alert && (
                    <p className="text-xs text-muted-foreground">
                      Alert at ${alert.thresholdUsd.toFixed(2)}/month
                    </p>
                  )}
                </div>

                {/* Threshold input */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="50"
                    value={thresholds[service]}
                    onChange={(e) =>
                      setThresholds((prev) => ({
                        ...prev,
                        [service]: e.target.value,
                      }))
                    }
                    className="w-20 bg-background border border-border rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-burn/50 focus:border-burn/50"
                  />
                  <span className="text-xs text-muted-foreground">/mo</span>
                </div>

                {/* Toggle */}
                <button
                  onClick={() => {
                    if (!alert) return; // need to save first
                    toggleAlert(service);
                  }}
                  disabled={!alert}
                  title={!alert ? "Set a threshold and save first" : undefined}
                  className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 disabled:opacity-40 ${
                    isEnabled ? "bg-safe" : "bg-muted"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                      isEnabled ? "translate-x-5" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </div>
            );
          })}
        </div>

        <button
          onClick={handleSave}
          className={`w-full py-2.5 rounded-lg font-medium text-sm transition-all ${
            saved
              ? "bg-safe text-white"
              : "bg-burn text-burn-foreground"
          }`}
        >
          {saved ? "✓ Saved" : "Save thresholds"}
        </button>
      </div>
    </main>
  );
}
