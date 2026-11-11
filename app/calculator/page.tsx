import type { Metadata } from "next";
import Link from "next/link";
import PositionSizingCalculator from "@/components/position-sizing-calculator";
import WhopBadge from "@/components/whop-badge";

export const metadata: Metadata = {
  title: "Position Sizing & Invalidation Calculator — NextWall Street",
  description:
    "Institutional risk-based position sizing calculator. Computes suggested shares, notional dollar allocation, and risk-reward targets against the model's invalidation level and 60-day realized volatility.",
};

export default function CalculatorPage() {
  return (
    <div>
      <section className="grain border-b border-line/60">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <nav className="flex items-center gap-2 text-xs text-muted">
            <Link href="/" className="hover:text-bone">Home</Link>
            <span className="text-line">/</span>
            <span className="text-gold-bright">Risk Calculator</span>
          </nav>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Capital Preservation</p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl leading-tight text-bone sm:text-5xl flex items-center">
            <span>Position Sizing Calculator</span>
            <WhopBadge className="ml-2 align-middle text-2xl" />
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
            Size your positions strictly around the technical invalidation level and volatility, not hope.
            Sizing decides survival before returns ever matter.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <PositionSizingCalculator initialSymbol="NVDA" />

        {/* Methodology Notes */}
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-xl border border-line bg-ink-900/50 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
              1. The Invalidation Anchor
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Never size a position based on where you think it might go. Size it against where the thesis is
              mathematically wrong. If you cannot afford the distance to invalidation, you cannot afford the trade.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-ink-900/50 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
              2. Volatility Normalization
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Higher volatility instruments (crypto, meme coins, and earnings momentum) receive proportionally smaller
              dollar allocations so their daily variance contribution to your portfolio remains balanced.
            </p>
          </div>

          <div className="rounded-xl border border-line bg-ink-900/50 p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
              3. Hard Sector Caps
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Equities are capped at 20% max portfolio exposure, crypto at 8%, and meme coins at a hard 2% max cap to
              prevent terminal drawdowns from liquidity shocks or overnight gap risk.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
