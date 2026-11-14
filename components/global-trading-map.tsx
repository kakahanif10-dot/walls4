"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
} from "@vis.gl/react-google-maps";
import {
  Globe,
  Clock,
  Building2,
  TrendingUp,
  Activity,
  Layers,
  MapPin,
  ExternalLink,
  ShieldCheck,
  Zap,
} from "lucide-react";

// Register early global listener and safe console tap at module root for quota defense
if (typeof window !== "undefined") {
  (window as any).gm_authFailure = () => {
    window.dispatchEvent(new CustomEvent("gmp-quota-exceeded"));
  };
  const origError = console.error;
  console.error = (...args: unknown[]) => {
    origError.apply(console, args);
    const msg = args.map((a) => String(a)).join(" ");
    if (msg.includes("OverQuotaMapError") || msg.includes("QuotaExceededError")) {
      window.dispatchEvent(new CustomEvent("gmp-quota-exceeded"));
    }
  };
}

export interface FinancialCenter {
  id: string;
  name: string;
  exchangeCode: string;
  city: string;
  country: string;
  region: "Americas" | "EMEA" | "APAC";
  position: { lat: number; lng: number };
  timezone: string;
  tradingHours: string;
  benchmarkIndex: string;
  indexChange: string;
  isPositive: boolean;
  estDailyVolume: string;
  status: "OPEN" | "CLOSED" | "PRE-MARKET" | "AFTER-HOURS" | "SYNCING";
  deskType: string;
  description: string;
}

export const FINANCIAL_CENTERS: FinancialCenter[] = [
  {
    id: "nyse-nasdaq",
    name: "New York Stock Exchange & Nasdaq",
    exchangeCode: "NYSE / NASDAQ",
    city: "New York",
    country: "United States",
    region: "Americas",
    position: { lat: 40.7069, lng: -74.0089 },
    timezone: "America/New_York (EST)",
    tradingHours: "09:30 - 16:00 EST",
    benchmarkIndex: "S&P 500 / Nasdaq 100",
    indexChange: "+0.84%",
    isPositive: true,
    estDailyVolume: "$285 Billion",
    status: "OPEN",
    deskType: "NextWall Wall Street Equity & Macro Lead Desk",
    description: "Primary epicenter of US equity, ETF, and structured volatility flow.",
  },
  {
    id: "cme-chicago",
    name: "Chicago Mercantile Exchange (CME Group)",
    exchangeCode: "CME / CBOT",
    city: "Chicago",
    country: "United States",
    region: "Americas",
    position: { lat: 41.8796, lng: -87.6322 },
    timezone: "America/Chicago (CST)",
    tradingHours: "17:00 - 16:00 CST (23hr)",
    benchmarkIndex: "E-mini S&P / Treasury Yields / Gold",
    indexChange: "+0.45%",
    isPositive: true,
    estDailyVolume: "$190 Billion",
    status: "OPEN",
    deskType: "NextWall Derivatives, Yield Curves & Gold Futures Desk",
    description: "Global standard for interest rate futures, SOFR, commodities, and index perps.",
  },
  {
    id: "lse-london",
    name: "London Stock Exchange (LSE)",
    exchangeCode: "LSE",
    city: "London",
    country: "United Kingdom",
    region: "EMEA",
    position: { lat: 51.5152, lng: -0.0998 },
    timezone: "Europe/London (GMT/BST)",
    tradingHours: "08:00 - 16:30 GMT",
    benchmarkIndex: "FTSE 100 / UK Gilts",
    indexChange: "-0.22%",
    isPositive: false,
    estDailyVolume: "£68 Billion",
    status: "CLOSED",
    deskType: "NextWall EMEA Cross-Border FX & Sovereign Bond Desk",
    description: "Premier European financial gateway connecting Atlantic and Eurasian liquidity.",
  },
  {
    id: "frankfurt-deutsche-boerse",
    name: "Deutsche Börse & Eurex",
    exchangeCode: "XETRA",
    city: "Frankfurt",
    country: "Germany",
    region: "EMEA",
    position: { lat: 50.1171, lng: 8.6738 },
    timezone: "Europe/Berlin (CET)",
    tradingHours: "09:00 - 17:30 CET",
    benchmarkIndex: "DAX 40 / Euro Stoxx 50",
    indexChange: "+0.38%",
    isPositive: true,
    estDailyVolume: "€42 Billion",
    status: "CLOSED",
    deskType: "NextWall Continental Europe & Eurex Options Desk",
    description: "Hub of German industrial giants, DAX volatility index, and ECB liquidity flow.",
  },
  {
    id: "six-swiss",
    name: "SIX Swiss Exchange",
    exchangeCode: "SIX",
    city: "Zurich",
    country: "Switzerland",
    region: "EMEA",
    position: { lat: 47.3717, lng: 8.5298 },
    timezone: "Europe/Zurich (CET)",
    tradingHours: "09:00 - 17:30 CET",
    benchmarkIndex: "SMI (Swiss Market Index)",
    indexChange: "+0.15%",
    isPositive: true,
    estDailyVolume: "CHF 18 Billion",
    status: "CLOSED",
    deskType: "NextWall Private Wealth & Safe-Haven Allocation Desk",
    description: "International capital preserve with pharmaceutical and defensive heavyweights.",
  },
  {
    id: "borsa-istanbul",
    name: "Borsa Istanbul",
    exchangeCode: "BIST",
    city: "Istanbul",
    country: "Turkey",
    region: "EMEA",
    position: { lat: 41.1097, lng: 29.0538 },
    timezone: "Europe/Istanbul (TRT)",
    tradingHours: "10:00 - 18:00 TRT",
    benchmarkIndex: "BIST 100",
    indexChange: "+1.92%",
    isPositive: true,
    estDailyVolume: "₺95 Billion",
    status: "CLOSED",
    deskType: "NextWall Emerging Europe & Eurasian Growth Desk",
    description: "Strategic liquidity bridge linking European and Middle Eastern capital corridors.",
  },
  {
    id: "dubai-dfm",
    name: "Dubai Financial Market & ADX",
    exchangeCode: "DFM / ADX",
    city: "Dubai",
    country: "United Arab Emirates",
    region: "EMEA",
    position: { lat: 25.2104, lng: 55.2801 },
    timezone: "Asia/Dubai (GST)",
    tradingHours: "10:00 - 15:00 GST",
    benchmarkIndex: "DFM General / FTSE ADX",
    indexChange: "+0.64%",
    isPositive: true,
    estDailyVolume: "$8.5 Billion",
    status: "CLOSED",
    deskType: "NextWall GCC Energy Sovereign & Institutional Web3 Desk",
    description: "Rapidly growing institutional cross-road for regional sovereigns and digital assets.",
  },
  {
    id: "tokyo-tse",
    name: "Tokyo Stock Exchange (JPX)",
    exchangeCode: "TSE",
    city: "Tokyo",
    country: "Japan",
    region: "APAC",
    position: { lat: 35.6826, lng: 139.7777 },
    timezone: "Asia/Tokyo (JST)",
    tradingHours: "09:00 - 15:30 JST",
    benchmarkIndex: "Nikkei 225 / TOPIX",
    indexChange: "+1.24%",
    isPositive: true,
    estDailyVolume: "¥4.8 Trillion",
    status: "OPEN",
    deskType: "NextWall APAC Quant Arbitrage & Yen Carry Desk",
    description: "Third largest exchange globally with semiconductor supply chains and BOJ interest.",
  },
  {
    id: "hong-kong-hkex",
    name: "Hong Kong Exchanges and Clearing (HKEX)",
    exchangeCode: "HKEX",
    city: "Hong Kong",
    country: "Hong Kong",
    region: "APAC",
    position: { lat: 22.2842, lng: 114.1581 },
    timezone: "Asia/Hong_Kong (HKT)",
    tradingHours: "09:30 - 16:00 HKT",
    benchmarkIndex: "Hang Seng / Hang Seng Tech",
    indexChange: "-0.65%",
    isPositive: false,
    estDailyVolume: "HK$118 Billion",
    status: "OPEN",
    deskType: "NextWall Greater China Tech & Northbound Stock Connect Desk",
    description: "Primary offshore gateway for international investment into Chinese mega-caps.",
  },
  {
    id: "singapore-sgx",
    name: "Singapore Exchange (SGX)",
    exchangeCode: "SGX",
    city: "Singapore",
    country: "Singapore",
    region: "APAC",
    position: { lat: 1.2789, lng: 103.8504 },
    timezone: "Asia/Singapore (SGT)",
    tradingHours: "09:00 - 17:00 SGT",
    benchmarkIndex: "Straits Times Index (STI)",
    indexChange: "+0.41%",
    isPositive: true,
    estDailyVolume: "S$1.4 Billion",
    status: "OPEN",
    deskType: "NextWall ASEAN FX Derivatives & REIT Yield Desk",
    description: "Premier clearing hub for pan-Asian index futures, commodities, and foreign exchange.",
  },
  {
    id: "sydney-asx",
    name: "Australian Securities Exchange (ASX)",
    exchangeCode: "ASX",
    city: "Sydney",
    country: "Australia",
    region: "APAC",
    position: { lat: -33.8642, lng: 151.2093 },
    timezone: "Australia/Sydney (AEST)",
    tradingHours: "10:00 - 16:00 AEST",
    benchmarkIndex: "S&P/ASX 200",
    indexChange: "+0.32%",
    isPositive: true,
    estDailyVolume: "A$5.2 Billion",
    status: "OPEN",
    deskType: "NextWall Commodities, Iron Ore & Critical Minerals Desk",
    description: "Resource powerhouse exchange providing benchmark pricing for global raw materials.",
  },
];

export default function GlobalTradingMap({ apiKey: initialApiKey = "" }: { apiKey?: string }) {
  const [apiKey, setApiKey] = useState<string>(initialApiKey);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [liveCenterMap, setLiveCenterMap] = useState<
    Record<string, { status: FinancialCenter["status"]; indexChange: string; isPositive: boolean }>
  >({});
  const [selectedCenterId, setSelectedCenterId] = useState<string | null>(FINANCIAL_CENTERS[0].id);
  const [activeRegion, setActiveRegion] = useState<"ALL" | "Americas" | "EMEA" | "APAC">("ALL");
  const [searchFilter, setSearchFilter] = useState("");

  useEffect(() => {
    let active = true;
    const loadCenters = async () => {
      try {
        const res = await fetch("/api/live-terminal-data?view=openstock-markets", { cache: "no-store" });
        if (!res.ok || !active) return;
        const data = (await res.json()) as {
          tradingCenters?: Array<{
            id: string;
            status: FinancialCenter["status"];
            indexChange: string;
            isPositive: boolean;
          }>;
        };
        if (!active || !Array.isArray(data.tradingCenters)) return;
        const next: Record<string, { status: FinancialCenter["status"]; indexChange: string; isPositive: boolean }> = {};
        for (const tc of data.tradingCenters) {
          next[tc.id] = {
            status: tc.status,
            indexChange: tc.indexChange,
            isPositive: tc.isPositive,
          };
        }
        setLiveCenterMap(next);
      } catch {
        // retain prior live status
      }
    };
    loadCenters();
    const id = setInterval(loadCenters, 30_000);
    return () => {
      active = false;
      clearInterval(id);
    };
  }, []);

  // Fetch API key dynamically if not in client env or prop
  useEffect(() => {
    if (initialApiKey) {
      setApiKey(initialApiKey);
      return;
    }
    const clientKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
    if (clientKey) {
      setApiKey(clientKey);
    } else {
      fetch("/api/maps-key")
        .then((res) => res.json())
        .then((data) => {
          if (data.apiKey) setApiKey(data.apiKey);
        })
        .catch(() => {});
    }
  }, [initialApiKey]);

  // Listen to Google Maps quota exceeded event
  useEffect(() => {
    const handleQuota = () => {
      setQuotaExceeded(true);
    };
    window.addEventListener("gmp-quota-exceeded", handleQuota);
    return () => {
      window.removeEventListener("gmp-quota-exceeded", handleQuota);
    };
  }, []);

  const hydratedCenters = useMemo(() => {
    return FINANCIAL_CENTERS.map((center) => {
      const live = liveCenterMap[center.id];
      return {
        ...center,
        status: live?.status ?? "SYNCING",
        indexChange: live?.indexChange ?? "Syncing...",
        isPositive: live?.isPositive ?? true,
      };
    });
  }, [liveCenterMap]);

  const selectedCenter = useMemo(
    () => (selectedCenterId ? hydratedCenters.find((c) => c.id === selectedCenterId) ?? null : null),
    [hydratedCenters, selectedCenterId]
  );

  const setSelectedCenter = (center: FinancialCenter | null) => {
    setSelectedCenterId(center ? center.id : null);
  };

  const filteredCenters = useMemo(() => {
    return hydratedCenters.filter((center) => {
      const matchRegion = activeRegion === "ALL" || center.region === activeRegion;
      const matchSearch =
        !searchFilter ||
        center.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
        center.city.toLowerCase().includes(searchFilter.toLowerCase()) ||
        center.exchangeCode.toLowerCase().includes(searchFilter.toLowerCase());
      return matchRegion && matchSearch;
    });
  }, [hydratedCenters, activeRegion, searchFilter]);

  return (
    <div className="relative rounded-2xl border border-line/80 bg-ink-950 overflow-hidden shadow-2xl">
      {/* Client-side Quota Defense Banner (Mandatory Content & Placement) */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{" "}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{" "}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Header Bar */}
      <div className="border-b border-line/70 bg-ink-900/80 px-4 py-3 sm:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl border border-gold/30 bg-gold/10 flex items-center justify-center text-gold">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-display text-lg text-bone font-medium">
                Global Financial Exchanges &amp; Trading Floor Map
              </h3>
              <span className="rounded-md border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase text-emerald-300">
                Live Geolocation
              </span>
            </div>
            <p className="text-xs text-muted">
              Interactive Google Maps Platform terminal tracking 11 global trading hubs, desk headquarters &amp; real-time hours
            </p>
          </div>
        </div>

        {/* Region Filter Buttons */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {(["ALL", "Americas", "EMEA", "APAC"] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setActiveRegion(r)}
              className={`rounded-lg px-2.5 py-1 text-xs font-mono transition-all ${
                activeRegion === r
                  ? "bg-gold text-ink-950 font-semibold shadow-sm"
                  : "border border-line/60 bg-ink-850/60 text-muted hover:border-gold/40 hover:text-bone"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Interactive Map + Sidebar Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] min-h-[580px]">
        {/* Left Map Surface (CF2 explicit height) */}
        <div className="relative w-full h-[520px] lg:h-[620px] bg-ink-900">
          {apiKey ? (
            <APIProvider apiKey={apiKey}>
              <Map
                defaultCenter={{ lat: 28, lng: 15 }}
                defaultZoom={2}
                minZoom={1.5}
                mapId="DEMO_MAP_ID"
                internalUsageAttributionIds={["gmp_mcp_codeassist_v1_aistudio"]}
                className="h-full w-full"
                gestureHandling="greedy"
                disableDefaultUI={false}
              >
                {filteredCenters.map((center) => {
                  const isOpen = center.status === "OPEN";
                  const isSelected = selectedCenter?.id === center.id;
                  return (
                    <AdvancedMarker
                      key={center.id}
                      position={center.position}
                      onClick={() => setSelectedCenter(center)}
                      title={`${center.name} (${center.exchangeCode})`}
                    >
                      <Pin
                        background={isOpen ? "#10b981" : "#d8ab5a"}
                        borderColor={isSelected ? "#ffffff" : isOpen ? "#059669" : "#b48530"}
                        glyphColor="#050609"
                        scale={isSelected ? 1.25 : 1.0}
                      />
                    </AdvancedMarker>
                  );
                })}

                {selectedCenter && (
                  <InfoWindow
                    position={selectedCenter.position}
                    onCloseClick={() => setSelectedCenter(null)}
                  >
                    <div className="p-1 max-w-[260px] text-zinc-900 font-sans">
                      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 pb-1.5 mb-1.5">
                        <span className="font-bold text-xs uppercase tracking-wide text-zinc-800">
                          {selectedCenter.exchangeCode}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.2 text-[9px] font-bold ${
                            selectedCenter.status === "OPEN"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {selectedCenter.status}
                        </span>
                      </div>
                      <div className="font-semibold text-xs text-zinc-900">{selectedCenter.name}</div>
                      <div className="text-[11px] text-zinc-600 mt-0.5">
                        {selectedCenter.city}, {selectedCenter.country}
                      </div>
                      <div className="mt-2 text-[10px] space-y-0.5 border-t border-zinc-100 pt-1.5">
                        <div>
                          <strong className="text-zinc-700">Index:</strong> {selectedCenter.benchmarkIndex}{" "}
                          <span className={selectedCenter.isPositive ? "text-emerald-700" : "text-rose-700"}>
                            ({selectedCenter.indexChange})
                          </span>
                        </div>
                        <div>
                          <strong className="text-zinc-700">Hours:</strong> {selectedCenter.tradingHours}
                        </div>
                        <div>
                          <strong className="text-zinc-700">Est. Daily Vol:</strong> {selectedCenter.estDailyVolume}
                        </div>
                      </div>
                    </div>
                  </InfoWindow>
                )}
              </Map>
            </APIProvider>
          ) : (
            <div className="flex h-full w-full flex-col items-center justify-center bg-ink-950 text-muted font-mono text-xs space-y-3">
              <div className="h-8 w-8 rounded-full border-2 border-gold/40 border-t-gold animate-spin" />
              <span>Connecting to Google Maps Platform Geolocation Grid...</span>
            </div>
          )}

          {/* Floating Map Legend Overlay */}
          <div className="pointer-events-none absolute bottom-4 left-4 z-10 flex flex-wrap items-center gap-2 rounded-xl border border-line/80 bg-ink-950/85 px-3 py-2 text-[11px] font-mono text-muted backdrop-blur-md">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
              Open Market
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-gold" />
              Closed / Off-Hours
            </span>
            <span className="text-stone-500">|</span>
            <span className="text-bone/80">Click pin to inspect desk</span>
          </div>
        </div>

        {/* Right Details Drawer */}
        <div className="border-t lg:border-t-0 lg:border-l border-line/70 bg-ink-900/60 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto max-h-[620px]">
          <div>
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <span className="text-xs font-mono font-semibold uppercase tracking-wider text-gold">
                Exchange Telemetry
              </span>
              <span className="rounded-md border border-line bg-ink-850 px-2 py-0.5 text-[10px] font-mono text-muted">
                {filteredCenters.length} Hubs Visible
              </span>
            </div>

            {selectedCenter ? (
              <div className="mt-4 space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs text-muted">{selectedCenter.exchangeCode}</span>
                    <span
                      className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-bold ${
                        selectedCenter.status === "OPEN"
                          ? "border border-emerald-500/40 bg-emerald-500/20 text-emerald-300"
                          : "border border-gold/40 bg-gold/15 text-gold-bright"
                      }`}
                    >
                      {selectedCenter.status}
                    </span>
                  </div>
                  <h4 className="mt-1 font-display text-lg text-bone font-medium leading-snug">
                    {selectedCenter.name}
                  </h4>
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-muted">
                    <MapPin className="h-3 w-3 text-gold" />
                    {selectedCenter.city}, {selectedCenter.country}
                  </p>
                </div>

                <div className="rounded-xl border border-line/60 bg-ink-950/70 p-3 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-gold" /> Trading Hours
                    </span>
                    <span className="font-mono text-bone">{selectedCenter.tradingHours}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted flex items-center gap-1">
                      <Activity className="h-3.5 w-3.5 text-emerald-400" /> Benchmark Index
                    </span>
                    <span className="font-mono text-bone text-right">{selectedCenter.benchmarkIndex}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Day Session Move</span>
                    <span
                      className={`font-mono font-semibold ${
                        selectedCenter.isPositive ? "text-emerald-400" : "text-rose-400"
                      }`}
                    >
                      {selectedCenter.indexChange}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">Estimated Daily Vol</span>
                    <span className="font-mono text-gold-bright">{selectedCenter.estDailyVolume}</span>
                  </div>
                </div>

                <div className="rounded-xl border border-gold/20 bg-gold/[0.04] p-3 text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-gold text-[11px] uppercase tracking-wider mb-1">
                    <Zap className="h-3.5 w-3.5 text-gold" /> Assigned Desk Connection
                  </div>
                  <p className="font-mono text-bone/90 text-[11px] leading-relaxed">
                    {selectedCenter.deskType}
                  </p>
                  <p className="text-muted text-[11px] mt-2 leading-relaxed">
                    {selectedCenter.description}
                  </p>
                </div>

                {/* Quick Selection List */}
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-wider text-muted mb-2">
                    Quick Center Switcher
                  </p>
                  <div className="grid grid-cols-2 gap-1.5">
                    {filteredCenters.slice(0, 6).map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelectedCenter(c)}
                        className={`rounded-lg border px-2 py-1 text-left text-[11px] font-mono transition-all truncate ${
                          selectedCenter.id === c.id
                            ? "border-gold bg-gold/20 text-gold-bright font-semibold"
                            : "border-line/60 bg-ink-950/40 text-muted hover:border-gold/30 hover:text-bone"
                        }`}
                      >
                        {c.city} ({c.exchangeCode})
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-xs text-muted">
                Select an exchange marker on the map to inspect live session stats.
              </div>
            )}
          </div>

          <div className="border-t border-line/60 pt-3 mt-4 flex items-center justify-between text-[11px] text-muted font-mono">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck className="h-3 w-3" /> Maps SDK Active
            </span>
            <span>DEMO_MAP_ID</span>
          </div>
        </div>
      </div>
    </div>
  );
}
