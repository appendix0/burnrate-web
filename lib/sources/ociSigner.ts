// Phase 6 — Oracle Cloud Infrastructure RSA-SHA256 request signing
// Port of OCI RSA signer from Dart → TypeScript using Web Crypto SubtleCrypto
// Used by oracleSource.ts

export async function signOCIRequest(_params: {
  method: string;
  url: string;
  body?: string;
  tenancyOcid: string;
  userOcid: string;
  fingerprint: string;
  privateKeyPem: string;
}): Promise<Record<string, string>> {
  throw new Error("Not implemented — Phase 6");
}
