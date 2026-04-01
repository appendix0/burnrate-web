export default function DashboardPage() {
  return (
    <main className="min-h-screen p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              <span className="text-burn">Burn</span>Rate
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              LLM & cloud spend dashboard
            </p>
          </div>
          <button className="text-xs text-muted-foreground border border-border rounded-md px-3 py-1.5 hover:bg-accent transition-colors">
            Refresh all
          </button>
        </div>

        {/* Service card grid — populated in Phase 3 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {["Anthropic", "OpenAI", "Gemini", "AWS", "Oracle Cloud"].map((name) => (
            <div
              key={name}
              className="rounded-lg border border-border bg-card p-5 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{name}</span>
                <span className="text-xs text-muted-foreground bg-muted rounded px-2 py-0.5">
                  not configured
                </span>
              </div>
              <div className="text-2xl font-mono font-semibold text-muted-foreground">
                —
              </div>
              <div className="text-xs text-muted-foreground">MTD spend</div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
