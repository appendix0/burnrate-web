import { ServiceType } from "@/lib/constants/services";
import { UsageRecord } from "./usageRecord";

export type UsageSummary = {
  serviceType: ServiceType;
  currentPeriodCostUsd: number;
  previousPeriodCostUsd: number;
  dailyRecords: UsageRecord[];
  fetchedAt: string; // ISO datetime
  needsManualInput?: boolean; // true when manual-entry service has no data yet
};
