import type { Financeability } from "@/types";

interface Props {
  dscr: number;
  financeability: Financeability;
}

const labels: Record<Financeability, string> = {
  green: "Financeable",
  yellow: "Marginal",
  red: "Not financeable",
};

const classes: Record<Financeability, string> = {
  green: "bg-emerald-500/20 text-emerald-300 border-emerald-500/50",
  yellow: "bg-amber-500/20 text-amber-300 border-amber-500/50",
  red: "bg-red-500/20 text-red-300 border-red-500/50",
};

export default function FinanceabilityBadge({ dscr, financeability }: Props) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded border px-2 py-1 text-sm font-medium ${classes[financeability]}`}
      title={`DSCR ${dscr.toFixed(2)} (thresholds: green ≥1.25, yellow ≥1.15, red &lt;1.15)`}
    >
      <span className="font-mono">{dscr.toFixed(2)} DSCR</span>
      <span>{labels[financeability]}</span>
    </span>
  );
}
