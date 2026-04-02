// Oracle Cloud Infrastructure HTTP Signature (RSA-SHA256)
// Server-side only — uses Node.js crypto module.
// Called exclusively from app/api/oracle/route.ts (Next.js Route Handler).
//
// Spec: https://docs.oracle.com/en-us/iaas/Content/API/Concepts/signingrequests.htm
//
// Signing flow:
//   1. Build signing string from (request-target) + selected HTTP headers
//   2. Sign with RSA-SHA256 using the user's private key PEM
//   3. Assemble Authorization header in OCI Signature format

import { createSign, createHash } from "crypto";

function sha256Base64(data: string): string {
  return createHash("sha256").update(data, "utf8").digest("base64");
}

export function signOCIRequest(params: {
  method: string;
  url: string;
  body: string;
  tenancyOcid: string;
  userOcid: string;
  fingerprint: string;
  privateKeyPem: string;
}): Record<string, string> {
  const { method, url, body, tenancyOcid, userOcid, fingerprint, privateKeyPem } =
    params;

  const urlObj = new URL(url);
  const host = urlObj.hostname;
  const path = urlObj.pathname + (urlObj.search || "");

  // OCI requires RFC 7231 date (HTTP date format)
  const date = new Date().toUTCString();

  const contentType = "application/json";
  const contentLength = Buffer.byteLength(body, "utf8").toString();
  const xContentSha256 = sha256Base64(body);

  // Headers included in the signature (order matters for the signing string)
  const headersToSign = [
    "(request-target)",
    "date",
    "host",
    "content-length",
    "content-type",
    "x-content-sha256",
  ];

  // Build the signing string — each header on its own line: "name: value"
  const signingString = [
    `(request-target): ${method.toLowerCase()} ${path}`,
    `date: ${date}`,
    `host: ${host}`,
    `content-length: ${contentLength}`,
    `content-type: ${contentType}`,
    `x-content-sha256: ${xContentSha256}`,
  ].join("\n");

  // Sign with RSA-SHA256
  const signer = createSign("RSA-SHA256");
  signer.update(signingString, "utf8");
  const signature = signer.sign(privateKeyPem, "base64");

  // keyId format: tenancyOcid/userOcid/fingerprint
  const keyId = `${tenancyOcid}/${userOcid}/${fingerprint}`;

  const authorization =
    `Signature version="1",` +
    `headers="${headersToSign.join(" ")}",` +
    `keyId="${keyId}",` +
    `algorithm="rsa-sha256",` +
    `signature="${signature}"`;

  return {
    date,
    host,
    "content-length": contentLength,
    "content-type": contentType,
    "x-content-sha256": xContentSha256,
    authorization,
  };
}
