import { GeminiCredential } from "@/lib/models/credential";
import { UsageSummary } from "@/lib/models/usageSummary";
import { ServiceType } from "@/lib/constants/services";
import { getMTDRange, getPreviousMonthRange } from "@/lib/utils/dateRange";

// Google does not expose billing data via API key for individual accounts.
// Usage is tracked via the proxy from live API calls.

type ProxyUsageResponse = {
  dailyRecords: Array<{ date: string; costUsd: number; tokens: number }>;
  totalCostUsd: number;
};

async function fetchProxyRange(startDate: string, endDate: string): Promise<ProxyUsageResponse> {
  const params = new URLSearchParams({ service: "gemini", startDate, endDate });
  const res = await fetch(`/api/proxy/usage?${params}`);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchGeminiUsage(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _credential: GeminiCredential
): Promise<UsageSummary> {
  const { start: mtdStart, end: mtdEnd } = getMTDRange();
  const { start: prevStart, end: prevEnd } = getPreviousMonthRange();
  const [current, previous] = await Promise.all([
    fetchProxyRange(mtdStart, mtdEnd),
    fetchProxyRange(prevStart, prevEnd),
  ]);
  return {
    serviceType: ServiceType.Gemini,
    currentPeriodCostUsd: current.totalCostUsd,
    previousPeriodCostUsd: previous.totalCostUsd,
    dailyRecords: current.dailyRecords,
    fetchedAt: new Date().toISOString(),
  };
}
