import { Check, X, Cpu } from "lucide-react";
import WhopBadge from "./whop-badge";

export default function RulesVsFundamental() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-16">
      <div className="rounded-2xl border border-line bg-ink-900/50 p-6 sm:p-10 backdrop-blur">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
              Quantitative Methodology
            </span>
            <WhopBadge size="xs" />
          </div>
          <h2 className="mt-3 font-display text-3xl sm:text-4xl text-bone leading-tight">
            Rules-Based Momentum &amp; Trend Scoring vs Static Fundamental Ratios.
          </h2>
          <p className="mt-4 text-sm sm:text-[15px] leading-relaxed text-muted">
            Platforms like Simply Wall St rely on backward-looking static ratios—such as trailing P/E, P/B, or hypothetical DCF snowflake models—that lag real market turning points by 3 to 6 months. NextWall Street is engineered for active portfolio managers and traders: providing transparent mathematical weights, confirmed trend persistence, and definitive invalidation levels where our thesis is objectively wrong.
          </p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* Traditional Fundamental Ratio Approach (Simply Wall St Style) */}
          <div className="rounded-xl border border-line/80 bg-ink-950 p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-rose-400">
                Traditional Ratio Models (Simply Wall St Style)
              </span>
              <span className="text-[10px] font-mono text-muted">Lagging Indicators</span>
            </div>
            <ul className="space-y-3 text-xs text-muted">
              <li className="flex items-start gap-2.5">
                <X className="h-4 w-4 text-down shrink-0 mt-0.5" />
                <span>
                  <strong>The Value Trap Illusion:</strong> Low trailing P/E multiples frequently reflect deteriorating business fundamentals, enticing investors into chronic multi-quarter drawdowns.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <X className="h-4 w-4 text-down shrink-0 mt-0.5" />
                <span>
                  <strong>Zero Invalidation Architecture:</strong> Static charts offer no mathematical stop level where the trade is invalidated, encouraging fatal &ldquo;buy the dip&rdquo; bag-holding.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <X className="h-4 w-4 text-down shrink-0 mt-0.5" />
                <span>
                  <strong>Inapplicable to Digital Assets:</strong> Crypto and speculative liquidity markets have zero traditional balance sheets; DCF models are wholly useless in pricing flow.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <X className="h-4 w-4 text-down shrink-0 mt-0.5" />
                <span>
                  <strong>Blind Position Sizing:</strong> Failing to normalize position notional against 60-day realized volatility exposes capital to catastrophic overnight gapping.
                </span>
              </li>
            </ul>
          </div>

          {/* NextWall Street Quantitative Momentum Engine */}
          <div className="rounded-xl border border-gold/40 bg-gradient-to-br from-ink-900 to-ink-950 p-6 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-gold-bright flex items-center gap-1.5">
                <Cpu className="h-4 w-4 text-gold" />
                NextWall Street Quantitative Engine
              </span>
              <WhopBadge size="xs" />
            </div>
            <ul className="space-y-3 text-xs text-bone/90">
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-up shrink-0 mt-0.5" />
                <span>
                  <strong>5 Published Mathematical Weights:</strong> Price vs 20-SMA (22%), 20 vs 50-SMA slope (20%), 200-SMA regime (18%), 30-session ROC (25%), and 14-day RSI stretch (15%).
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-up shrink-0 mt-0.5" />
                <span>
                  <strong>Mathematical Invalidation Anchors:</strong> Every covered asset features a definitive price level that terminates the constructive read, enforcing strict capital defense.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-up shrink-0 mt-0.5" />
                <span>
                  <strong>Cross-Asset Universal Discipline:</strong> Seamlessly evaluates order flow, float concentration, and moving average persistence across 2,000+ equities, crypto, and speculative assets.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Check className="h-4 w-4 text-up shrink-0 mt-0.5" />
                <span>
                  <strong>60-Day Realized Volatility Budgeting:</strong> Automatically computes risk-adjusted share allocations to ensure high-beta names contribute equal portfolio variance.
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
