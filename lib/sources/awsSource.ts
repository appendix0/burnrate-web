// Phase 4 — AWS Cost Explorer
// POST https://ce.us-east-1.amazonaws.com/  |  AWS V4 signed
// Requires Next.js Route Handler proxy (app/api/aws/route.ts) — CORS blocked in browser
import { AWSCredential } from "@/lib/models/credential";
import { UsageSummary } from "@/lib/models/usageSummary";

export async function fetchAWSUsage(
  _credential: AWSCredential
): Promise<UsageSummary> {
  throw new Error("Not implemented — Phase 4");
}
