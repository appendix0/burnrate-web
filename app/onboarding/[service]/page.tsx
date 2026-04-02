import { Suspense } from "react";
import { CredentialSetupClient } from "./CredentialSetupClient";

export default function CredentialSetupPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Loading…</p>
        </main>
      }
    >
      <CredentialSetupClient />
    </Suspense>
  );
}
