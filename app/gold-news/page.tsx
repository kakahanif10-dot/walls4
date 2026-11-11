import type { Metadata } from "next";
import Link from "next/link";
import GoldPredictionFeed from "@/components/gold-prediction-feed";
import WhopBadge from "@/components/whop-badge";

export const metadata: Metadata = {
  title: "News Action — 100 Live Market Dossiers",
  description:
    "100 institutional breaking market news items refreshed minute-by-minute with quantitative BUY, ACCUMULATE, HOLD, TRIM, and AVOID execution directives, price targets, and invalidation stops.",
};

export default function GoldNewsPage() {
  return (
    <div>
      <section className="grain border-b border-line/60">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <nav className="flex items-center gap-2 text-xs text-muted">
            <Link href="/" className="hover:text-bone">Home</Link>
            <span className="text-line">/</span>
            <span className="text-gold-bright">News Action</span>
          </nav>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
              Institutional Action Feed
            </span>
            <WhopBadge size="xs" />
          </div>
          <h1 className="mt-2 max-w-3xl font-display text-4xl leading-tight text-bone sm:text-5xl flex items-center gap-3">
            <span>News Action · 100 Live Market Dossiers</span>
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
            100 institutional market dossiers updated continuously. Every breaking geopolitical development, tech executive governance inquiry, central bank liquidity leak, and meme coin fee mechanism translated directly into Buy, Hold, Trim, or Avoid trade setups with mathematical invalidation stops.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <GoldPredictionFeed />
      </section>
    </div>
  );
}
