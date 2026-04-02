import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ServiceType } from "@/lib/constants/services";

export type ManualUsageEntry = {
  serviceType: ServiceType;
  currentMonthSpend: number;
  previousMonthSpend: number;
  updatedAt: string; // ISO
};

type ManualUsageStore = {
  entries: ManualUsageEntry[];
  setEntry: (service: ServiceType, current: number, previous: number) => void;
  getEntry: (service: ServiceType) => ManualUsageEntry | undefined;
  removeEntry: (service: ServiceType) => void;
};

export const useManualUsageStore = create<ManualUsageStore>()(
  persist(
    (set, get) => ({
      entries: [],
      setEntry: (service, current, previous) => {
        const entry: ManualUsageEntry = {
          serviceType: service,
          currentMonthSpend: current,
          previousMonthSpend: previous,
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          entries: [
            ...state.entries.filter((e) => e.serviceType !== service),
            entry,
          ],
        }));
      },
      getEntry: (service) =>
        get().entries.find((e) => e.serviceType === service),
      removeEntry: (service) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.serviceType !== service),
        })),
    }),
    { name: "burnrate_manual_usage" }
  )
);
