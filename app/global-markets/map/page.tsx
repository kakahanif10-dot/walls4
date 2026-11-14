import type { Metadata } from "next";
import Link from "next/link";
import GlobalTradingMap from "@/components/global-trading-map";
import WhopBadge from "@/components/whop-badge";
import firebaseConfig from "@/firebase-applet-config.json";
import { Globe, MapPin, Layers, Building2 } from "lucide-react";

export const metadata: Metadata = {
  title: "Global Trading Exchanges Map — NextWallStreet",
  description:
    "Interactive Google Maps Platform terminal visualizing 11 premier world stock exchanges and quantitative desk headquarters across Americas, EMEA, and APAC.",
};

export default function GlobalTradingMapPage() {
  const mapsApiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    firebaseConfig.apiKey ||
    "";

  return (
    <div className="min-h-screen bg-[#050609] text-[#f2efe8]">
      <section className="relative overflow-hidden bg-gradient-to-b from-[#0b1210] via-[#080a0f] to-[#050609]">
        <div className="relative mx-auto max-w-7xl px-5 py-9 sm:py-10">
          <nav className="flex items-center gap-2 text-xs font-mono text-stone-400">
            <Link href="/" className="hover:text-[#f0c979] transition-colors">Home</Link>
            <span className="text-stone-600">/</span>
            <Link href="/global-markets" className="hover:text-[#f0c979] transition-colors">Global Markets</Link>
            <span className="text-stone-600">/</span>
            <span className="text-[#f0c979]">Exchanges Map</span>
          </nav>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/15 px-3 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-emerald-300">
              <Globe className="h-3 w-3 text-emerald-400" />
              GOOGLE MAPS PLATFORM LIVE GEOLOCATION
            </span>
            <span className="rounded-lg bg-white/[0.06] px-3 py-1 text-[10px] font-mono text-stone-300">
              11 FINANCIAL EXCHANGES · LIVE DESK TELEMETRY
            </span>
            <WhopBadge size="xs" />
          </div>

          <h1 className="mt-3 font-display text-3xl sm:text-4xl font-medium text-[#f2efe8] tracking-tight">
            World Trading Exchanges &amp; Desk Headquarters Map
          </h1>
          <p className="mt-3 max-w-3xl text-xs sm:text-sm leading-relaxed text-stone-300/90 font-sans">
            Full-screen Google Maps Platform terminal tracking 11 global trading hubs: NYSE, Nasdaq, CME, LSE, Deutsche Börse, Tokyo TSE, SGX, HKEX, Borsa Istanbul, SIX Swiss, and ASX.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8">
        <GlobalTradingMap apiKey={mapsApiKey} />
      </section>
    </div>
  );
}
