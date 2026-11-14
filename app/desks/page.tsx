import type { Metadata } from "next";
import Link from "next/link";
import AnalystDesksCatalog from "@/components/analyst-desks-catalog";
import WhopBadge from "@/components/whop-badge";
import FastAlertBanner from "@/components/fast-alert-banner";

export const metadata: Metadata = {
  title: "44 Quantitative Analyst Desks — NextWallStreet",
  description:
    "Explore 44 specialized institutional analyst desks covering AI compute, semiconductors, macro yields, crypto flows, pump.fun memes, and mathematical invalidation architecture.",
};

export default function DesksPage() {
  return (
    <div>
      <section className="grain">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:py-12">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">Institutional Architecture</span>
            <WhopBadge size="xs" />
          </div>
          <h1 className="mt-3 font-display text-3xl text-bone sm:text-5xl">
            44 Quantitative Analyst Desks
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">
            Every market regime exhibits distinct order flow velocity and liquidity participants. Our 44 institutional analyst desks provide rigorous domain division: from enterprise AI compute capex and sovereign yield curves to decentralized bonding curves and mathematical position sizing normalization.
          </p>

          <div className="mt-7 flex flex-wrap gap-x-8 gap-y-3 rounded-xl bg-ink-900/50 px-5 py-3.5 text-xs text-muted font-mono">
            <span><strong className="text-bone">12</strong> Equities &amp; Growth Desks</span>
            <span><strong className="text-bone">8</strong> Macro &amp; Rates Desks</span>
            <span><strong className="text-bone">12</strong> Crypto &amp; Layer-1/2 Desks</span>
            <span><strong className="text-bone">6</strong> Speculative &amp; Meme Desks</span>
            <span><strong className="text-bone">6</strong> Quant &amp; Risk Architecture Desks</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
        <AnalystDesksCatalog />
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-12">
        <FastAlertBanner />
      </section>
    </div>
  );
}
