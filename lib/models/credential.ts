import { ServiceType } from "@/lib/constants/services";

export type AnthropicCredential = {
  type: ServiceType.Anthropic;
  // "individual" uses the proxy to track usage; "organization" uses the Admin API directly.
  accountType: "individual" | "organization";
  apiKey?: string; // required for organization accounts only
};

export type OpenAICredential = {
  type: ServiceType.OpenAI;
  apiKey: string;
};

export type GeminiCredential = {
  type: ServiceType.Gemini;
  apiKey: string;
  projectId?: string;
};

export type AWSCredential = {
  type: ServiceType.AWS;
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
};

export type OCICredential = {
  type: ServiceType.Oracle;
  tenancyOcid: string;
  userOcid: string;
  fingerprint: string;
  privateKeyPem: string;
  region: string;
};

export type Credential =
  | AnthropicCredential
  | OpenAICredential
  | GeminiCredential
  | AWSCredential
  | OCICredential;
