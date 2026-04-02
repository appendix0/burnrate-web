// Server-side in-memory usage log for proxy-tracked API calls.
//
// This module-level store persists for the lifetime of the Next.js server process.
// In development (Codespace / local), it survives between requests but resets on
// server restart or hot reload. For this self-hosted use case that is acceptable.

import { calcCost } from "@/lib/modelPricing";
import { ServiceType } from "@/lib/constants/services";

export type ProxyService = ServiceType.Anthropic | ServiceType.OpenAI | ServiceType.Gemini;

export type ProxyLogEntry = {
  id: string;
  service: ProxyService;
  model: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  date: string;      // YYYY-MM-DD (UTC)
  timestamp: string; // ISO 8601
};

// Module-level store — shared across all Route Handler invocations in the same process
const LOG: ProxyLogEntry[] = [];

export function addProxyLog(
  service: ProxyService,
  model: string,
  inputTokens: number,
  outputTokens: number
): void {
  const now = new Date();
  LOG.push({
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    service,
    model,
    inputTokens,
    outputTokens,
    costUsd: calcCost(model, inputTokens, outputTokens),
    date: now.toISOString().slice(0, 10),
    timestamp: now.toISOString(),
  });
}

export function getProxyLogs(
  service: ProxyService,
  startDate: string,
  endDate: string
): ProxyLogEntry[] {
  return LOG.filter(
    (e) => e.service === service && e.date >= startDate && e.date <= endDate
  );
}

export function aggregateByDay(
  logs: ProxyLogEntry[]
): Array<{ date: string; costUsd: number; tokens: number }> {
  const byDay = new Map<string, { costUsd: number; tokens: number }>();
  for (const log of logs) {
    const prev = byDay.get(log.date) ?? { costUsd: 0, tokens: 0 };
    byDay.set(log.date, {
      costUsd: prev.costUsd + log.costUsd,
      tokens: prev.tokens + log.inputTokens + log.outputTokens,
    });
  }
  return Array.from(byDay.entries())
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
