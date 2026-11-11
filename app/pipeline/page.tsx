import type { Metadata } from "next";
import Link from "next/link";
import PipelineStatusDashboard from "@/components/pipeline-status-dashboard";
import WhopBadge from "@/components/whop-badge";

export const metadata: Metadata = {
  title: "Backend Data Pipeline & 2,000+ Asset Scoring Engine — NextWall Street",
  description:
    "Real-time pipeline ingesting Nasdaq, Coinbase, Binance, and OKX feeds. Computes 5-component trend scoring, invalidation levels, and realized volatility across 2,000+ assets.",
};

export default function PipelinePage() {
  return (
    <div>
      <section className="grain border-b border-line/60">
        <div className="mx-auto max-w-7xl px-5 py-12">
          <nav className="flex items-center gap-2 text-xs text-muted">
            <Link href="/" className="hover:text-bone">Home</Link>
            <span className="text-line">/</span>
            <span className="text-gold-bright">Data Pipeline</span>
          </nav>
          <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Architecture &amp; Engine</p>
          <h1 className="mt-2 max-w-3xl font-display text-4xl leading-tight text-bone sm:text-5xl flex items-center">
            <span>Data Pipeline &amp; Algorithmic Scoring</span>
            <WhopBadge className="ml-2 align-middle text-2xl" />
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
            High-throughput backend pipeline connecting Nasdaq, Coinbase, Binance, and OKX APIs. Runs continuous 5-factor quantitative scoring across 2,000+ equities, digital assets, and meme tokens.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <PipelineStatusDashboard />
      </section>
    </div>
  );
}
