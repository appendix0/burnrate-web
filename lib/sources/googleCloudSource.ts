import { GCPCredential } from "@/lib/models/credential";
import { UsageSummary } from "@/lib/models/usageSummary";
import { UsageRecord } from "@/lib/models/usageRecord";
import { ServiceType } from "@/lib/constants/services";
import { getMTDRange, getPreviousMonthRange } from "@/lib/utils/dateRange";

async function fetchRange(
  credential: GCPCredential,
  startDate: string,
  endDate: string
): Promise<UsageRecord[]> {
  const res = await fetch("/api/googlecloud", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential, startDate, endDate }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }

  const data = await res.json();
  return (data.rows ?? []).map((row: { date: string; cost_usd: number }) => ({
    date: row.date,
    costUsd: row.cost_usd,
  }));
}

export async function fetchGoogleCloudUsage(
  credential: GCPCredential
): Promise<UsageSummary> {
  const { start: mtdStart, end: mtdEnd } = getMTDRange();
  const { start: prevStart, end: prevEnd } = getPreviousMonthRange();

  const [currentRecords, previousRecords] = await Promise.all([
    fetchRange(credential, mtdStart, mtdEnd),
    fetchRange(credential, prevStart, prevEnd),
  ]);

  return {
    serviceType: ServiceType.GoogleCloud,
    currentPeriodCostUsd: currentRecords.reduce((s, r) => s + r.costUsd, 0),
    previousPeriodCostUsd: previousRecords.reduce((s, r) => s + r.costUsd, 0),
    dailyRecords: currentRecords,
    fetchedAt: new Date().toISOString(),
  };
}
