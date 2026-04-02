"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { BudgetAlert } from "@/lib/models/budgetAlert";
import { ServiceType } from "@/lib/constants/services";
import { STORAGE_KEYS } from "@/lib/constants/storageKeys";

type AlertStoreState = {
  alerts: BudgetAlert[];
  setAlert: (service: ServiceType, thresholdUsd: number) => void;
  toggleAlert: (service: ServiceType) => void;
  removeAlert: (service: ServiceType) => void;
  getAlert: (service: ServiceType) => BudgetAlert | undefined;
};

export const useAlertStore = create<AlertStoreState>()(
  persist(
    (set, get) => ({
      alerts: [],

      setAlert: (service, thresholdUsd) =>
        set((state) => {
          const idx = state.alerts.findIndex((a) => a.serviceType === service);
          if (idx >= 0) {
            const updated = [...state.alerts];
            updated[idx] = { ...updated[idx], thresholdUsd };
            return { alerts: updated };
          }
          return {
            alerts: [
              ...state.alerts,
              { serviceType: service, thresholdUsd, isEnabled: true },
            ],
          };
        }),

      toggleAlert: (service) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.serviceType === service ? { ...a, isEnabled: !a.isEnabled } : a
          ),
        })),

      removeAlert: (service) =>
        set((state) => ({
          alerts: state.alerts.filter((a) => a.serviceType !== service),
        })),

      getAlert: (service) =>
        get().alerts.find((a) => a.serviceType === service),
    }),
    {
      name: STORAGE_KEYS.budgetAlerts,
      skipHydration: true,
    }
  )
);
