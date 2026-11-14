import type { Metadata } from "next";
import Link from "next/link";
import WSJMarketCenter from "@/components/wsj-market-center";
import WhopBadge from "@/components/whop-badge";

export const metadata: Metadata = {
  title: "Institutional Market Data Center & Equity Intelligence",
  description:
    "Live US equity market breadth, S&P 500 / Nasdaq sector performance, Form 4 insider trading transactions, Heard on the Street executive columns, and earnings whisper radar.",
};

export default function WSJPage() {
  return (
    <div>
      <section className="grain bg-stone-950">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:py-12">
          <nav className="flex items-center gap-2 text-xs text-stone-400">
            <Link href="/" className="hover:text-stone-100">Home</Link>
            <span className="text-stone-600">/</span>
            <span className="text-amber-400">Market Intelligence Hub</span>
          </nav>
          <div className="mt-4 flex items-center gap-2">
            <span className="rounded-lg bg-amber-500/15 px-3 py-1 text-[10px] font-serif font-bold uppercase tracking-wider text-amber-400">
              EQUITY &amp; MACRO INTELLIGENCE
            </span>
            <WhopBadge size="xs" />
          </div>
          <h1 className="mt-3 font-serif text-4xl text-stone-100 sm:text-5xl font-normal tracking-tight">
            Institutional Market Center
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-stone-300 font-serif">
            Uncompromising institutional market data and editorial rigor. Real-time most active leaders, SEC Form 4 insider filings, sector allocation heatmaps, and executive boardroom investigations.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
        <WSJMarketCenter />
      </section>
    </div>
  );
}
