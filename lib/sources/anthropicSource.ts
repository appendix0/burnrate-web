import { AnthropicCredential } from "@/lib/models/credential";
import { UsageSummary } from "@/lib/models/usageSummary";
import { UsageRecord } from "@/lib/models/usageRecord";
import { ServiceType } from "@/lib/constants/services";
import { getMTDRange, getPreviousMonthRange } from "@/lib/utils/dateRange";

// Anthropic Usage API
// GET https://api.anthropic.com/v1/usage
// Docs: https://docs.anthropic.com/en/api/usage
//
// Note: Requires an API key with usage read permissions.
// The key must belong to an Organization admin or have billing scope.

type AnthropicUsageResponse = {
  data: Array<{
    timestamp: string;        // ISO date "YYYY-MM-DD"
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  }>;
};

// Anthropic pricing (as of 2024, Claude 3.5 Sonnet baseline — user sees aggregate)
// Source data does not include cost directly; we estimate from tokens.
// Cost is returned directly in newer API versions — fall back to token estimate.
const INPUT_COST_PER_M = 3.0;   // $3 per 1M input tokens (Sonnet baseline)
const OUTPUT_COST_PER_M = 15.0; // $15 per 1M output tokens

async function fetchRange(
  credential: AnthropicCredential,
  startDate: string,
  endDate: string
): Promise<UsageRecord[]> {
  const params = new URLSearchParams({
    start_time: `${startDate}T00:00:00Z`,
    end_time: `${endDate}T23:59:59Z`,
    granularity: "day",
  });

  const res = await fetch(
    `https://api.anthropic.com/v1/usage?${params}`,
    {
      headers: {
        "x-api-key": credential.apiKey,
        "anthropic-version": "2023-06-01",
      },
    }
  );

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const msg = body?.error?.message ?? `HTTP ${res.status}`;
    throw new Error(msg);
  }

  const data: AnthropicUsageResponse = await res.json();

  return data.data.map((entry) => {
    const totalTokens = entry.input_tokens + entry.output_tokens;
    const costUsd =
      (entry.input_tokens / 1_000_000) * INPUT_COST_PER_M +
      (entry.output_tokens / 1_000_000) * OUTPUT_COST_PER_M;

    return {
      date: entry.timestamp.slice(0, 10),
      costUsd,
      tokens: totalTokens,
    };
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

  const currentPeriodCostUsd = currentRecords.reduce((s, r) => s + r.costUsd, 0);
  const previousPeriodCostUsd = previousRecords.reduce((s, r) => s + r.costUsd, 0);

  return {
    serviceType: ServiceType.Anthropic,
    currentPeriodCostUsd,
    previousPeriodCostUsd,
    dailyRecords: currentRecords,
    fetchedAt: new Date().toISOString(),
  };
}
