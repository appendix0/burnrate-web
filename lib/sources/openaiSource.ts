// OpenAI billing API is deprecated for new accounts.
// Usage is tracked via manual entry — this file is kept as a stub.
// The refresh hook handles OpenAI directly without calling this source.

import { OpenAICredential } from "@/lib/models/credential";
import { UsageSummary } from "@/lib/models/usageSummary";
import { ServiceType } from "@/lib/constants/services";

export async function fetchOpenAIUsage(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _credential: OpenAICredential
): Promise<UsageSummary> {
  throw new Error(
    "OpenAI usage is tracked via manual entry. This source should not be called directly."
  );
}

// Suppress unused import warning
export type { ServiceType };
