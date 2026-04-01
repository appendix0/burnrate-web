// Phase 3 — hook to fetch + cache usage per service
import { ServiceType } from "@/lib/constants/services";

export function useUsage(_service: ServiceType) {
  // Phase 3 implementation
  return { status: "unconfigured" as const };
}
