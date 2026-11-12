import type { Metadata } from "next";
import Link from "next/link";
import FinceptTerminal from "@/components/fincept-terminal";
import WhopBadge from "@/components/whop-badge";
import { Terminal, Bot, BarChart2, Globe, Cpu } from "lucide-react";

export const metadata: Metadata = {
  title: "AI Allocator Agents, DCF & Options Greeks — NextWall Street",
  description:
    "Institutional quantitative valuation suite featuring 37 AI allocator agents, Gordon Growth DCF modeling, Black-Scholes options pricing and Greeks, 100+ macro data connectors, paper trading execution, and visual strategy node automation.",
};

export default function FinceptPage() {
  return (
    <div className="min-h-screen bg-[#050609] text-[#f2efe8]">
      <section className="relative overflow-hidden border-b border-[#d8ab5a]/20 bg-gradient-to-b from-[#120f09] via-[#080a0f] to-[#050609]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(216,171,90,0.12),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-12">
          <nav className="flex items-center gap-2 text-xs font-mono text-stone-400">
            <Link href="/" className="hover:text-[#f0c979] transition-colors">Home</Link>
            <span className="text-stone-600">/</span>
            <span className="text-[#f0c979]">AI Allocator Agents, DCF &amp; Options Greeks</span>
          </nav>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-[#d8ab5a]/35 bg-[#d8ab5a]/10 px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[#f0c979]">
              <Terminal className="h-3 w-3 text-[#d8ab5a]" />
              QUANTITATIVE VALUATION &amp; AGENT SUITE
            </span>
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-mono text-stone-300">
              37 ALLOCATOR FRAMEWORKS · C++20 / PYTHON ENGINE
            </span>
            <WhopBadge size="xs" />
          </div>

          <h1 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-medium text-[#f2efe8] tracking-tight">
            AI Allocator Agents, DCF &amp; Options Greeks
          </h1>
          <p className="mt-4 max-w-3xl text-xs sm:text-sm leading-relaxed text-stone-300/90 font-sans">
            Full-spectrum fundamental and quantitative modeling desk featuring 37 capital allocator AI agents (Buffett, Munger, Graham, Soros, Dalio, Simons, Lynch, Ackman), interactive Gordon Growth DCF valuation, Black-Scholes options pricing and Greeks, 100+ live macro connectors, paper execution, and visual strategy node automation.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-stone-400">
            <span className="flex items-center gap-1.5 text-[#f0c979]">
              <Bot className="h-3.5 w-3.5 text-[#d8ab5a]" />
              37 Allocator AI Agents
            </span>
            <span className="flex items-center gap-1.5 text-stone-200">
              <BarChart2 className="h-3.5 w-3.5 text-[#d8ab5a]" />
              Interactive DCF &amp; Black-Scholes
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Globe className="h-3.5 w-3.5" />
              100+ Macro Feeds &amp; Chokepoints
            </span>
            <span className="flex items-center gap-1.5 text-stone-200">
              <Cpu className="h-3.5 w-3.5 text-[#d8ab5a]" />
              Strategy Node Graph &amp; Paper Execution
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <FinceptTerminal />
      </section>
    </div>
  );
}
