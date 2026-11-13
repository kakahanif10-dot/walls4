export function fmtPrice(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "—";
  if (value >= 1000) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (value >= 10) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(7)}`;
}

export function fmtPct(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  const percentage = value * 100;
  return `${percentage >= 0 ? "+" : ""}${percentage.toFixed(digits)}%`;
}

export type MarketStance = "Buy" | "Accumulate" | "Hold" | "Trim" | "Avoid";

export function stanceColor(stance: MarketStance): string {
  switch (stance) {
    case "Buy":
      return "text-up border-up/40 bg-up/10";
    case "Accumulate":
      return "text-gold-bright border-gold/40 bg-gold/10";
    case "Hold":
      return "text-bone border-line bg-ink-800";
    case "Trim":
      return "text-[#e7a86b] border-[#e7a86b]/40 bg-[#e7a86b]/10";
    default:
      return "text-down border-down/40 bg-down/10";
  }
}
