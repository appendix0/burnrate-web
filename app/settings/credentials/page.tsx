"use client";

import { useRouter } from "next/navigation";
import { useCredentialStore } from "@/lib/store/credentialStore";
import { useUsageStore } from "@/lib/store/usageStore";
import { ALL_SERVICES, SERVICE_METADATA, ServiceType } from "@/lib/constants/services";
import { ServiceIcon } from "@/components/ServiceIcon";

const SERVICE_GROUPS = [
  {
    label: "AI Credits",
    services: [ServiceType.Anthropic, ServiceType.OpenAI, ServiceType.Gemini],
  },
  {
    label: "Cloud Services",
    services: [ServiceType.AWS, ServiceType.Oracle],
  },
];

export default function CredentialsSettingsPage() {
  const router = useRouter();
  const configuredServices = useCredentialStore((s) => s.configuredServices);
  const removeCredential = useCredentialStore((s) => s.removeCredential);
  const resetAll = useUsageStore((s) => s.resetAll);
  const setUnconfigured = useUsageStore((s) => s.setUnconfigured);

  const handleRemove = (service: ServiceType) => {
    const meta = SERVICE_METADATA[service];
    if (!confirm(`Remove ${meta.label} credentials? This cannot be undone.`)) return;
    removeCredential(service);
    setUnconfigured(service);
  };

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push("/settings")}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          ← Settings
        </button>

        <h1 className="text-xl font-semibold mb-6">Credentials</h1>

        <div className="flex flex-col gap-8">
          {SERVICE_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
                {group.label}
              </p>
              <div className="flex flex-col gap-2">
                {group.services.map((service) => {
                  const meta = SERVICE_METADATA[service];
                  const isConfigured = configuredServices.includes(service);

                  return (
                    <div
                      key={service}
                      className="flex items-center gap-4 p-4 rounded-lg border border-border bg-card"
                    >
                      {/* Icon */}
                      <div
                        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: meta.color + "22", color: meta.color }}
                      >
                        <ServiceIcon service={service} className="w-5 h-5" />
                      </div>

                      {/* Name + status */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{meta.label}</p>
                        <p className="text-xs text-muted-foreground">
                          {isConfigured ? (
                            <span className="text-safe">✓ Connected</span>
                          ) : (
                            "Not configured"
                          )}
                        </p>
                      </div>

                      {/* Actions */}
                      {isConfigured ? (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => router.push(`/onboarding/${service}`)}
                            className="text-xs border border-border rounded px-2.5 py-1 hover:bg-accent transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemove(service)}
                            className="text-xs border border-danger/40 text-danger rounded px-2.5 py-1 hover:bg-danger/10 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => router.push(`/onboarding/${service}`)}
                          className="text-xs border border-border rounded px-2.5 py-1 hover:bg-accent transition-colors"
                        >
                          Add
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Danger zone */}
        {configuredServices.length > 0 && (
          <div className="mt-8 p-4 rounded-lg border border-danger/20 bg-danger/5">
            <p className="text-sm font-medium text-danger mb-1">Danger zone</p>
            <p className="text-xs text-muted-foreground mb-3">
              Remove all credentials and reset BurnRate. This clears all
              encrypted data from your browser.
            </p>
            <button
              onClick={() => {
                if (!confirm("Remove ALL credentials and reset BurnRate? This cannot be undone.")) return;
                ALL_SERVICES.forEach((s) => removeCredential(s));
                resetAll();
                router.push("/onboarding");
              }}
              className="text-xs border border-danger/40 text-danger rounded px-3 py-1.5 hover:bg-danger/10 transition-colors"
            >
              Remove all credentials
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
