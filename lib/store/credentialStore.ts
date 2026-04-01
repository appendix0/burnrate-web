// Phase 1 — Zustand store tracking which services are configured
// Source of truth is encrypted localStorage; this is the in-memory cache
import { ServiceType } from "@/lib/constants/services";

export type CredentialStoreState = {
  configuredServices: ServiceType[];
};

// Store implementation — Phase 1
