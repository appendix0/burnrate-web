"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const SETTINGS_SECTIONS = [
  {
    href: "/settings/credentials",
    title: "Credentials",
    description: "Add, edit, or remove API keys for each service",
  },
  {
    href: "/settings/proxy",
    title: "Proxy Setup",
    description: "Route API calls through BurnRate to track Anthropic, OpenAI, and Gemini usage",
  },
  {
    href: "/settings/budgets",
    title: "Budget Alerts",
    description: "Set monthly spend thresholds and get notified",
  },
];

export default function SettingsPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen p-6">
      <div className="max-w-2xl mx-auto">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          ← Dashboard
        </button>

        <h1 className="text-xl font-semibold mb-6">Settings</h1>

        <div className="flex flex-col gap-3">
          {SETTINGS_SECTIONS.map((section) => (
            <Link
              key={section.href}
              href={section.href}
              className="flex items-center gap-4 p-5 rounded-lg border border-border bg-card hover:bg-accent transition-colors"
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{section.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {section.description}
                </p>
              </div>
              <span className="text-muted-foreground text-sm">→</span>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
