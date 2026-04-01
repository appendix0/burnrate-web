// Phase 3 — OpenAI billing API
// GET /v1/dashboard/billing/usage  |  Bearer token
import { OpenAICredential } from "@/lib/models/credential";
import { UsageSummary } from "@/lib/models/usageSummary";

export async function fetchOpenAIUsage(
  _credential: OpenAICredential
): Promise<UsageSummary> {
  throw new Error("Not implemented — Phase 3");
}
