// Google does not expose billing data via API key.
// Usage is tracked via manual entry — this file is kept as a stub.
// The refresh hook handles Gemini directly without calling this source.

import { GeminiCredential } from "@/lib/models/credential";
import { UsageSummary } from "@/lib/models/usageSummary";
import { ServiceType } from "@/lib/constants/services";

export async function fetchGeminiUsage(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _credential: GeminiCredential
): Promise<UsageSummary> {
  throw new Error(
    "Gemini usage is tracked via manual entry. This source should not be called directly."
  );
}

// Suppress unused import warning
export type { ServiceType };
