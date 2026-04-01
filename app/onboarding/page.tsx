// Phase 2 — service selector screen
export default function OnboardingPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <h1 className="text-xl font-semibold mb-2">
          Which services do you want to track?
        </h1>
        <p className="text-muted-foreground text-sm mb-6">
          Select all that apply. You can add more later in Settings.
        </p>
        <p className="text-xs text-muted-foreground">
          Service selector — Phase 2
        </p>
      </div>
    </main>
  );
}
