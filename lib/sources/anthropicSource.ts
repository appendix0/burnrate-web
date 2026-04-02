import { AnthropicCredential } from "@/lib/models/credential";
import { UsageSummary } from "@/lib/models/usageSummary";
import { UsageRecord } from "@/lib/models/usageRecord";
import { ServiceType } from "@/lib/constants/services";
import { getMTDRange, getPreviousMonthRange } from "@/lib/utils/dateRange";

// Organization path only — requires an Admin API key.
// Individual accounts are handled via manual entry in useRefreshUsage.

type AnthropicUsageResponse = {
  data: Array<{
    timestamp: string;
    input_tokens: number;
    output_tokens: number;
  }>;
};

const INPUT_COST_PER_M = 3.0;
const OUTPUT_COST_PER_M = 15.0;

async function fetchRange(
  credential: AnthropicCredential,
  startDate: string,
  endDate: string
): Promise<UsageRecord[]> {
  const res = await fetch("/api/anthropic", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: credential.apiKey, startDate, endDate }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.message ?? `HTTP ${res.status}`);
  }

  const data: AnthropicUsageResponse = await res.json();
  return data.data.map((entry) => {
    const totalTokens = entry.input_tokens + entry.output_tokens;
    const costUsd =
      (entry.input_tokens / 1_000_000) * INPUT_COST_PER_M +
      (entry.output_tokens / 1_000_000) * OUTPUT_COST_PER_M;
    return { date: entry.timestamp.slice(0, 10), costUsd, tokens: totalTokens };
  });
}

export async function fetchAnthropicUsage(
  credential: AnthropicCredential
): Promise<UsageSummary> {
  const { start: mtdStart, end: mtdEnd } = getMTDRange();
  const { start: prevStart, end: prevEnd } = getPreviousMonthRange();
  const [currentRecords, previousRecords] = await Promise.all([
    fetchRange(credential, mtdStart, mtdEnd),
    fetchRange(credential, prevStart, prevEnd),
  ]);
  return {
    serviceType: ServiceType.Anthropic,
    currentPeriodCostUsd: currentRecords.reduce((s, r) => s + r.costUsd, 0),
    previousPeriodCostUsd: previousRecords.reduce((s, r) => s + r.costUsd, 0),
    dailyRecords: currentRecords,
    fetchedAt: new Date().toISOString(),
  };
}
