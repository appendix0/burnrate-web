import { OpenAICredential } from "@/lib/models/credential";
import { UsageSummary } from "@/lib/models/usageSummary";
import { ServiceType } from "@/lib/constants/services";
import { getMTDRange, getPreviousMonthRange } from "@/lib/utils/dateRange";

// OpenAI billing APIs are restricted to organisation accounts.
// Individual accounts use the proxy to track usage from live API calls.

type ProxyUsageResponse = {
  dailyRecords: Array<{ date: string; costUsd: number; tokens: number }>;
  totalCostUsd: number;
};

async function fetchProxyRange(startDate: string, endDate: string): Promise<ProxyUsageResponse> {
  const params = new URLSearchParams({ service: "openai", startDate, endDate });
  const res = await fetch(`/api/proxy/usage?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchOpenAIUsage(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _credential: OpenAICredential
): Promise<UsageSummary> {
  const { start: mtdStart, end: mtdEnd } = getMTDRange();
  const { start: prevStart, end: prevEnd } = getPreviousMonthRange();
  const [current, previous] = await Promise.all([
    fetchProxyRange(mtdStart, mtdEnd),
    fetchProxyRange(prevStart, prevEnd),
  ]);
  return {
    serviceType: ServiceType.OpenAI,
    currentPeriodCostUsd: current.totalCostUsd,
    previousPeriodCostUsd: previous.totalCostUsd,
    dailyRecords: current.dailyRecords,
    fetchedAt: new Date().toISOString(),
  };
}
