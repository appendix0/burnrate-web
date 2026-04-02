"use client";

import { useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { ServiceType, SERVICE_METADATA } from "@/lib/constants/services";
import { ServiceIcon } from "@/components/ServiceIcon";
import { useCredentialStore } from "@/lib/store/credentialStore";
import { CredentialForm } from "@/components/CredentialForm";
import { Credential } from "@/lib/models/credential";

function buildCredential(
  service: ServiceType,
  values: Record<string, string>
): Credential {
  switch (service) {
    case ServiceType.Anthropic:
      return {
        type: ServiceType.Anthropic,
        accountType: (values.accountType ?? "individual") as "individual" | "organization",
        apiKey: values.apiKey || undefined,
      };
    case ServiceType.OpenAI:
      return { type: ServiceType.OpenAI };
    case ServiceType.Gemini:
      return { type: ServiceType.Gemini };
    case ServiceType.AWS:
      return {
        type: ServiceType.AWS,
        accessKeyId: values.accessKeyId,
        secretAccessKey: values.secretAccessKey,
        region: values.region,
      };
    case ServiceType.Oracle:
      return {
        type: ServiceType.Oracle,
        tenancyOcid: values.tenancyOcid,
        userOcid: values.userOcid,
        fingerprint: values.fingerprint,
        privateKeyPem: values.privateKeyPem,
        region: values.region,
      };
    case ServiceType.GoogleCloud:
      return { type: ServiceType.GoogleCloud };
  }
}

export function CredentialSetupClient() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const addCredential = useCredentialStore((s) => s.addCredential);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serviceSlug = params.service as string;
  const service = Object.values(ServiceType).find((s) => s === serviceSlug);

  if (!service) {
    router.replace("/onboarding");
    return null;
  }

  const queue = searchParams.get("queue") ?? "";
  const meta = SERVICE_METADATA[service];

  const navigateNext = () => {
    const remaining = queue.split(",").filter(Boolean);
    if (remaining.length === 0) {
      router.push("/dashboard");
      return;
    }
    const [next, ...rest] = remaining;
    router.push(`/onboarding/${next}${rest.length ? `?queue=${rest.join(",")}` : ""}`);
  };

  const handleSubmit = async (values: Record<string, string>) => {
    setIsLoading(true);
    setError(null);
    try {
      const credential = buildCredential(service, values);
      await addCredential(service, credential);
      navigateNext();
    } catch {
      setError("Failed to save credentials. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        {/* Back */}
        <button
          onClick={() => router.push("/onboarding")}
          className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
        >
          ← Back
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: meta.color + "22", color: meta.color }}
          >
            <ServiceIcon service={service} className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Connect {meta.label}</h1>
            <p className="text-xs text-muted-foreground">{meta.description}</p>
          </div>
        </div>

        {/* Security note */}
        <div className="bg-muted/40 border border-border rounded-md px-3 py-2 mb-5 text-xs text-muted-foreground leading-relaxed">
          Credentials are AES-256 encrypted and stored only in your browser.
          Nothing is sent to any server.
        </div>

        {/* Error */}
        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-md px-3 py-2 mb-4 text-xs text-danger">
            {error}
          </div>
        )}

        <CredentialForm
          service={service}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />

        <button
          onClick={navigateNext}
          className="mt-3 w-full text-xs text-muted-foreground hover:text-foreground transition-colors text-center py-1"
        >
          Skip this service
        </button>
      </div>
    </main>
  );
}
