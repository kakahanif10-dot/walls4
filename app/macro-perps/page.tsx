import type { Metadata } from "next";
import Link from "next/link";
import NeubergTerminal from "@/components/neuberg-terminal";
import WhopBadge from "@/components/whop-badge";
import { Terminal, Activity, Compass, DollarSign, Vote } from "lucide-react";

export const metadata: Metadata = {
  title: "516-Panel Macro & Perpetuals Workstation — NextWallStreet",
  description:
    "Modular 516-panel quantitative workstation featuring Fear & Greed composite gauge, Macro Regime Quadrants, 24/7 equity & crypto perpetuals, commodities matrix, and live event prediction order books.",
};

export default function NeubergPage() {
  return (
    <div className="min-h-screen bg-[#050609] text-[#f2efe8]">
      <section className="relative overflow-hidden bg-gradient-to-b from-[#110f0c] via-[#080a0f] to-[#050609]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(216,171,90,0.12),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-10 sm:py-12">
          <nav className="flex items-center gap-2 text-xs font-mono text-stone-400">
            <Link href="/" className="hover:text-[#f0c979] transition-colors">Home</Link>
            <span className="text-stone-600">/</span>
            <span className="text-[#f0c979]">516-Panel Macro &amp; Perpetuals Workstation</span>
          </nav>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#d8ab5a]/15 px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[#f0c979]">
              <Terminal className="h-3 w-3 text-[#d8ab5a]" />
              INSTITUTIONAL MACRO &amp; DERIVATIVES COCKPIT
            </span>
            <span className="rounded-lg bg-white/[0.06] px-3 py-1 text-[10px] font-mono text-stone-300">
              516 MODULAR PANELS · 24/7 EXECUTION
            </span>
            <WhopBadge size="xs" />
          </div>

          <h1 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-medium text-[#f2efe8] tracking-tight">
            516-Panel Macro &amp; Perpetuals Workstation
          </h1>
          <p className="mt-4 max-w-3xl text-xs sm:text-sm leading-relaxed text-stone-300/90 font-sans">
            Composable multi-asset command center featuring 516 modular analytical panels across Equities, Fixed Income, Commodities, multi-factor Fear &amp; Greed telemetry, Macro Regime Quadrants, 24/7 equity and crypto perpetual contracts with up to 20x leverage, and live event prediction order books.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-stone-400">
            <span className="flex items-center gap-1.5 text-[#f0c979]">
              <Activity className="h-3.5 w-3.5 text-[#d8ab5a]" />
              Fear &amp; Greed Composite (0–100)
            </span>
            <span className="flex items-center gap-1.5 text-stone-200">
              <Compass className="h-3.5 w-3.5 text-[#d8ab5a]" />
              Macro Regime Quadrant
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <DollarSign className="h-3.5 w-3.5" />
              24/7 Stock &amp; Crypto Perpetuals
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Vote className="h-3.5 w-3.5" />
              Event Prediction Order Books
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
        <NeubergTerminal />
      </section>
    </div>
  );
}
