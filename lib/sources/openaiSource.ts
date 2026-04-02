import { OpenAICredential } from "@/lib/models/credential";
import { UsageSummary } from "@/lib/models/usageSummary";
import { UsageRecord } from "@/lib/models/usageRecord";
import { ServiceType } from "@/lib/constants/services";
import { getMTDRange, getPreviousMonthRange } from "@/lib/utils/dateRange";

// OpenAI Billing Usage API
// GET https://api.openai.com/v1/dashboard/billing/usage
// Returns total_usage in USD cents (divide by 100 for USD)
// Docs: https://platform.openai.com/docs/api-reference/usage

type OpenAIDailyCost = {
  timestamp: number; // Unix timestamp (start of day)
  line_items: Array<{ name: string; cost: number }>; // cost in cents
};

type OpenAIUsageResponse = {
  total_usage: number; // USD cents
  daily_costs: OpenAIDailyCost[];
};

async function fetchRange(
  credential: OpenAICredential,
  startDate: string,
  endDate: string
): Promise<{ records: UsageRecord[]; totalCostUsd: number }> {
  // Route Handler proxy — OpenAI billing endpoint blocks direct browser requests (CORS)
  const res = await fetch("/api/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: credential.apiKey, startDate, endDate }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const data: OpenAIUsageResponse = await res.json();

  const records: UsageRecord[] = (data.daily_costs ?? []).map((day) => {
    const costUsd =
      day.line_items.reduce((sum, item) => sum + item.cost, 0) / 100;
    const date = new Date(day.timestamp * 1000).toISOString().slice(0, 10);
    return { date, costUsd };
  });

  return {
    records,
    totalCostUsd: (data.total_usage ?? 0) / 100,
  };
}

export async function fetchOpenAIUsage(
  credential: OpenAICredential
): Promise<UsageSummary> {
  const { start: mtdStart, end: mtdEnd } = getMTDRange();
  const { start: prevStart, end: prevEnd } = getPreviousMonthRange();

  const [current, previous] = await Promise.all([
    fetchRange(credential, mtdStart, mtdEnd),
    fetchRange(credential, prevStart, prevEnd),
  ]);

  return {
    serviceType: ServiceType.OpenAI,
    currentPeriodCostUsd: current.totalCostUsd,
    previousPeriodCostUsd: previous.totalCostUsd,
    dailyRecords: current.records,
    fetchedAt: new Date().toISOString(),
  };
}
