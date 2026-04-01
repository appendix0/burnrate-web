// Phase 3 — Zustand store for per-service usage data
// One slice per ServiceType, mirrors Riverpod usageSummaryProvider(ServiceType) family
import { ServiceType } from "@/lib/constants/services";
import { UsageSummary } from "@/lib/models/usageSummary";

export type ServiceLoadState =
  | { status: "unconfigured" }
  | { status: "loading" }
  | { status: "loaded"; data: UsageSummary }
  | { status: "error"; message: string };

export type UsageState = Record<ServiceType, ServiceLoadState>;

// Store implementation — Phase 3
