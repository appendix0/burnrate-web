// CORS proxy for AWS Cost Explorer
//
// AWS Cost Explorer (ce.us-east-1.amazonaws.com) blocks browser requests.
// The browser POSTs the credential + date range here; this Route Handler
// signs the request with SigV4 and forwards it to AWS, then returns the result.
//
// The credential is only in transit (HTTPS) and never stored server-side.

import { NextRequest, NextResponse } from "next/server";
import { signAWSRequest } from "@/lib/sources/awsSigV4";
import { AWSCredential } from "@/lib/models/credential";

type RequestBody = {
  credential: AWSCredential;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
};

const AWS_CE_URL = "https://ce.us-east-1.amazonaws.com/";
const CE_TARGET = "AWSInsightsIndexService.GetCostAndUsage";

export async function POST(request: NextRequest) {
  let body: RequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { credential, startDate, endDate } = body;

  if (!credential?.accessKeyId || !credential?.secretAccessKey) {
    return NextResponse.json({ error: "Missing AWS credentials" }, { status: 400 });
  }

  const ceBody = JSON.stringify({
    TimePeriod: { Start: startDate, End: endDate },
    Granularity: "DAILY",
    Metrics: ["UnblendedCost"],
  });

  const signedHeaders = signAWSRequest({
    method: "POST",
    url: AWS_CE_URL,
    body: ceBody,
    accessKeyId: credential.accessKeyId,
    secretAccessKey: credential.secretAccessKey,
    region: "us-east-1", // Cost Explorer is always us-east-1 regardless of credential region
    service: "ce",
    extraHeaders: {
      "x-amz-target": CE_TARGET,
    },
  });

  const awsResponse = await fetch(AWS_CE_URL, {
    method: "POST",
    headers: signedHeaders,
    body: ceBody,
  });

  const data = await awsResponse.json().catch(() => ({}));

  if (!awsResponse.ok) {
    return NextResponse.json(
      {
        error: data.__type ?? "AWSError",
        message: data.message ?? awsResponse.statusText,
      },
      { status: awsResponse.status }
    );
  }

  return NextResponse.json(data);
}
