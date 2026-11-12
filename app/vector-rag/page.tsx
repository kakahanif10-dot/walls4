import type { Metadata } from "next";
import Link from "next/link";
import OracleXTerminal from "@/components/oraclex-terminal";
import WhopBadge from "@/components/whop-badge";
import { Compass, Layers, Database, Zap, Radio } from "lucide-react";

export const metadata: Metadata = {
  title: "Cross-Asset Vector RAG & Liquidity Radar — NextWall Street",
  description:
    "Unified cross-asset terminal for US Equities, Digital Assets, and Borsa İstanbul. Features Vector Memory RAG, Market Internals & Advance/Decline Histogram, Standing Liquidity Ladder, and Divergence Detection Radar.",
};

export default function OracleXPage() {
  return (
    <div className="min-h-screen bg-[#050609] text-[#f2efe8]">
      <section className="relative overflow-hidden border-b border-[#d8ab5a]/20 bg-gradient-to-b from-[#0d111a] via-[#080a0f] to-[#050609]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(216,171,90,0.10),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-12">
          <nav className="flex items-center gap-2 text-xs font-mono text-stone-400">
            <Link href="/" className="hover:text-[#f0c979] transition-colors">Home</Link>
            <span className="text-stone-600">/</span>
            <span className="text-[#f0c979]">Cross-Asset Vector RAG &amp; Liquidity Radar</span>
          </nav>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#d8ab5a]/35 bg-[#d8ab5a]/10 px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[#f0c979]">
              <Compass className="h-3 w-3 text-[#d8ab5a]" />
              CROSS-ASSET INTELLIGENCE WORKSPACE
            </span>
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-mono text-stone-300">
              VECTOR MEMORY RAG + LIQUIDITY LADDER
            </span>
            <WhopBadge size="xs" />
          </div>

          <h1 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-medium text-[#f2efe8] tracking-tight">
            Cross-Asset Vector RAG &amp; Liquidity Radar
          </h1>
          <p className="mt-4 max-w-3xl text-xs sm:text-sm leading-relaxed text-stone-300/90 font-sans">
            Institutional market intelligence combining semantic Vector Memory RAG across SEC filings, FOMC transcripts, and sovereign disclosures with 24h Advance/Decline breadth internals, standing leverage liquidation ladders, daily/weekly divergence scanning, and Borsa İstanbul (BIST) equities.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-stone-400">
            <span className="flex items-center gap-1.5 text-sky-300">
              <Database className="h-3.5 w-3.5 text-sky-400" />
              Semantic Vector RAG Store
            </span>
            <span className="flex items-center gap-1.5 text-[#f0c979]">
              <Layers className="h-3.5 w-3.5 text-[#d8ab5a]" />
              Standing Liquidity Ladder
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Zap className="h-3.5 w-3.5" />
              Divergence Detection Radar
            </span>
            <span className="flex items-center gap-1.5 text-stone-200">
              <Radio className="h-3.5 w-3.5 text-[#d8ab5a]" />
              Borsa İstanbul (BIST 100) &amp; KAP
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <OracleXTerminal />
      </section>
    </div>
  );
}
