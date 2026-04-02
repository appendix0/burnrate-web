"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ServiceType, SERVICE_METADATA, ALL_SERVICES } from "@/lib/constants/services";

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<ServiceType>>(new Set());

  const toggle = (service: ServiceType) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(service)) next.delete(service);
      else next.add(service);
      return next;
    });
  };

  const handleContinue = () => {
    const services = ALL_SERVICES.filter((s) => selected.has(s));
    if (services.length === 0) return;
    const [first, ...rest] = services;
    const queue = rest.join(",");
    router.push(`/onboarding/${first}${queue ? `?queue=${queue}` : ""}`);
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">
            <span className="text-burn">Burn</span>Rate
          </h1>
          <p className="text-muted-foreground text-sm mt-2">
            Select the services you want to monitor.
          </p>
        </div>

        <div className="flex flex-col gap-2.5 mb-8">
          {ALL_SERVICES.map((service) => {
            const meta = SERVICE_METADATA[service];
            const isSelected = selected.has(service);
            return (
              <button
                key={service}
                onClick={() => toggle(service)}
                className={`flex items-center gap-4 p-4 rounded-lg border text-left transition-all ${
                  isSelected
                    ? "border-burn/50 bg-burn/10"
                    : "border-border bg-card hover:bg-accent"
                }`}
              >
                {/* Service avatar */}
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{
                    backgroundColor: meta.color + "22",
                    color: meta.color,
                  }}
                >
                  {meta.label[0]}
                </div>

                {/* Label + description */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{meta.label}</div>
                  <div className="text-xs text-muted-foreground">
                    {meta.description}
                  </div>
                </div>

                {/* Checkbox */}
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? "border-burn bg-burn" : "border-border"
                  }`}
                >
                  {isSelected && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleContinue}
            disabled={selected.size === 0}
            className="w-full py-2.5 rounded-lg bg-burn text-burn-foreground font-medium text-sm transition-opacity disabled:opacity-40"
          >
            Continue{selected.size > 0 ? ` (${selected.size})` : ""}
          </button>
          <button
            onClick={() => router.push("/dashboard")}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-1"
          >
            Skip for now
          </button>
        </div>
      </div>
    </main>
  );
}
