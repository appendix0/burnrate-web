"use client";

import { useCallback } from "react";
import { ServiceType } from "@/lib/constants/services";
import { Credential } from "@/lib/models/credential";
import { useCredentialStore } from "@/lib/store/credentialStore";
import { useUsageStore } from "@/lib/store/usageStore";
import { fetchAnthropicUsage } from "@/lib/sources/anthropicSource";
import { fetchOpenAIUsage } from "@/lib/sources/openaiSource";
import { fetchAWSUsage } from "@/lib/sources/awsSource";
import { UsageSummary } from "@/lib/models/usageSummary";

// Dispatches to the correct source based on credential type.
// Other services (Gemini, AWS, Oracle) throw until their phases are implemented.
async function fetchUsage(credential: Credential): Promise<UsageSummary> {
  switch (credential.type) {
    case ServiceType.Anthropic:
      return fetchAnthropicUsage(credential);
    case ServiceType.OpenAI:
      return fetchOpenAIUsage(credential);
    case ServiceType.Gemini:
      throw new Error("Gemini integration coming in Phase 7");
    case ServiceType.AWS:
      return fetchAWSUsage(credential);
    case ServiceType.Oracle:
      throw new Error("Oracle integration coming in Phase 6");
  }
}

export function useRefreshUsage() {
  const getCredential = useCredentialStore((s) => s.getCredential);
  const configuredServices = useCredentialStore((s) => s.configuredServices);
  const setLoading = useUsageStore((s) => s.setLoading);
  const setLoaded = useUsageStore((s) => s.setLoaded);
  const setError = useUsageStore((s) => s.setError);
  const setUnconfigured = useUsageStore((s) => s.setUnconfigured);

  const refresh = useCallback(
    async (service: ServiceType) => {
      setLoading(service);
      try {
        const credential = await getCredential(service);
        if (!credential) {
          setUnconfigured(service);
          return;
        }
        const summary = await fetchUsage(credential);
        setLoaded(service, summary);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Unknown error";
        setError(service, message);
      }
    },
    [getCredential, setLoading, setLoaded, setError, setUnconfigured]
  );

  const refreshAll = useCallback(() => {
    configuredServices.forEach(refresh);
  }, [configuredServices, refresh]);

  return { refresh, refreshAll };
}
