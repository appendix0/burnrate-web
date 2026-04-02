import { GeminiCredential } from "@/lib/models/credential";
import { UsageSummary } from "@/lib/models/usageSummary";
import { ServiceType } from "@/lib/constants/services";

// Gemini / Google AI Studio billing
//
// Google does not expose aggregate billing data via a simple API key.
// The Cloud Billing API (cloudbilling.googleapis.com) requires OAuth2 with
// a GCP service account — outside the scope of the API-key-only model we use.
//
// What IS accessible with an API key:
//   - Per-request token counts in response metadata (not stored by Google)
//   - No aggregate usage or cost endpoint
//
// Phase 7 status: returns a clear error so the dashboard shows an informative
// message rather than silently failing. OAuth2-based GCP billing is planned
// as a future enhancement.

export async function fetchGeminiUsage(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _credential: GeminiCredential
): Promise<UsageSummary> {
  throw new Error(
    "Gemini billing data requires GCP OAuth2 — API key access is not supported by Google. " +
    "Full GCP billing integration is planned as a future update."
  );
}
