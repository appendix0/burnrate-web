// Phase 3 — Anthropic usage API
// GET /v1/usage  |  x-api-key header
import { AnthropicCredential } from "@/lib/models/credential";
import { UsageSummary } from "@/lib/models/usageSummary";

export async function fetchAnthropicUsage(
  _credential: AnthropicCredential
): Promise<UsageSummary> {
  throw new Error("Not implemented — Phase 3");
}
