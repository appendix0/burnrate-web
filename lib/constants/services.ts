export enum ServiceType {
  Anthropic = "anthropic",
  OpenAI = "openai",
  Gemini = "gemini",
  AWS = "aws",
  Oracle = "oracle",
}

export const SERVICE_METADATA: Record<
  ServiceType,
  { label: string; color: string; description: string }
> = {
  [ServiceType.Anthropic]: {
    label: "Anthropic",
    color: "#d97706",
    description: "Claude API usage",
  },
  [ServiceType.OpenAI]: {
    label: "OpenAI",
    color: "#10b981",
    description: "GPT API usage",
  },
  [ServiceType.Gemini]: {
    label: "Gemini",
    color: "#3b82f6",
    description: "Google AI Studio usage",
  },
  [ServiceType.AWS]: {
    label: "AWS",
    color: "#f59e0b",
    description: "Amazon Web Services cost",
  },
  [ServiceType.Oracle]: {
    label: "Oracle Cloud",
    color: "#ef4444",
    description: "OCI usage cost",
  },
};

export const ALL_SERVICES = Object.values(ServiceType);
