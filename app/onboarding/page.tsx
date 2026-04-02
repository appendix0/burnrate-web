"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ServiceType, SERVICE_METADATA, ALL_SERVICES } from "@/lib/constants/services";

export default function OnboardingPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<ServiceType>>(new Set());
  const [started, setStarted] = useState(false);

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

  // ── Welcome screen ──────────────────────────────────────────────────────────
  if (!started) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-lg w-full flex flex-col items-center gap-8">

          {/* Logo */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-burn/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-burn" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
            </div>
            <h1 className="text-5xl font-bold tracking-tight">
              <span className="text-burn">Burn</span>Rate
            </h1>
          </div>

          {/* Headline */}
          <div className="flex flex-col gap-3">
            <p className="text-2xl font-semibold leading-snug">
              All your AI &amp; cloud spend,<br />
              <span className="text-muted-foreground font-normal">in one place.</span>
            </p>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Stop switching between five dashboards. BurnRate pulls your usage
              from Anthropic, OpenAI, Gemini, AWS, and Oracle Cloud into a single
              live view — with budget alerts when things get expensive.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "🔐 Encrypted locally",
              "📊 Daily spend charts",
              "🔔 Budget alerts",
              "⚡ Live refresh",
            ].map((f) => (
              <span
                key={f}
                className="text-xs text-muted-foreground border border-border rounded-full px-3 py-1 bg-card"
              >
                {f}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="flex flex-col items-center gap-3 w-full max-w-xs">
            <button
              onClick={() => setStarted(true)}
              className="w-full py-3 rounded-xl bg-burn text-burn-foreground font-semibold text-base shadow-lg shadow-burn/20 hover:opacity-90 transition-opacity"
            >
              Get started →
            </button>
            <button
              onClick={() => router.push("/dashboard")}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              I&apos;ll set this up later
            </button>
          </div>
        </div>
      </main>
    );
  }

  // ── Service selector ────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">

        {/* Header */}
        <div className="mb-7">
          <button
            onClick={() => setStarted(false)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-5"
          >
            ← Back
          </button>
          <h2 className="text-xl font-bold">Which services do you use?</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Select all that apply. You can add more later in Settings.
          </p>
        </div>

        {/* Toggle cards */}
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
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                  style={{ backgroundColor: meta.color + "22", color: meta.color }}
                >
                  {meta.label[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{meta.label}</div>
                  <div className="text-xs text-muted-foreground">{meta.description}</div>
                </div>
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isSelected ? "border-burn bg-burn" : "border-border"
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Actions */}
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
