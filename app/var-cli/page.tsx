import type { Metadata } from "next";
import Link from "next/link";
import OpenBBTerminal from "@/components/openbb-terminal";
import WhopBadge from "@/components/whop-badge";
import { Terminal, ShieldAlert, Activity, PieChart, Layers } from "lucide-react";

export const metadata: Metadata = {
  title: "Quantitative Risk, VaR & Portfolio CLI — NextWallStreet",
  description:
    "High-speed quantitative CLI workstation with Parametric, Historical, and Monte Carlo Value at Risk (VaR), US Treasury constant-maturity yield curves, Markowitz Efficient Frontier portfolio optimizer, and FINRA dark pool volume tracking.",
};

export default function OpenBBPage() {
  return (
    <div className="min-h-screen bg-[#050609] text-[#f2efe8]">
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0b1018] via-[#080a0f] to-[#050609]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(216,171,90,0.10),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-10 sm:py-12">
          <nav className="flex items-center gap-2 text-xs font-mono text-stone-400">
            <Link href="/" className="hover:text-[#f0c979] transition-colors">Home</Link>
            <span className="text-stone-600">/</span>
            <span className="text-[#f0c979]">Quantitative Risk, VaR &amp; Portfolio CLI</span>
          </nav>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#d8ab5a]/15 px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[#f0c979]">
              <Terminal className="h-3 w-3 text-[#d8ab5a]" />
              QUANTITATIVE RISK &amp; PORTFOLIO INFRASTRUCTURE
            </span>
            <span className="rounded-lg bg-white/[0.06] px-3 py-1 text-[10px] font-mono text-stone-300">
              CLI WORKSTATION · PYTHON QUANT SDK
            </span>
            <WhopBadge size="xs" />
          </div>

          <h1 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-medium text-[#f2efe8] tracking-tight">
            Quantitative Risk, VaR &amp; Portfolio CLI
          </h1>
          <p className="mt-4 max-w-3xl text-xs sm:text-sm leading-relaxed text-stone-300/90 font-sans">
            Institutional quantitative workstation featuring a command-line interpreter, parametric and fat-tailed Value at Risk (VaR), 30-day Monte Carlo price simulation envelopes, constant-maturity US Treasury yield curves, Markowitz Efficient Frontier optimization, and off-exchange dark pool flow monitoring.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-stone-400">
            <span className="flex items-center gap-1.5 text-[#f0c979]">
              <Terminal className="h-3.5 w-3.5 text-[#d8ab5a]" />
              Interactive Quant CLI &amp; SDK
            </span>
            <span className="flex items-center gap-1.5 text-rose-300">
              <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
              Parametric, Historical &amp; MC VaR
            </span>
            <span className="flex items-center gap-1.5 text-sky-300">
              <Activity className="h-3.5 w-3.5 text-sky-400" />
              1M–30Y Treasury Yield Curve
            </span>
            <span className="flex items-center gap-1.5 text-emerald-400">
              <PieChart className="h-3.5 w-3.5" />
              Markowitz Frontier &amp; Dark Pool Flow
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
        <OpenBBTerminal />
      </section>
    </div>
  );
}
