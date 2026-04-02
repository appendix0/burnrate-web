import { AnthropicCredential } from "@/lib/models/credential";
import { UsageSummary } from "@/lib/models/usageSummary";
import { UsageRecord } from "@/lib/models/usageRecord";
import { ServiceType } from "@/lib/constants/services";
import { getMTDRange, getPreviousMonthRange } from "@/lib/utils/dateRange";

// ── Organization path — uses the Anthropic Admin API (requires an Admin API key) ──

type AnthropicUsageResponse = {
  data: Array<{
    timestamp: string;
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens?: number;
    cache_read_input_tokens?: number;
  }>;
};

const INPUT_COST_PER_M = 3.0;
const OUTPUT_COST_PER_M = 15.0;

async function fetchAdminRange(
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

async function fetchFromAdminApi(credential: AnthropicCredential): Promise<UsageSummary> {
  const { start: mtdStart, end: mtdEnd } = getMTDRange();
  const { start: prevStart, end: prevEnd } = getPreviousMonthRange();
  const [currentRecords, previousRecords] = await Promise.all([
    fetchAdminRange(credential, mtdStart, mtdEnd),
    fetchAdminRange(credential, prevStart, prevEnd),
  ]);
  return {
    serviceType: ServiceType.Anthropic,
    currentPeriodCostUsd: currentRecords.reduce((s, r) => s + r.costUsd, 0),
    previousPeriodCostUsd: previousRecords.reduce((s, r) => s + r.costUsd, 0),
    dailyRecords: currentRecords,
    fetchedAt: new Date().toISOString(),
  };
}

// ── Individual path — reads from the local proxy usage store ──

type ProxyUsageResponse = {
  dailyRecords: Array<{ date: string; costUsd: number; tokens: number }>;
  totalCostUsd: number;
};

async function fetchProxyRange(startDate: string, endDate: string): Promise<ProxyUsageResponse> {
  const params = new URLSearchParams({ service: "anthropic", startDate, endDate });
  const res = await fetch(`/api/proxy/usage?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function fetchFromProxy(): Promise<UsageSummary> {
  const { start: mtdStart, end: mtdEnd } = getMTDRange();
  const { start: prevStart, end: prevEnd } = getPreviousMonthRange();
  const [current, previous] = await Promise.all([
    fetchProxyRange(mtdStart, mtdEnd),
    fetchProxyRange(prevStart, prevEnd),
  ]);
  return {
    serviceType: ServiceType.Anthropic,
    currentPeriodCostUsd: current.totalCostUsd,
    previousPeriodCostUsd: previous.totalCostUsd,
    dailyRecords: current.dailyRecords,
    fetchedAt: new Date().toISOString(),
  };
}

// ── Public entry point ────────────────────────────────────────────────────────

export async function fetchAnthropicUsage(
  credential: AnthropicCredential
): Promise<UsageSummary> {
  if (credential.accountType === "organization") {
    return fetchFromAdminApi(credential);
  }
  return fetchFromProxy();
}
