// Google Cloud BigQuery billing proxy
//
// Authenticates with a service account key (RS256 JWT → OAuth2 access token),
// then queries the BigQuery billing export dataset for daily cost totals.
//
// Required GCP setup:
//   1. Enable billing export to BigQuery (Billing → Billing Export)
//   2. Create a service account with roles/bigquery.dataViewer
//   3. Download the JSON key and paste it into BurnRate

import { NextRequest, NextResponse } from "next/server";
import { createSign } from "crypto";
import { GCPCredential } from "@/lib/models/credential";

type ServiceAccountKey = {
  client_email: string;
  private_key: string;
};

type RequestBody = {
  credential: GCPCredential;
  startDate: string;
  endDate: string;
};

function base64url(data: string | Buffer): string {
  const b64 = Buffer.isBuffer(data)
    ? data.toString("base64")
    : Buffer.from(data).toString("base64");
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

async function getAccessToken(key: ServiceAccountKey): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64url(
    JSON.stringify({
      iss: key.client_email,
      scope: "https://www.googleapis.com/auth/bigquery.readonly",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  );

  const signingInput = `${header}.${payload}`;
  const sign = createSign("RSA-SHA256");
  sign.update(signingInput);
  const signature = base64url(sign.sign(key.private_key));
  const jwt = `${signingInput}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error_description ?? "OAuth token exchange failed");
  }
  return data.access_token as string;
}

export async function POST(request: NextRequest) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { credential, startDate, endDate } = body;

  if (!credential?.serviceAccountJson || !credential?.projectId || !credential?.datasetId) {
    return NextResponse.json({ error: "Missing GCP credentials" }, { status: 400 });
  }

  // Validate date format to prevent injection
  if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
    return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
  }

  let serviceAccountKey: ServiceAccountKey;
  try {
    serviceAccountKey = JSON.parse(credential.serviceAccountJson);
    if (!serviceAccountKey.client_email || !serviceAccountKey.private_key) {
      throw new Error("Missing client_email or private_key");
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Parse error";
    return NextResponse.json(
      { error: "InvalidKey", message: `Invalid service account JSON: ${message}` },
      { status: 400 }
    );
  }

  let accessToken: string;
  try {
    accessToken = await getAccessToken(serviceAccountKey);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Authentication failed";
    return NextResponse.json({ error: "AuthError", message }, { status: 401 });
  }

  // Query BigQuery billing export — daily net cost (post-credit)
  const query = `
    SELECT
      CAST(DATE(usage_start_time, "UTC") AS STRING) AS date,
      SUM(cost) + SUM(IFNULL((SELECT SUM(c.amount) FROM UNNEST(credits) c), 0)) AS cost_usd
    FROM \`${credential.projectId}.${credential.datasetId}.gcp_billing_export_v1_*\`
    WHERE DATE(usage_start_time, "UTC") >= '${startDate}'
      AND DATE(usage_start_time, "UTC") <= '${endDate}'
    GROUP BY date
    ORDER BY date
  `;

  const bqRes = await fetch(
    `https://bigquery.googleapis.com/bigquery/v2/projects/${credential.projectId}/queries`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, useLegacySql: false, timeoutMs: 30000 }),
    }
  );

  const bqData = await bqRes.json();

  if (!bqRes.ok) {
    return NextResponse.json(
      {
        error: "BigQueryError",
        message: bqData.error?.message ?? bqRes.statusText,
      },
      { status: bqRes.status }
    );
  }

  if (!bqData.jobComplete) {
    return NextResponse.json(
      { error: "QueryTimeout", message: "BigQuery query timed out — try again." },
      { status: 504 }
    );
  }

  const rows: { date: string; cost_usd: number }[] = (bqData.rows ?? []).map(
    (row: { f: { v: string }[] }) => ({
      date: row.f[0].v,
      cost_usd: parseFloat(row.f[1].v) || 0,
    })
  );

  return NextResponse.json({ rows });
}
