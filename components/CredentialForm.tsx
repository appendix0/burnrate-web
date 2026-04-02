"use client";

import { useState, FormEvent } from "react";
import { ServiceType } from "@/lib/constants/services";

type FieldConfig = {
  key: string;
  label: string;
  placeholder: string;
  secret?: boolean;
  multiline?: boolean;
  required: boolean;
  hint?: string;
};

const FIELDS: Record<ServiceType, FieldConfig[]> = {
  [ServiceType.Anthropic]: [
    {
      key: "apiKey",
      label: "API Key",
      placeholder: "sk-ant-api03-...",
      secret: true,
      required: true,
      hint: "Found at console.anthropic.com → API Keys",
    },
  ],
  [ServiceType.OpenAI]: [
    {
      key: "apiKey",
      label: "API Key",
      placeholder: "sk-proj-...",
      secret: true,
      required: true,
      hint: "Found at platform.openai.com → API Keys",
    },
  ],
  [ServiceType.Gemini]: [
    {
      key: "apiKey",
      label: "API Key",
      placeholder: "AIzaSy...",
      secret: true,
      required: true,
      hint: "Found at aistudio.google.com → Get API Key",
    },
    {
      key: "projectId",
      label: "Project ID",
      placeholder: "my-project-123",
      required: false,
      hint: "Optional — needed for GCP billing data",
    },
  ],
  [ServiceType.AWS]: [
    {
      key: "accessKeyId",
      label: "Access Key ID",
      placeholder: "AKIAIOSFODNN7EXAMPLE",
      required: true,
      hint: "IAM user needs ce:GetCostAndUsage permission only",
    },
    {
      key: "secretAccessKey",
      label: "Secret Access Key",
      placeholder: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
      secret: true,
      required: true,
    },
    {
      key: "region",
      label: "Region",
      placeholder: "us-east-1",
      required: true,
      hint: "Cost Explorer is global but requires a region",
    },
  ],
  [ServiceType.Oracle]: [
    {
      key: "tenancyOcid",
      label: "Tenancy OCID",
      placeholder: "ocid1.tenancy.oc1..aaa...",
      required: true,
    },
    {
      key: "userOcid",
      label: "User OCID",
      placeholder: "ocid1.user.oc1..aaa...",
      required: true,
    },
    {
      key: "fingerprint",
      label: "API Key Fingerprint",
      placeholder: "xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx:xx",
      required: true,
    },
    {
      key: "privateKeyPem",
      label: "Private Key (PEM)",
      placeholder: "-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----",
      secret: true,
      multiline: true,
      required: true,
      hint: "The private key paired with the fingerprint above",
    },
    {
      key: "region",
      label: "Region",
      placeholder: "us-ashburn-1",
      required: true,
    },
  ],
};

interface CredentialFormProps {
  service: ServiceType;
  onSubmit: (values: Record<string, string>) => void;
  isLoading?: boolean;
}

export function CredentialForm({
  service,
  onSubmit,
  isLoading = false,
}: CredentialFormProps) {
  const fields = FIELDS[service];
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, ""]))
  );

  const isValid = fields
    .filter((f) => f.required)
    .every((f) => values[f.key].trim().length > 0);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    onSubmit(values);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {fields.map((field) => (
        <div key={field.key} className="flex flex-col gap-1.5">
          <label className="text-sm font-medium flex items-center gap-1.5">
            {field.label}
            {!field.required && (
              <span className="text-muted-foreground font-normal text-xs">
                optional
              </span>
            )}
          </label>

          {field.multiline ? (
            <textarea
              value={values[field.key]}
              onChange={(e) =>
                setValues((v) => ({ ...v, [field.key]: e.target.value }))
              }
              placeholder={field.placeholder}
              rows={6}
              spellCheck={false}
              className="bg-card border border-border rounded-md px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-burn/50 focus:border-burn/50 placeholder:text-muted-foreground/40 transition-colors"
            />
          ) : (
            <input
              type={field.secret ? "password" : "text"}
              value={values[field.key]}
              onChange={(e) =>
                setValues((v) => ({ ...v, [field.key]: e.target.value }))
              }
              placeholder={field.placeholder}
              autoComplete="off"
              spellCheck={false}
              className="bg-card border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-burn/50 focus:border-burn/50 placeholder:text-muted-foreground/40 transition-colors"
            />
          )}

          {field.hint && (
            <p className="text-xs text-muted-foreground">{field.hint}</p>
          )}
        </div>
      ))}

      <button
        type="submit"
        disabled={isLoading || !isValid}
        className="mt-1 py-2.5 rounded-lg bg-burn text-burn-foreground font-medium text-sm transition-opacity disabled:opacity-40"
      >
        {isLoading ? "Saving…" : "Save & Continue"}
      </button>
    </form>
  );
}
