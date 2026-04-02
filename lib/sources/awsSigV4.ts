// AWS Signature Version 4 (HMAC-SHA256)
// Server-side only — uses Node.js crypto module.
// Called exclusively from app/api/aws/route.ts (Next.js Route Handler).
//
// Spec: https://docs.aws.amazon.com/general/latest/gr/sigv4-create-canonical-request.html

import { createHmac, createHash } from "crypto";

function sha256Hex(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("hex");
}

function hmac(key: Buffer | string, data: string): Buffer {
  return createHmac("sha256", key).update(data, "utf8").digest();
}

export type SignedHeaders = Record<string, string>;

export function signAWSRequest(params: {
  method: string;
  url: string;
  body: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  service: string;
  extraHeaders?: Record<string, string>;
}): SignedHeaders {
  const {
    method,
    url,
    body,
    accessKeyId,
    secretAccessKey,
    region,
    service,
    extraHeaders = {},
  } = params;

  const urlObj = new URL(url);

  // Timestamps
  const now = new Date();
  const amzDate =
    now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "") + "";
  // Normalise to: 20240101T000000Z
  const cleanAmzDate = now
    .toISOString()
    .replace(/[-:]/g, "")
    .split(".")[0] + "Z";
  const dateStamp = cleanAmzDate.slice(0, 8);

  // Build headers map (lowercase keys — required by SigV4)
  const headers: Record<string, string> = {
    host: urlObj.hostname,
    "x-amz-date": cleanAmzDate,
    "content-type": "application/x-amz-json-1.1",
    ...Object.fromEntries(
      Object.entries(extraHeaders).map(([k, v]) => [k.toLowerCase(), v])
    ),
  };

  // Sort header keys alphabetically
  const sortedKeys = Object.keys(headers).sort();
  const canonicalHeaders =
    sortedKeys.map((k) => `${k}:${headers[k].trim()}`).join("\n") + "\n";
  const signedHeaders = sortedKeys.join(";");

  // Canonical request
  const bodyHash = sha256Hex(body);
  const canonicalRequest = [
    method.toUpperCase(),
    urlObj.pathname || "/",
    urlObj.search ? urlObj.search.slice(1) : "", // query string without leading ?
    canonicalHeaders,
    signedHeaders,
    bodyHash,
  ].join("\n");

  // Credential scope + string to sign
  const algorithm = "AWS4-HMAC-SHA256";
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    algorithm,
    cleanAmzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join("\n");

  // Signing key chain: kSecret → kDate → kRegion → kService → kSigning
  const kDate = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, "aws4_request");
  const signature = hmac(kSigning, stringToSign).toString("hex");

  // Authorization header
  const authorization = [
    `${algorithm} Credential=${accessKeyId}/${credentialScope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(", ");

  return {
    ...headers,
    authorization,
  };
}
