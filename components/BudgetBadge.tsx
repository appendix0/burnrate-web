// Phase 8 — over/under threshold indicator badge
interface BudgetBadgeProps {
  spendUsd: number;
  thresholdUsd: number;
}

export function BudgetBadge({ spendUsd, thresholdUsd }: BudgetBadgeProps) {
  const over = spendUsd >= thresholdUsd;
  return (
    <span
      className={`text-xs rounded px-2 py-0.5 font-medium ${
        over
          ? "bg-danger/20 text-danger"
          : "bg-safe/20 text-safe"
      }`}
    >
      {over ? "over budget" : "under budget"}
    </span>
  );
}
