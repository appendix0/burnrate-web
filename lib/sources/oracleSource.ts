// Phase 6 — Oracle Cloud Usage API
// POST usageapi.{region}.oci.oraclecloud.com/20200107/usage  |  RSA-SHA256 signed
// Requires Next.js Route Handler proxy (app/api/oracle/route.ts) — CORS blocked in browser
import { OCICredential } from "@/lib/models/credential";
import { UsageSummary } from "@/lib/models/usageSummary";

export async function fetchOracleUsage(
  _credential: OCICredential
): Promise<UsageSummary> {
  throw new Error("Not implemented — Phase 6");
}
