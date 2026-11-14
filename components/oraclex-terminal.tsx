"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  Activity,
  Layers,
  Database,
  Search,
  ShieldCheck,
  Radio,
  Zap,
  BarChart3,
  Info,
  Terminal,
  RefreshCw,
  Compass,
} from "lucide-react";
import {
  computeOracleXMarketInternals,
  computeLiquidityLadder,
  detectMarketDivergences,
  queryVectorMemory,
  VECTOR_KNOWLEDGE_STORE,
  type BISTAsset,
  type OracleXRealm,
  type VectorRAGDocument,
} from "@/lib/oraclex-platform";
import { ASSETS, ASSET_BY_SYMBOL, fmtPrice, fmtPct, metricsFor } from "@/lib/market";
import { useQuotes } from "@/components/live-prices";
import WhopBadge from "@/components/whop-badge";

export default function OracleXTerminal() {
  const liveQuotes = useQuotes();
  const [realm, setRealm] = useState<OracleXRealm>("global");
  const [activeTab, setActiveTab] = useState<"internals" | "ladder" | "rag" | "divergence" | "bist">("internals");
  const [selectedAssetSymbol, setSelectedAssetSymbol] = useState<string>("BTC");
  const [ragQuery, setRagQuery] = useState<string>("");
  const [selectedDoc, setSelectedDoc] = useState<VectorRAGDocument | null>(VECTOR_KNOWLEDGE_STORE[0]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [bistEquities, setBistEquities] = useState<BISTAsset[]>([]);
  const [bistLoading, setBistLoading] = useState<boolean>(true);
  const [bistError, setBistError] = useState<string | null>(null);

  const fetchLiveBist = useCallback(async () => {
    setBistLoading(true);
    setBistError(null);
    try {
      const res = await fetch("/api/live-terminal-data?view=bist", { cache: "no-store" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { equities?: BISTAsset[] };
      if (Array.isArray(data.equities) && data.equities.length > 0) {
        setBistEquities(data.equities);
      } else {
        setBistError("Borsa İstanbul live feed returned empty.");
      }
    } catch {
      setBistError("Unable to reach BIST live quote feed.");
    } finally {
      setBistLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLiveBist();
  }, [fetchLiveBist]);

  const internals = useMemo(() => {
    const base = computeOracleXMarketInternals();
    const quoteList = Object.values(liveQuotes);
    if (quoteList.length < 50) return base;

    let advanceCount = 0;
    let declineCount = 0;
    let unchangedCount = 0;
    let sumEq = 0;
    const buckets = [0, 0, 0, 0, 0, 0];

    for (const q of quoteList) {
      const pct = q.change * 100;
      sumEq += pct;
      if (pct > 0.15) advanceCount++;
      else if (pct < -0.15) declineCount++;
      else unchangedCount++;

      if (pct < -5) buckets[0]++;
      else if (pct < -2) buckets[1]++;
      else if (pct < 0) buckets[2]++;
      else if (pct < 2) buckets[3]++;
      else if (pct < 5) buckets[4]++;
      else buckets[5]++;
    }

    const total = quoteList.length || 1;
    const capSyms = ["AAPL", "MSFT", "NVDA", "AMZN", "GOOGL", "META", "BTC", "ETH"];
    const capValues = capSyms.map((s) => (liveQuotes[s]?.change ?? 0) * 100);
    const capWeightedChangePct = Number(
      (capValues.reduce((a, b) => a + b, 0) / capValues.length).toFixed(2)
    );
    const equalWeightedChangePct = Number((sumEq / total).toFixed(2));

    return {
      ...base,
      advanceCount,
      declineCount,
      unchangedCount,
      adRatio: Number((advanceCount / Math.max(1, declineCount)).toFixed(2)),
      capWeightedChangePct,
      equalWeightedChangePct,
      moveDistributionBuckets: base.moveDistributionBuckets.map((b, i) => ({
        ...b,
        count: buckets[i],
        percentage: Number(((buckets[i] / total) * 100).toFixed(1)),
      })),
    };
  }, [liveQuotes]);

  const currentAsset = ASSET_BY_SYMBOL[selectedAssetSymbol] || ASSETS[0];
  const currentMetrics = metricsFor(currentAsset);
  const liveSelectedQuote = liveQuotes[selectedAssetSymbol];
  const liveSpotPrice = liveSelectedQuote?.price ?? currentMetrics.last;
  const liveChange24h = liveSelectedQuote?.change ?? currentMetrics.change24h;

  const liquidity = useMemo(() => {
    const base = computeLiquidityLadder(selectedAssetSymbol);
    if (!base.spotPrice || base.spotPrice <= 0 || Math.abs(liveSpotPrice - base.spotPrice) < 1e-8) {
      return base;
    }
    const scale = liveSpotPrice / base.spotPrice;
    return {
      ...base,
      spotPrice: liveSpotPrice,
      levels: base.levels.map((lvl) => ({
        ...lvl,
        price: Number((lvl.price * scale).toFixed(liveSpotPrice < 1 ? 6 : 2)),
      })),
    };
  }, [selectedAssetSymbol, liveSpotPrice]);

  const divergences = useMemo(
    () =>
      detectMarketDivergences().map((d) => {
        const q = liveQuotes[d.symbol];
        return q
          ? {
              ...d,
              lastPrice: q.price,
              change24h: q.change,
            }
          : d;
      }),
    [liveQuotes]
  );

  const filteredDocs = useMemo(() => queryVectorMemory(ragQuery), [ragQuery]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([fetch("/api/quotes", { cache: "no-store" }), fetchLiveBist()]);
    } catch {
      // keep existing live stream
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <div className="rounded-2xl border border-[#d8ab5a]/25 bg-gradient-to-b from-[#0d1017]/95 to-[#06080d]/95 p-4 sm:p-6 text-[#f2efe8] shadow-[0_24px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl space-y-6">
      {/* Top Banner & Control Deck */}
      <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex items-center gap-1.5 rounded-md border border-[#d8ab5a]/35 bg-[#d8ab5a]/10 px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[#f0c979]">
              <Compass className="h-3.5 w-3.5 text-[#d8ab5a]" />
              CROSS-ASSET VECTOR ENGINE
            </span>
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-mono text-stone-300">
              SEMANTIC RAG · BREADTH · LIQUIDITY
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Vector Memory Store: Synced
            </span>
            <WhopBadge />
          </div>
          <h2 className="mt-2.5 text-2xl sm:text-3xl font-display font-medium tracking-tight text-[#f2efe8]">
            Cross-Asset Vector RAG &amp; Liquidity Radar
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-stone-400">
            Semantic regulatory filing retrieval, Advance/Decline market internals, standing leverage liquidity ladders &amp; Borsa İstanbul board.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Dual Realm Switcher */}
          <div className="flex rounded-xl border border-white/10 bg-[#080a0f] p-1">
            <button
              onClick={() => {
                setRealm("global");
                if (activeTab === "bist") setActiveTab("internals");
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                realm === "global"
                  ? "bg-[#d8ab5a]/15 text-[#f0c979] border border-[#d8ab5a]/35 shadow-sm"
                  : "text-stone-400 hover:text-[#f2efe8]"
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              Global Board (US + Crypto)
            </button>
            <button
              onClick={() => {
                setRealm("bist");
                setActiveTab("bist");
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                realm === "bist"
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-400/35 shadow-sm"
                  : "text-stone-400 hover:text-[#f2efe8]"
              }`}
            >
              <Radio className="h-3.5 w-3.5" />
              Borsa İstanbul (BIST)
            </button>
          </div>

          <button
            onClick={handleRefresh}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-mono text-stone-300 hover:text-[#f0c979] hover:border-[#d8ab5a]/40 transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-[#f0c979]" : ""}`} />
            <span>Sync</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/[0.07] bg-[#080a0f]/90 p-1.5">
        {[
          { id: "internals", label: "Market Internals & A/D", icon: BarChart3 },
          { id: "ladder", label: "Liquidity Ladder (Leverage)", icon: Layers },
          { id: "rag", label: "Semantic Vector RAG", icon: Database },
          { id: "divergence", label: "Divergence Radar", icon: Zap },
          { id: "bist", label: "BIST & KAP Disclosures", icon: Radio },
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as typeof activeTab)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition ${
                isActive
                  ? "bg-gradient-to-r from-[#d8ab5a] to-[#f0c979] text-[#050609] font-semibold shadow-[0_4px_16px_rgba(216,171,90,0.22)]"
                  : "text-stone-400 hover:text-[#f2efe8] hover:bg-white/[0.04]"
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? "text-[#050609]" : "text-[#d8ab5a]"}`} />
              <span>{t.label}</span>
              {t.id === "rag" && (
                <span
                  className={`rounded px-1.5 py-0.2 text-[9px] font-mono border ${
                    isActive
                      ? "bg-[#050609]/20 text-[#050609] border-[#050609]/30"
                      : "bg-sky-500/10 text-sky-300 border-sky-400/30"
                  }`}
                >
                  RAG
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* TAB 1: MARKET INTERNALS & ADVANCE/DECLINE */}
      {activeTab === "internals" && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-white/[0.08] bg-[#090c12] p-4">
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-stone-400">Advance / Decline Ratio</span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-[#f2efe8] tabular-nums">{internals.adRatio}</span>
                <span className="text-xs text-emerald-400 font-mono font-medium tabular-nums">
                  {internals.advanceCount} Up / {internals.declineCount} Down
                </span>
              </div>
              <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-rose-950">
                <div
                  className="bg-emerald-400 transition-all duration-500"
                  style={{ width: `${(internals.advanceCount / (internals.advanceCount + internals.declineCount || 1)) * 100}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#090c12] p-4">
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-stone-400">Cap-Weighted vs Equal</span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-[#f2efe8] tabular-nums">{fmtPct(internals.capWeightedChangePct / 100)}</span>
                <span className="text-xs text-stone-400 font-mono tabular-nums">eq: {fmtPct(internals.equalWeightedChangePct / 100)}</span>
              </div>
              <p className="mt-2 text-[11px] text-stone-400 tabular-nums">
                Mega-cap divergence premium: +{(internals.capWeightedChangePct - internals.equalWeightedChangePct).toFixed(2)}%
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#090c12] p-4">
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-stone-400">A/D Volume Ratio</span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-[#f0c979] tabular-nums">{internals.advanceDeclineVolumeRatio}x</span>
                <span className="text-xs text-stone-400 font-mono">Buy side dominant</span>
              </div>
              <p className="mt-2 text-[11px] text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="h-3 w-3" />
                Aggressive buyer accumulation
              </p>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#090c12] p-4">
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-stone-400">Unchanged Breadth</span>
              <div className="mt-1.5 flex items-baseline gap-2">
                <span className="font-mono text-2xl font-bold text-[#f2efe8] tabular-nums">{internals.unchangedCount}</span>
                <span className="text-xs text-stone-400 font-mono">Consolidating</span>
              </div>
              <p className="mt-2 text-[11px] text-stone-400">
                Low churn across cross-rate peg pairs
              </p>
            </div>
          </div>

          {/* 24h Move Distribution Histogram */}
          <div className="rounded-xl border border-white/[0.08] bg-[#090c12] p-5">
            <div className="flex items-center justify-between pb-4">
              <div>
                <h3 className="font-display text-base font-medium text-[#f2efe8] flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-[#d8ab5a]" />
                  24h Return Distribution Buckets
                </h3>
                <p className="text-xs text-stone-400">Breakdown of asset return density across percentage tranches</p>
              </div>
              <span className="rounded-md bg-[#d8ab5a]/10 px-2.5 py-0.5 text-[10px] font-mono text-[#f0c979] border border-[#d8ab5a]/30 tabular-nums">
                TOTAL: {ASSETS.length} TICKERS
              </span>
            </div>

            <div className="grid gap-3 sm:grid-cols-6 pt-2">
              {internals.moveDistributionBuckets.map((b) => (
                <div key={b.bucket} className="flex flex-col items-center justify-end rounded-lg border border-white/[0.06] bg-[#050609] p-3">
                  <span className="font-mono text-sm font-bold text-[#f2efe8] tabular-nums">{b.count}</span>
                  <span className="text-[10px] font-mono text-stone-400 mb-2 tabular-nums">{b.percentage}%</span>
                  <div className="w-full bg-white/[0.04] rounded-md h-24 flex items-end p-1">
                    <div
                      className={`w-full rounded transition-all duration-700 ${b.color}`}
                      style={{ height: `${Math.max(8, b.percentage * 2)}%` }}
                    />
                  </div>
                  <span className="mt-2 text-[10px] font-mono text-stone-400 text-center">{b.bucket}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIQUIDITY LADDER (STANDING LEVERAGE) */}
      {activeTab === "ladder" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-white/[0.08] bg-[#090c12] p-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono text-stone-400">Select Monitored Asset:</span>
              <div className="flex flex-wrap gap-1.5">
                {["BTC", "ETH", "SOL", "NVDA", "AAPL", "TSLA"].map((sym) => (
                  <button
                    key={sym}
                    onClick={() => setSelectedAssetSymbol(sym)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-mono font-semibold transition ${
                      selectedAssetSymbol === sym
                        ? "bg-gradient-to-r from-[#d8ab5a] to-[#f0c979] text-[#050609]"
                        : "bg-white/[0.05] text-stone-300 hover:bg-white/[0.1]"
                    }`}
                  >
                    {sym}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono tabular-nums">
              <span className="text-stone-400">Spot Price:</span>
              <span className="text-lg font-bold text-[#f2efe8]">{fmtPrice(liquidity.spotPrice)}</span>
              <span className={liveChange24h >= 0 ? "text-emerald-400" : "text-rose-400"}>
                {fmtPct(liveChange24h)}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#090c12] p-5 space-y-3">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3 text-[10px] font-mono text-stone-400 uppercase tracking-wider">
              <span>Tranche Type</span>
              <span>Trigger Price</span>
              <span>Distance</span>
              <span>Est. Squeeze / Liquidation Volume</span>
              <span>Density</span>
            </div>

            <div className="space-y-2">
              {liquidity.levels.map((lvl, idx) => {
                const isSpot = lvl.type === "SPOT";
                const isShortLiq = lvl.type === "SHORT_LIQUIDATION";
                const isLongLiq = lvl.type === "LONG_LIQUIDATION";

                let rowBg = "bg-[#050609] border-white/[0.06]";
                let textCol = "text-[#f2efe8]";
                if (isSpot) {
                  rowBg = "bg-[#d8ab5a]/10 border-[#d8ab5a]/45";
                  textCol = "text-[#f0c979] font-bold";
                } else if (isShortLiq) {
                  rowBg = "bg-rose-950/20 border-rose-500/25";
                } else if (isLongLiq) {
                  rowBg = "bg-emerald-950/20 border-emerald-500/25";
                }

                return (
                  <div
                    key={idx}
                    className={`flex items-center justify-between rounded-lg border px-4 py-2.5 font-mono text-xs transition tabular-nums ${rowBg}`}
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-block h-2 w-2 rounded-full ${
                          isSpot
                            ? "bg-[#f0c979] animate-ping"
                            : isShortLiq
                            ? "bg-rose-500"
                            : isLongLiq
                            ? "bg-emerald-500"
                            : "bg-stone-500"
                        }`}
                      />
                      <span className={`text-xs font-semibold ${textCol}`}>{lvl.type}</span>
                    </div>

                    <span className="font-bold text-[#f2efe8]">{fmtPrice(lvl.price)}</span>

                    <span className={lvl.distancePct > 0 ? "text-rose-400" : lvl.distancePct < 0 ? "text-emerald-400" : "text-[#f0c979]"}>
                      {lvl.distancePct > 0 ? `+${lvl.distancePct}%` : `${lvl.distancePct}%`}
                    </span>

                    <div className="flex items-center gap-2">
                      <span className="text-stone-200">${lvl.estLiquidityMillion}M USD</span>
                      <div className="w-20 bg-white/[0.06] rounded-full h-1.5 overflow-hidden hidden sm:block">
                        <div
                          className={`h-full ${
                            isShortLiq ? "bg-rose-500" : isLongLiq ? "bg-emerald-500" : "bg-[#d8ab5a]"
                          }`}
                          style={{ width: `${Math.min(100, (lvl.estLiquidityMillion / 850) * 100)}%` }}
                        />
                      </div>
                    </div>

                    <span
                      className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                        lvl.density === "HIGH"
                          ? "bg-rose-500/15 text-rose-300 border border-rose-500/30"
                          : lvl.density === "MEDIUM"
                          ? "bg-[#d8ab5a]/15 text-[#f0c979] border border-[#d8ab5a]/30"
                          : "bg-white/[0.05] text-stone-400"
                      }`}
                    >
                      {lvl.density}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: VECTOR RAG KNOWLEDGE STORE */}
      {activeTab === "rag" && (
        <div className="space-y-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#d8ab5a]" />
              <input
                type="text"
                value={ragQuery}
                onChange={(e) => setRagQuery(e.target.value)}
                placeholder="Query Vector Embeddings (e.g., Blackwell wafer, FOMC reverse repo, BIST reserves)..."
                className="w-full rounded-xl border border-white/10 bg-[#080a0f] py-2.5 pl-10 pr-4 text-xs font-mono text-[#f2efe8] placeholder:text-stone-500 focus:border-[#d8ab5a]/60 focus:outline-none"
              />
            </div>
            {ragQuery && (
              <button
                onClick={() => setRagQuery("")}
                className="rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-xs font-mono text-stone-300 hover:text-white"
              >
                Clear Query
              </button>
            )}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Document Vector List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono text-stone-400">
                <span>Retrieved Knowledge Chunks ({filteredDocs.length})</span>
                <span className="text-[#f0c979]">Cosine Distance &le; 0.25</span>
              </div>

              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`cursor-pointer rounded-xl border p-4 transition ${
                    selectedDoc?.id === doc.id
                      ? "border-[#d8ab5a]/55 bg-[#d8ab5a]/[0.07]"
                      : "border-white/[0.07] bg-[#090c12] hover:border-[#d8ab5a]/35"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-sky-500/10 px-2 py-0.5 text-[10px] font-mono font-medium text-sky-300 border border-sky-400/25">
                      {doc.category}
                    </span>
                    <span className="text-[10px] font-mono text-stone-400 tabular-nums">
                      Distance: <span className="text-emerald-400 font-bold">{doc.distance}</span>
                    </span>
                  </div>
                  <h4 className="mt-2 text-sm font-semibold text-[#f2efe8]">{doc.title}</h4>
                  <p className="mt-1 line-clamp-2 text-xs text-stone-400">{doc.content}</p>
                  <p className="mt-2 text-[10px] font-mono text-stone-500">{doc.source}</p>
                </div>
              ))}
            </div>

            {/* Document Reader & Semantic Vector Inspector */}
            <div className="rounded-xl border border-white/[0.08] bg-[#090c12] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                <span className="text-[11px] font-mono text-[#f0c979] font-semibold flex items-center gap-1.5">
                  <Database className="h-3.5 w-3.5 text-[#d8ab5a]" />
                  VECTOR CHUNK INSPECTION
                </span>
                <span className="rounded bg-[#050609] px-2 py-0.5 text-[10px] font-mono text-stone-400 border border-white/10">
                  {selectedDoc?.id || "N/A"}
                </span>
              </div>

              {selectedDoc ? (
                <>
                  <div>
                    <h3 className="font-display text-lg text-[#f2efe8]">{selectedDoc.title}</h3>
                    <p className="mt-1 text-xs text-[#f0c979] font-mono">{selectedDoc.source}</p>
                  </div>

                  <div className="rounded-lg border border-white/[0.06] bg-[#050609] p-4 font-mono text-xs leading-relaxed text-stone-200">
                    &ldquo;{selectedDoc.content}&rdquo;
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                    <div className="rounded-lg border border-white/[0.06] bg-[#050609] p-2.5">
                      <span className="text-[10px] text-stone-400">Embedding Distance</span>
                      <p className="mt-0.5 font-bold text-emerald-400 tabular-nums">{selectedDoc.distance} (High Match)</p>
                    </div>
                    <div className="rounded-lg border border-white/[0.06] bg-[#050609] p-2.5">
                      <span className="text-[10px] text-stone-400">Verification Status</span>
                      <p className="mt-0.5 font-bold text-[#f2efe8]">Vector Index Verified</p>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#d8ab5a]/25 bg-[#d8ab5a]/[0.05] p-3 text-[11px] text-stone-300 flex items-start gap-2">
                    <Info className="h-4 w-4 shrink-0 text-[#d8ab5a] mt-0.5" />
                    <p>
                      Cross-asset vector memory continuously embeds financial regulatory filings into semantic indexes to furnish deterministic quantitative rationale.
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-xs text-stone-400">No document selected.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DIVERGENCE DETECTION RADAR */}
      {activeTab === "divergence" && (
        <div className="space-y-6">
          <div className="rounded-xl border border-white/[0.08] bg-[#090c12] p-4">
            <h3 className="font-display text-base text-[#f2efe8] flex items-center gap-2">
              <Zap className="h-4 w-4 text-[#f0c979]" />
              Decoupling &amp; Mean-Reversion Radar
            </h3>
            <p className="text-xs text-stone-400 mt-1">
              Scans 2,000+ instruments for daily price velocity that conflicts with higher-timeframe 7-day trend structure.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {divergences.map((div, i) => {
              const isBull = div.divergenceType.includes("Bullish");
              return (
                <div
                  key={i}
                  className={`rounded-xl border p-5 space-y-3 ${
                    isBull ? "border-emerald-500/30 bg-emerald-950/10" : "border-rose-500/30 bg-rose-950/10"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-lg font-bold font-mono text-[#f2efe8]">{div.symbol}</span>
                      <span className="ml-2 text-xs text-stone-400">{div.name}</span>
                    </div>
                    <span
                      className={`rounded px-2.5 py-0.5 text-[10px] font-mono font-bold ${
                        div.signalStrength === "STRONG"
                          ? "bg-[#d8ab5a]/15 text-[#f0c979] border border-[#d8ab5a]/40"
                          : "bg-white/[0.06] text-stone-300"
                      }`}
                    >
                      {div.signalStrength} SIGNAL
                    </span>
                  </div>

                  <div className="rounded-lg bg-[#050609] p-3 font-mono text-xs space-y-1.5 border border-white/[0.06] tabular-nums">
                    <div className="flex justify-between">
                      <span className="text-stone-400">Classification:</span>
                      <span className={isBull ? "text-emerald-400 font-semibold" : "text-rose-400 font-semibold"}>
                        {div.divergenceType}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">24h Velocity:</span>
                      <span className={div.change24h >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        {fmtPct(div.change24h)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">7d Structural Trend:</span>
                      <span className={div.change7d >= 0 ? "text-emerald-400" : "text-rose-400"}>
                        {fmtPct(div.change7d)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-400">Current Spot:</span>
                      <span className="text-[#f2efe8]">{fmtPrice(div.lastPrice)}</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-stone-400 leading-relaxed">
                    {isBull
                      ? "Day rally into oversold multi-day downtrend indicates potential short covering squeeze."
                      : "Intraday breakdown following multi-day extension signals exhaustion & profit-taking."}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 5: BORSA İSTANBUL (BIST) REALM */}
      {activeTab === "bist" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-xl border border-[#d8ab5a]/30 bg-[#d8ab5a]/[0.06] p-4">
            <div>
              <span className="text-xs font-mono font-semibold text-[#f0c979] uppercase tracking-wider flex items-center gap-1.5">
                <Radio className="h-4 w-4 text-[#d8ab5a]" />
                Borsa İstanbul (BIST 100) Equities
              </span>
              <p className="mt-1 text-xs text-stone-400">
                Real-time Turkish Lira denominated equities with KAMUOYU AYDINLATMA PLATFORMU (KAP) disclosures.
              </p>
            </div>
            <span className="rounded bg-[#050609] px-2.5 py-1 text-xs font-mono text-[#f0c979] border border-[#d8ab5a]/35">
              TRY REALM
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-white/[0.08] bg-[#090c12]">
            <table className="w-full text-left font-mono text-xs tabular-nums">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#050609] text-[10px] text-stone-400 uppercase tracking-wider">
                  <th className="px-4 py-3">Ticker</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Spot (TRY)</th>
                  <th className="px-4 py-3">24h Change</th>
                  <th className="px-4 py-3">P/E</th>
                  <th className="px-4 py-3">Div Yield</th>
                  <th className="px-4 py-3">Latest KAP Regulatory Disclosure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {bistLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-stone-400">
                      Syncing live Borsa İstanbul quotes...
                    </td>
                  </tr>
                ) : bistEquities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-rose-400">
                      {bistError ?? "Borsa İstanbul live feed unavailable."}
                    </td>
                  </tr>
                ) : (
                  bistEquities.map((eq) => (
                    <tr key={eq.symbol} className="hover:bg-white/[0.03] transition">
                      <td className="px-4 py-3 font-bold text-[#f0c979]">{eq.symbol}</td>
                      <td className="px-4 py-3 text-stone-300">{eq.name}</td>
                      <td className="px-4 py-3 font-bold text-[#f2efe8]">₺{eq.priceTRY.toFixed(2)}</td>
                      <td className={`px-4 py-3 font-semibold ${eq.change24hPct >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {eq.change24hPct >= 0 ? `+${eq.change24hPct}%` : `${eq.change24hPct}%`}
                      </td>
                      <td className="px-4 py-3 text-[#f2efe8]">
                        {eq.peRatio > 0 ? `${eq.peRatio}x` : "—"}
                      </td>
                      <td className="px-4 py-3 text-[#f0c979]">
                        {eq.dividendYieldPct > 0 ? `${eq.dividendYieldPct}%` : "—"}
                      </td>
                      <td className="px-4 py-3 text-[11px] text-stone-300 max-w-xs truncate" title={eq.kapLastDisclosure}>
                        {eq.kapLastDisclosure}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Footer System Rationale */}
      <div className="border-t border-white/[0.07] pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-stone-400 gap-2">
        <div className="flex items-center gap-2">
          <Terminal className="h-3.5 w-3.5 text-[#d8ab5a]" />
          <span>Cross-Asset Intelligence Core // Vector RAG + Microstructure Liquidity Engine</span>
        </div>
        <div className="text-emerald-400/90">
          US Equities · Digital Assets · Borsa İstanbul
        </div>
      </div>
    </div>
  );
}
