// CORS proxy for Oracle Cloud Usage API
//
// OCI's usageapi endpoint blocks browser requests.
// The browser POSTs the credential + date range here; this Route Handler
// signs the request with OCI HTTP Signature (RSA-SHA256) and forwards it.
//
// The credential (incl. private key PEM) is only in transit over HTTPS
// and is never stored server-side.

import { NextRequest, NextResponse } from "next/server";
import { signOCIRequest } from "@/lib/sources/ociSigner";
import { OCICredential } from "@/lib/models/credential";

type RequestBody = {
  credential: OCICredential;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
};

export async function POST(request: NextRequest) {
  let body: RequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { credential, startDate, endDate } = body;

  if (!credential?.tenancyOcid || !credential?.privateKeyPem) {
    return NextResponse.json({ error: "Missing OCI credentials" }, { status: 400 });
  }

  const url = `https://usageapi.${credential.region}.oci.oraclecloud.com/20200107/usage`;

  // OCI requires both timestamps to be exactly midnight (00:00:00.000Z).
  // Use the next day as the exclusive end boundary.
  const endDateExclusive = new Date(`${endDate}T00:00:00.000Z`);
  endDateExclusive.setUTCDate(endDateExclusive.getUTCDate() + 1);
  const endDateStr = endDateExclusive.toISOString().replace(/\.\d{3}Z$/, ".000Z");

  const ociBody = JSON.stringify({
    tenantId: credential.tenancyOcid,
    timeUsageStarted: `${startDate}T00:00:00.000Z`,
    timeUsageEnded: endDateStr,
    granularity: "DAILY",
    queryType: "COST",
  });

  let signedHeaders: Record<string, string>;

  try {
    signedHeaders = signOCIRequest({
      method: "POST",
      url,
      body: ociBody,
      tenancyOcid: credential.tenancyOcid,
      userOcid: credential.userOcid,
      fingerprint: credential.fingerprint,
      privateKeyPem: credential.privateKeyPem,
    });
  } catch (err) {
    // Most likely cause: malformed private key PEM
    const message = err instanceof Error ? err.message : "Signing failed";
    return NextResponse.json(
      { error: "SigningError", message: `Failed to sign request: ${message}` },
      { status: 400 }
    );
  }

  const ociResponse = await fetch(url, {
    method: "POST",
    headers: signedHeaders,
    body: ociBody,
  });

  const data = await ociResponse.json().catch(() => ({}));

  if (!ociResponse.ok) {
    return NextResponse.json(
      {
        error: data.code ?? "OCIError",
        message: data.message ?? ociResponse.statusText,
      },
      { status: ociResponse.status }
    );
  }

  return NextResponse.json(data);
}
