import type { Metadata } from "next";
import Link from "next/link";
import OpenStockHub from "@/components/openstock-hub";
import WhopBadge from "@/components/whop-badge";
import { Globe, Sparkles, Bell, TrendingUp } from "lucide-react";

export const metadata: Metadata = {
  title: "Global Markets & Sentiment Hub — NextWall Street",
  description:
    "Track 9 international market exchanges (US, India, Germany, Canada, Australia, Saudi Arabia, Poland, Crypto 24/7, Forex), multi-tab ticker exploration, crowd sentiment radar, sector heatmaps, and custom price alerts.",
};

export default function OpenStockPage() {
  return (
    <div className="min-h-screen bg-[#050609] text-[#f2efe8]">
      <section className="relative overflow-hidden border-b border-[#d8ab5a]/20 bg-gradient-to-b from-[#0b1210] via-[#080a0f] to-[#050609]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(62,207,142,0.09),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-12">
          <nav className="flex items-center gap-2 text-xs font-mono text-stone-400">
            <Link href="/" className="hover:text-[#f0c979] transition-colors">Home</Link>
            <span className="text-stone-600">/</span>
            <span className="text-[#f0c979]">Global Markets &amp; Sentiment Hub</span>
          </nav>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-emerald-400/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-emerald-300">
              <Globe className="h-3 w-3 text-emerald-400" />
              GLOBAL EXCHANGE &amp; SENTIMENT HUB
            </span>
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-mono text-stone-300">
              9 INTERNATIONAL REGIONS · MULTI-TAB DESK
            </span>
            <WhopBadge size="xs" />
          </div>

          <h1 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-medium text-[#f2efe8] tracking-tight">
            Global Markets &amp; Sentiment Hub
          </h1>
          <p className="mt-4 max-w-3xl text-xs sm:text-sm leading-relaxed text-stone-300/90 font-sans">
            Comprehensive global market workstation tracking 9 international trading hubs—US, India, Germany, Canada, Australia, Saudi Arabia, Poland, Crypto 24/7, and Global FX—paired with a multi-tab technical analyzer, crowd sentiment radar, sector rotation heatmaps, and real-time price trigger alerts.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-stone-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <Globe className="h-3.5 w-3.5" />
              9 Global Exchanges &amp; Clocks
            </span>
            <span className="flex items-center gap-1.5 text-[#f0c979]">
              <TrendingUp className="h-3.5 w-3.5 text-[#d8ab5a]" />
              Multi-Tab Technical Overlays
            </span>
            <span className="flex items-center gap-1.5 text-stone-200">
              <Sparkles className="h-3.5 w-3.5 text-[#d8ab5a]" />
              Social &amp; Crowd Sentiment Radar
            </span>
            <span className="flex items-center gap-1.5 text-stone-200">
              <Bell className="h-3.5 w-3.5 text-emerald-400" />
              Custom Price Trigger Manager
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-10">
        <OpenStockHub />
      </section>
    </div>
  );
}
