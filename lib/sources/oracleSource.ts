import { OCICredential } from "@/lib/models/credential";
import { UsageSummary } from "@/lib/models/usageSummary";
import { UsageRecord } from "@/lib/models/usageRecord";
import { ServiceType } from "@/lib/constants/services";
import { getMTDRange, getPreviousMonthRange } from "@/lib/utils/dateRange";

// Oracle Cloud Usage API via /api/oracle Route Handler proxy
// (Direct browser calls are blocked by OCI CORS policy)

type OCIUsageItem = {
  timeUsageStarted: string; // ISO datetime
  timeUsageEnded: string;
  computedAmount: number;
  currency: string;
};

async function fetchRange(
  credential: OCICredential,
  startDate: string,
  endDate: string
): Promise<UsageRecord[]> {
  const res = await fetch("/api/oracle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential, startDate, endDate }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }

  const data = await res.json();

  return (data.items ?? []).map((item: OCIUsageItem) => ({
    date: item.timeUsageStarted.slice(0, 10),
    costUsd: item.computedAmount ?? 0,
  }));
}

export async function fetchOracleUsage(
  credential: OCICredential
): Promise<UsageSummary> {
  const { start: mtdStart, end: mtdEnd } = getMTDRange();
  const { start: prevStart, end: prevEnd } = getPreviousMonthRange();

  const [currentRecords, previousRecords] = await Promise.all([
    fetchRange(credential, mtdStart, mtdEnd),
    fetchRange(credential, prevStart, prevEnd),
  ]);

  return {
    serviceType: ServiceType.Oracle,
    currentPeriodCostUsd: currentRecords.reduce((s, r) => s + r.costUsd, 0),
    previousPeriodCostUsd: previousRecords.reduce((s, r) => s + r.costUsd, 0),
    dailyRecords: currentRecords,
    fetchedAt: new Date().toISOString(),
  };
}
