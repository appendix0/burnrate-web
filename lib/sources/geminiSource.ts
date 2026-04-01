// Phase 7 — Gemini / AI Studio usage
// Token counts + estimated cost (hardcoded rates in Phase 7)
// Full GCP billing OAuth2 is out of scope for web v1
import { GeminiCredential } from "@/lib/models/credential";
import { UsageSummary } from "@/lib/models/usageSummary";

export async function fetchGeminiUsage(
  _credential: GeminiCredential
): Promise<UsageSummary> {
  throw new Error("Not implemented — Phase 7");
}
