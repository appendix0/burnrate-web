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
  [ServiceType.Anthropic]: [], // handled by AnthropicForm below
  [ServiceType.OpenAI]: [], // manual entry — no API key needed
  [ServiceType.Gemini]: [],  // manual entry — no API key needed
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
  [ServiceType.GoogleCloud]: [],
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

// ── Anthropic: account type selector ─────────────────────────────────────────

function AnthropicForm({
  onSubmit,
  isLoading,
}: {
  onSubmit: (values: Record<string, string>) => void;
  isLoading: boolean;
}) {
  const [accountType, setAccountType] = useState<"individual" | "organization" | null>(null);
  const [apiKey, setApiKey] = useState("");

  const canSubmit =
    accountType === "individual" ||
    (accountType === "organization" && apiKey.trim().length > 0);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !accountType) return;
    onSubmit({ accountType, apiKey: apiKey.trim() });
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Account type selector */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Account type</p>
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              {
                value: "individual" as const,
                label: "Individual",
                sub: "Personal / free-tier account",
              },
              {
                value: "organization" as const,
                label: "Organization",
                sub: "Team or enterprise account",
              },
            ] as const
          ).map(({ value, label, sub }) => (
            <button
              key={value}
              type="button"
              onClick={() => setAccountType(value)}
              className={`flex flex-col gap-0.5 p-3 rounded-lg border text-left transition-all ${
                accountType === value
                  ? "border-burn/60 bg-burn/10"
                  : "border-border bg-card hover:bg-accent"
              }`}
            >
              <span className="text-sm font-medium">{label}</span>
              <span className="text-xs text-muted-foreground">{sub}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Individual — proxy explanation */}
      {accountType === "individual" && (
        <div className="rounded-lg border border-border bg-muted/30 p-4 flex flex-col gap-2">
          <p className="text-sm font-medium">Tracked via proxy</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Individual Anthropic accounts don&apos;t have a billing API. BurnRate will
            act as a proxy between your code and Anthropic — it reads token counts
            from each response and tallies the cost automatically.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            After saving, go to <strong>Settings → Proxy Setup</strong> for a
            one-line code change to point your SDK at BurnRate.
          </p>
        </div>
      )}

      {/* Organization — Admin API key */}
      {accountType === "organization" && (
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium">Admin API Key</label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-ant-admin01-..."
            autoComplete="off"
            spellCheck={false}
            className="bg-card border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-burn/50 focus:border-burn/50 placeholder:text-muted-foreground/40 transition-colors"
          />
          <p className="text-xs text-muted-foreground">
            Create an Admin key at console.anthropic.com → Settings → API Keys
          </p>
        </div>
      )}

      {accountType && (
        <button
          type="submit"
          disabled={isLoading || !canSubmit}
          className="mt-1 py-2.5 rounded-lg bg-burn text-burn-foreground font-medium text-sm transition-opacity disabled:opacity-40"
        >
          {isLoading ? "Saving…" : "Save & Continue"}
        </button>
      )}
    </form>
  );
}

const MANUAL_ENTRY_SERVICES = new Set([ServiceType.OpenAI, ServiceType.Gemini, ServiceType.GoogleCloud]);

const MANUAL_ENTRY_HINTS: Partial<Record<ServiceType, { body: string; dashboardLabel: string }>> = {
  [ServiceType.OpenAI]: {
    body: "OpenAI's billing API is deprecated for individual accounts.",
    dashboardLabel: "platform.openai.com/usage",
  },
  [ServiceType.Gemini]: {
    body: "Google does not expose billing data via API key.",
    dashboardLabel: "aistudio.google.com",
  },
  [ServiceType.GoogleCloud]: {
    body: "Google Cloud billing data requires a BigQuery export setup and is not accessible via a simple API key.",
    dashboardLabel: "console.cloud.google.com/billing",
  },
};

// ── Generic form (OpenAI, Gemini, AWS, Oracle) ────────────────────────────────

export function CredentialForm({
  service,
  onSubmit,
  isLoading = false,
}: CredentialFormProps) {
  // Hooks must always be called — FIELDS[Anthropic/OpenAI/Gemini] are [] so values is {} there
  const fields = FIELDS[service];
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(fields.map((f) => [f.key, ""]))
  );

  if (service === ServiceType.Anthropic) {
    return <AnthropicForm onSubmit={onSubmit} isLoading={isLoading} />;
  }

  // Manual-entry services — no fields, just a notice + confirm
  if (MANUAL_ENTRY_SERVICES.has(service)) {
    const hint = MANUAL_ENTRY_HINTS[service]!;
    return (
      <div className="flex flex-col gap-5">
        <div className="rounded-lg border border-border bg-muted/30 p-4 flex flex-col gap-2">
          <p className="text-sm font-medium">Manual entry required</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{hint.body}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            After adding this service, you&apos;ll enter your spend on the detail page.
            Check your actual usage at{" "}
            <span className="font-mono">{hint.dashboardLabel}</span>.
          </p>
        </div>
        <button
          type="button"
          disabled={isLoading}
          onClick={() => onSubmit({})}
          className="py-2.5 rounded-lg bg-burn text-burn-foreground font-medium text-sm transition-opacity disabled:opacity-40"
        >
          {isLoading ? "Saving…" : "Add & Continue"}
        </button>
      </div>
    );
  }

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
              <span className="text-muted-foreground font-normal text-xs">optional</span>
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
