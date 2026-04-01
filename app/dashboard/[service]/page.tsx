// Phase 5 — service detail screen with SpendChart
export default function ServiceDetailPage({
  params,
}: {
  params: { service: string };
}) {
  return (
    <main className="min-h-screen p-6">
      <div className="max-w-4xl mx-auto">
        <h2 className="text-xl font-semibold capitalize">{params.service}</h2>
        <p className="text-muted-foreground text-sm mt-1">Detail view — Phase 5</p>
      </div>
    </main>
  );
}
