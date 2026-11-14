import type { Metadata } from "next";
import Link from "next/link";
import RealtimeNewsTerminal from "@/components/realtime-news-terminal";
import WhopBadge from "@/components/whop-badge";
import { Radio, Terminal, Zap, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Live News Stream & Query Wire — NextWallStreet",
  description:
    "Sub-second financial news aggregator connecting 10,000+ market wires (Reuters, WSJ, SEC Form 8-K, FDA Approvals, BusinessWire) mapped to ticker symbols with Lucene query filtering and WebSocket streaming.",
};

export default function RealtimeNewsPage() {
  return (
    <div className="min-h-screen bg-[#050609] text-[#f2efe8]">
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0d1118] via-[#080a0f] to-[#050609]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(216,171,90,0.10),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-10 sm:py-12">
          <nav className="flex items-center gap-2 text-xs font-mono text-stone-400">
            <Link href="/" className="hover:text-[#f0c979] transition-colors">Home</Link>
            <span className="text-stone-600">/</span>
            <span className="text-[#f0c979]">Live News Stream &amp; Query Wire</span>
          </nav>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#d8ab5a]/15 px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[#f0c979]">
              <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
              10,000+ FINANCIAL NEWS FEEDS
            </span>
            <span className="rounded-lg bg-white/[0.06] px-3 py-1 text-[10px] font-mono text-stone-300">
              WEBSOCKET STREAM + LUCENE QUERY WIRE
            </span>
            <WhopBadge size="xs" />
          </div>

          <h1 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-medium text-[#f2efe8] tracking-tight">
            Live News Stream &amp; Query Wire
          </h1>
          <p className="mt-4 max-w-3xl text-xs sm:text-sm leading-relaxed text-stone-300/90 font-sans">
            High-throughput market news wire unifying over 10,000 institutional dispatches—including Reuters, The Wall Street Journal, SEC Form 8-K/10-K filings, FDA drug evaluations, and BusinessWire—mapped directly to equity and digital asset tickers with real-time Lucene query filtering.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-stone-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Radio className="h-3.5 w-3.5" />
              Sub-second WebSocket Stream
            </span>
            <span className="flex items-center gap-1.5 text-[#f0c979]">
              <Terminal className="h-3.5 w-3.5" />
              Lucene Query Engine (symbols, source, category)
            </span>
            <span className="flex items-center gap-1.5 text-stone-200">
              <Zap className="h-3.5 w-3.5 text-[#d8ab5a]" />
              Direct Ticker Symbol Resolution
            </span>
            <span className="flex items-center gap-1.5 text-stone-200">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Invalidation Stop Thresholds
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
        <RealtimeNewsTerminal />
      </section>
    </div>
  );
}
