import type { Metadata } from "next";
import Link from "next/link";
import BloombergTerminal from "@/components/bloomberg-terminal";
import WhopBadge from "@/components/whop-badge";
import { Monitor, Layers, Activity, Keyboard } from "lucide-react";

export const metadata: Metadata = {
  title: "Dual-Screen Charting & Order Desk — NextWall Street",
  description:
    "Institutional dual-screen trading workstation with intraday price curve charting, Command Line (<GO>), Level 2 order book depth ladder, Time & Sales tape, and interactive hardware shortcut deck.",
};

export default function TerminalPage() {
  return (
    <div className="min-h-screen bg-[#050609] text-[#f2efe8]">
      <section className="relative overflow-hidden border-b border-[#d8ab5a]/20 bg-gradient-to-b from-[#101116] via-[#080a0f] to-[#050609]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(216,171,90,0.10),transparent_55%)]" />
        <div className="relative mx-auto max-w-[1560px] px-4 sm:px-6 py-10">
          <nav className="flex items-center gap-2 text-xs font-mono text-stone-400">
            <Link href="/" className="hover:text-[#f0c979] transition-colors">Home</Link>
            <span className="text-stone-600">/</span>
            <span className="text-[#f0c979]">Dual-Screen Charting &amp; Order Desk</span>
          </nav>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#d8ab5a]/35 bg-[#d8ab5a]/10 px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[#f0c979]">
              <Monitor className="h-3 w-3 text-[#d8ab5a]" />
              INSTITUTIONAL EXECUTION WORKSTATION
            </span>
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-mono text-stone-300">
              DUAL-DISPLAY ENGINE · &lt;GO&gt; ROUTING
            </span>
            <WhopBadge size="xs" />
          </div>

          <h1 className="mt-3 font-display text-3xl sm:text-4xl font-medium text-[#f2efe8] tracking-tight">
            Dual-Screen Charting &amp; Order Desk
          </h1>
          <p className="mt-3 max-w-3xl text-xs sm:text-sm leading-relaxed text-stone-300/90 font-sans">
            Dual-monitor execution console engineered for quantitative traders and institutional desks. Combines real-time news wire routing, intraday charting with technical invalidation stops, global index matrices, Level 2 order book depth ladders, Time &amp; Sales tape, and an interactive command keyboard deck.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-stone-400">
            <span className="flex items-center gap-1.5 text-[#f0c979]">
              <Activity className="h-3.5 w-3.5 text-[#d8ab5a]" />
              Intraday GIP Charting &amp; VWAP
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Layers className="h-3.5 w-3.5" />
              Level 2 DOM &amp; Live Tape
            </span>
            <span className="flex items-center gap-1.5 text-stone-200">
              <Keyboard className="h-3.5 w-3.5 text-[#d8ab5a]" />
              Interactive Shortcut Key Deck
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[1560px] px-3 py-6 sm:px-6">
        <BloombergTerminal />
      </section>
    </div>
  );
}
