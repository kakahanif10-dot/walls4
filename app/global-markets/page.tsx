import type { Metadata } from "next";
import Link from "next/link";
import GlobalMarketsView from "@/components/global-markets-view";
import WhopBadge from "@/components/whop-badge";
import { Globe, Activity, Bell, TrendingUp, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Global Markets & Financial Exchanges Map — NextWallStreet",
  description:
    "Track 11 global financial exchanges via Google Maps Platform, 9 international regions, multi-tab ticker exploration, crowd sentiment radar, and custom price alerts.",
};

import mapsConfig from "@/maps-applet-config.json";

export default function OpenStockPage() {
  const mapsApiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    mapsConfig.apiKey ||
    "";

  return (
    <div className="min-h-screen bg-[#050609] text-[#f2efe8]">
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0b1210] via-[#080a0f] to-[#050609]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(62,207,142,0.09),transparent_55%)]" />
        <div className="relative mx-auto max-w-7xl px-5 py-10 sm:py-12">
          <nav className="flex items-center gap-2 text-xs font-mono text-stone-400">
            <Link href="/" className="hover:text-[#f0c979] transition-colors">Home</Link>
            <span className="text-stone-600">/</span>
            <span className="text-[#f0c979]">Global Markets &amp; Financial Exchanges</span>
          </nav>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-emerald-300">
              <Globe className="h-3 w-3 text-emerald-400" />
              GLOBAL EXCHANGES &amp; MAP TERMINAL
            </span>
            <span className="rounded-lg bg-white/[0.06] px-3 py-1 text-[10px] font-mono text-stone-300">
              GOOGLE MAPS PLATFORM · 11 FINANCIAL HUBS
            </span>
            <WhopBadge size="xs" />
          </div>

          <h1 className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-medium text-[#f2efe8] tracking-tight">
            Global Markets &amp; Financial Exchanges Map
          </h1>
          <p className="mt-4 max-w-3xl text-xs sm:text-sm leading-relaxed text-stone-300/90 font-sans">
            Institutional workstation combining Google Maps Platform geolocation of 11 world exchanges (NYSE, Nasdaq, CME, LSE, Deutsche Börse, Tokyo TSE, SGX, HKEX, Borsa Istanbul) with real-time operational status, benchmark indices, and cross-border sentiment radars.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-mono text-stone-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <MapPin className="h-3.5 w-3.5" />
              11 Geolocation Hubs (Google Maps)
            </span>
            <span className="flex items-center gap-1.5 text-[#f0c979]">
              <TrendingUp className="h-3.5 w-3.5 text-[#d8ab5a]" />
              Multi-Tab Technical Overlays
            </span>
            <span className="flex items-center gap-1.5 text-stone-200">
              <Activity className="h-3.5 w-3.5 text-[#d8ab5a]" />
              Social &amp; Crowd Sentiment Radar
            </span>
            <span className="flex items-center gap-1.5 text-stone-200">
              <Bell className="h-3.5 w-3.5 text-emerald-400" />
              Custom Price Trigger Manager
            </span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
        <GlobalMarketsView apiKey={mapsApiKey} />
      </section>
    </div>
  );
}
