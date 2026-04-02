"use client";

import { useCallback } from "react";
import { ServiceType } from "@/lib/constants/services";
import { AnthropicCredential, Credential } from "@/lib/models/credential";
import { useCredentialStore } from "@/lib/store/credentialStore";
import { useUsageStore } from "@/lib/store/usageStore";
import { useManualUsageStore, ManualUsageEntry } from "@/lib/store/manualUsageStore";
import { fetchAnthropicUsage } from "@/lib/sources/anthropicSource";
import { fetchAWSUsage } from "@/lib/sources/awsSource";
import { fetchOracleUsage } from "@/lib/sources/oracleSource";
import { UsageSummary } from "@/lib/models/usageSummary";

// Services that always use manual entry (no billing API available)
const ALWAYS_MANUAL = new Set<ServiceType>([ServiceType.OpenAI, ServiceType.Gemini]);

function isManualCredential(credential: Credential): boolean {
  if (ALWAYS_MANUAL.has(credential.type)) return true;
  if (credential.type === ServiceType.Anthropic) {
    return (credential as AnthropicCredential).accountType === "individual";
  }
  return false;
}

function manualEntryToSummary(
  service: ServiceType,
  entry: ManualUsageEntry | undefined
): UsageSummary {
  return {
    serviceType: service,
    currentPeriodCostUsd: entry?.currentMonthSpend ?? 0,
    previousPeriodCostUsd: entry?.previousMonthSpend ?? 0,
    dailyRecords: [],
    fetchedAt: entry?.updatedAt ?? new Date().toISOString(),
  };
}

async function fetchApiUsage(credential: Credential): Promise<UsageSummary> {
  switch (credential.type) {
    case ServiceType.Anthropic:
      return fetchAnthropicUsage(credential as AnthropicCredential);
    case ServiceType.AWS:
      return fetchAWSUsage(credential);
    case ServiceType.Oracle:
      return fetchOracleUsage(credential);
    default:
      throw new Error(`No API source for ${credential.type}`);
  }
}

export function useRefreshUsage() {
  const getCredential = useCredentialStore((s) => s.getCredential);
  const configuredServices = useCredentialStore((s) => s.configuredServices);
  const setLoading = useUsageStore((s) => s.setLoading);
  const setLoaded = useUsageStore((s) => s.setLoaded);
  const setError = useUsageStore((s) => s.setError);
  const setUnconfigured = useUsageStore((s) => s.setUnconfigured);
  const getManualEntry = useManualUsageStore((s) => s.getEntry);

  const refresh = useCallback(
    async (service: ServiceType) => {
      setLoading(service);
      try {
        const credential = await getCredential(service);
        if (!credential) {
          setUnconfigured(service);
          return;
        }

        if (isManualCredential(credential)) {
          // Manual entry — read from local store, never fails
          const entry = getManualEntry(service);
          setLoaded(service, manualEntryToSummary(service, entry));
          return;
        }

        // API-based fetch
        const summary = await fetchApiUsage(credential);
        setLoaded(service, summary);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Unknown error";
        setError(service, message);
      }
    },
    [getCredential, setLoading, setLoaded, setError, setUnconfigured, getManualEntry]
  );

  const refreshAll = useCallback(() => {
    configuredServices.forEach(refresh);
  }, [configuredServices, refresh]);

  return { refresh, refreshAll };
}
