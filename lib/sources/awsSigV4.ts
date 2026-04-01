// Phase 4 — AWS Signature Version 4 (HMAC-SHA256)
// Port of aws_sigv4_signer.dart → TypeScript using Web Crypto SubtleCrypto
// Used by awsSource.ts to sign Cost Explorer requests

export type SignedHeaders = Record<string, string>;

export async function signRequest(_params: {
  method: string;
  url: string;
  body: string;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  service: string;
}): Promise<SignedHeaders> {
  throw new Error("Not implemented — Phase 4");
}
