"use client";

import { useAlertStore } from "@/lib/store/alertStore";
import { ServiceType } from "@/lib/constants/services";
import { BudgetAlert } from "@/lib/models/budgetAlert";

export function useBudgetAlert(service: ServiceType): BudgetAlert | undefined {
  return useAlertStore((state) => state.getAlert(service));
}

export function useIsOverBudget(
  service: ServiceType,
  currentSpendUsd: number
): boolean {
  const alert = useBudgetAlert(service);
  if (!alert || !alert.isEnabled) return false;
  return currentSpendUsd >= alert.thresholdUsd;
}
