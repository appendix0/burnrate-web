"use client";

import { ServiceType } from "@/lib/constants/services";
import { useUsageStore, ServiceLoadState } from "@/lib/store/usageStore";

export function useUsage(service: ServiceType): ServiceLoadState {
  return useUsageStore((state) => state.services[service]);
}

export function useTotalSpend(): number {
  return useUsageStore((state) =>
    Object.values(state.services).reduce((sum, s) => {
      if (s.status === "loaded") return sum + s.data.currentPeriodCostUsd;
      return sum;
    }, 0)
  );
}
