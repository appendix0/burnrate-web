"use client";

import { create } from "zustand";
import { ServiceType, ALL_SERVICES } from "@/lib/constants/services";
import { UsageSummary } from "@/lib/models/usageSummary";

export type ServiceLoadState =
  | { status: "unconfigured" }
  | { status: "loading" }
  | { status: "loaded"; data: UsageSummary }
  | { status: "error"; message: string };

type UsageStoreState = {
  services: Record<ServiceType, ServiceLoadState>;
  setLoading: (service: ServiceType) => void;
  setLoaded: (service: ServiceType, data: UsageSummary) => void;
  setError: (service: ServiceType, message: string) => void;
  setUnconfigured: (service: ServiceType) => void;
  resetAll: () => void;
};

const initialServices = ALL_SERVICES.reduce(
  (acc, s) => ({ ...acc, [s]: { status: "unconfigured" } }),
  {} as Record<ServiceType, ServiceLoadState>
);

export const useUsageStore = create<UsageStoreState>()((set) => ({
  services: initialServices,

  setLoading: (service) =>
    set((state) => ({
      services: { ...state.services, [service]: { status: "loading" } },
    })),

  setLoaded: (service, data) =>
    set((state) => ({
      services: { ...state.services, [service]: { status: "loaded", data } },
    })),

  setError: (service, message) =>
    set((state) => ({
      services: { ...state.services, [service]: { status: "error", message } },
    })),

  setUnconfigured: (service) =>
    set((state) => ({
      services: { ...state.services, [service]: { status: "unconfigured" } },
    })),

  resetAll: () => set({ services: initialServices }),
}));
