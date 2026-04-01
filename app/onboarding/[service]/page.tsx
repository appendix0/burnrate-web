// Phase 2 — credential input per service
export default function CredentialInputPage({
  params,
}: {
  params: { service: string };
}) {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <h1 className="text-xl font-semibold mb-2 capitalize">
          Connect {params.service}
        </h1>
        <p className="text-xs text-muted-foreground">
          Credential form — Phase 2
        </p>
      </div>
    </main>
  );
}
