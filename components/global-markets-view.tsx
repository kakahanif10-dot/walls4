"use client";

import React, { useState } from "react";
import GlobalTradingMap from "@/components/global-trading-map";
import OpenStockHub from "@/components/openstock-hub";
import { Globe, BarChart3, MapPin, Layers } from "lucide-react";

export default function GlobalMarketsView({ apiKey = "" }: { apiKey?: string }) {
  const [viewMode, setViewMode] = useState<"map" | "hub">("map");

  return (
    <div className="space-y-6">
      {/* View Switcher Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-[#d8ab5a]/30 bg-[#080a0f] p-3 sm:px-5">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg border border-emerald-500/30 bg-emerald-500/10 flex items-center justify-center text-emerald-400">
            <Globe className="h-4 w-4" />
          </div>
          <div>
            <span className="font-semibold text-bone text-sm">
              Global Financial Hub &amp; Trading Floor Visualization
            </span>
            <p className="text-muted text-[11px]">
              Switch between the live Google Maps Platform geolocation terminal and the 9-exchange sentiment hub.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 rounded-xl border border-line bg-ink-950 p-1 shrink-0">
          <button
            type="button"
            onClick={() => setViewMode("map")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
              viewMode === "map"
                ? "bg-gold text-ink-950 shadow-sm"
                : "text-muted hover:text-bone"
            }`}
          >
            <MapPin className="h-3.5 w-3.5" />
            Global Exchanges Map
          </button>
          <button
            type="button"
            onClick={() => setViewMode("hub")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
              viewMode === "hub"
                ? "bg-gold text-ink-950 shadow-sm"
                : "text-muted hover:text-bone"
            }`}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            9-Region Sentiment Hub
          </button>
        </div>
      </div>

      {viewMode === "map" ? (
        <div className="space-y-6">
          <GlobalTradingMap apiKey={apiKey} />
          <div className="border-t border-line/60 pt-6">
            <div className="mb-4">
              <h3 className="font-display text-xl text-bone">Regional Trading Desks &amp; Sentiment</h3>
              <p className="text-xs text-muted">Detailed technicals and order book sentiment across individual tickers.</p>
            </div>
            <OpenStockHub />
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <OpenStockHub />
          <div className="border-t border-line/60 pt-6">
            <div className="mb-4">
              <h3 className="font-display text-xl text-bone">Global Geolocation &amp; Exchange Headquarters</h3>
              <p className="text-xs text-muted">Geographical distribution of Tier-1 financial centers and operational hours.</p>
            </div>
            <GlobalTradingMap apiKey={apiKey} />
          </div>
        </div>
      )}
    </div>
  );
}
