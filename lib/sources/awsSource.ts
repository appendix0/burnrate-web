import { AWSCredential } from "@/lib/models/credential";
import { UsageSummary } from "@/lib/models/usageSummary";
import { UsageRecord } from "@/lib/models/usageRecord";
import { ServiceType } from "@/lib/constants/services";
import { getMTDRange, getPreviousMonthRange } from "@/lib/utils/dateRange";

// AWS Cost Explorer via /api/aws Route Handler proxy
// (Direct browser calls are blocked by AWS CORS policy)

type CostResult = {
  TimePeriod: { Start: string; End: string };
  Total: { UnblendedCost: { Amount: string; Unit: string } };
  Estimated: boolean;
};

async function fetchRange(
  credential: AWSCredential,
  startDate: string,
  endDate: string
): Promise<UsageRecord[]> {
  const res = await fetch("/api/aws", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential, startDate, endDate }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? `HTTP ${res.status}`);
  }

  const data = await res.json();

  return (data.ResultsByTime ?? []).map((r: CostResult) => ({
    date: r.TimePeriod.Start,
    costUsd: parseFloat(r.Total.UnblendedCost.Amount ?? "0"),
  }));
}

export async function fetchAWSUsage(
  credential: AWSCredential
): Promise<UsageSummary> {
  const { start: mtdStart, end: mtdEnd } = getMTDRange();
  const { start: prevStart, end: prevEnd } = getPreviousMonthRange();

  const [currentRecords, previousRecords] = await Promise.all([
    fetchRange(credential, mtdStart, mtdEnd),
    fetchRange(credential, prevStart, prevEnd),
  ]);

  return {
    serviceType: ServiceType.AWS,
    currentPeriodCostUsd: currentRecords.reduce((s, r) => s + r.costUsd, 0),
    previousPeriodCostUsd: previousRecords.reduce((s, r) => s + r.costUsd, 0),
    dailyRecords: currentRecords,
    fetchedAt: new Date().toISOString(),
  };
}
