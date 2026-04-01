import { ServiceType } from "@/lib/constants/services";

export type BudgetAlert = {
  serviceType: ServiceType;
  thresholdUsd: number;
  isEnabled: boolean;
  lastTriggeredAt?: string; // ISO datetime — debounce
};
