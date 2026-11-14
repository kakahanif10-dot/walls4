"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Radio,
  Search,
  ExternalLink,
  Zap,
  Globe,
  AlertTriangle,
  ArrowUpRight,
  Terminal,
  Clock,
  Bookmark,
  Share2,
  Copy,
  Layers,
  RotateCcw,
} from "lucide-react";
import {
  NEWS_CATEGORIES,
  QUERY_PRESETS,
  computeCategoryCounts,
  filterArticlesByCriteria,
  type NewsArticle,
} from "@/lib/realtime-news-api";
import { useWatchlist } from "@/lib/use-watchlist";
import WhopBadge from "@/components/whop-badge";

export default function RealtimeNewsTerminal() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [queryString, setQueryString] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [selectedSource, setSelectedSource] = useState<string>("ALL");
  const [selectedSentiment, setSelectedSentiment] = useState<string>("ALL");
  const [watchlistOnly, setWatchlistOnly] = useState<boolean>(false);
  const [isStreaming, setIsStreaming] = useState<boolean>(true);
  const [latencyMs, setLatencyMs] = useState<number>(14);
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);
  const [showApiConsole, setShowApiConsole] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const { has } = useWatchlist();

  // Live /api/newsfilter polling every 20 seconds when streaming is active
  useEffect(() => {
    let cancelled = false;

    const pullLiveWire = async () => {
      const t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
      try {
        const res = await fetch("/api/newsfilter?limit=30", { cache: "no-store" });
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        if (cancelled) return;
        const data = (await res.json()) as { articles?: NewsArticle[] };
        const elapsed = Math.max(1, Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - t0));
        if (cancelled) return;
        setLatencyMs(elapsed);
        setFeedError(null);

        if (Array.isArray(data.articles) && data.articles.length > 0) {
          setArticles((prev) => {
            const seen = new Set(data.articles!.map((a) => a.title.toLowerCase().trim()));
            const existingFiltered = prev.filter((a) => !seen.has(a.title.toLowerCase().trim()));
            return [...data.articles!, ...existingFiltered].slice(0, 60);
          });
        }
      } catch (err) {
        if (!cancelled) {
          setFeedError(err instanceof Error ? err.message : "Live news wire unavailable");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    pullLiveWire();
    if (!isStreaming) {
      return () => {
        cancelled = true;
      };
    }

    const interval = setInterval(pullLiveWire, 20_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [isStreaming]);

  const baseFilteredArticles = useMemo(() => {
    return filterArticlesByCriteria(articles, {
      queryString,
      source: selectedSource,
      sentiment: selectedSentiment,
      hasWatchlistSymbol: watchlistOnly ? has : undefined,
    });
  }, [articles, queryString, selectedSource, selectedSentiment, watchlistOnly, has]);

  const categoryCounts = useMemo(() => {
    return computeCategoryCounts(baseFilteredArticles, NEWS_CATEGORIES);
  }, [baseFilteredArticles]);

  const filteredArticles = useMemo(() => {
    if (selectedCategory === "ALL") return baseFilteredArticles;
    return filterArticlesByCriteria(baseFilteredArticles, { category: selectedCategory });
  }, [baseFilteredArticles, selectedCategory]);

  const resolvedActiveArticle = useMemo(() => {
    if (filteredArticles.length === 0) return null;
    if (activeArticle && filteredArticles.some((a) => a.id === activeArticle.id)) {
      return activeArticle;
    }
    return filteredArticles[0];
  }, [filteredArticles, activeArticle]);

  const hasActiveFilters =
    Boolean(queryString.trim()) ||
    selectedCategory !== "ALL" ||
    selectedSource !== "ALL" ||
    selectedSentiment !== "ALL" ||
    watchlistOnly;

  const resetAllFilters = () => {
    setQueryString("");
    setSelectedCategory("ALL");
    setSelectedSource("ALL");
    setSelectedSentiment("ALL");
    setWatchlistOnly(false);
  };

  const handleCopyApiCurl = () => {
    const curl = `curl -X POST https://nextwallstreet.com/api/newsfilter \\
  -H "Content-Type: application/json" \\
  -d '{"type": "filterArticles", "queryString": "${queryString || "symbols:NVDA"}"}'`;
    navigator.clipboard.writeText(curl);
    setCopiedId("curl");
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="rounded-2xl border border-[#d8ab5a]/25 bg-gradient-to-b from-[#0d1017]/95 to-[#06080d]/95 p-4 sm:p-6 text-[#f2efe8] shadow-[0_24px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl space-y-6">
      {/* Top Bar with Real-Time WebSocket Telemetry */}
      <div className="flex flex-col gap-4 border-b border-white/[0.08] pb-5 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="flex items-center gap-1.5 rounded-md border border-[#d8ab5a]/35 bg-[#d8ab5a]/10 px-2.5 py-0.5 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[#f0c979]">
              <Radio className="h-3.5 w-3.5 text-emerald-400 animate-pulse" />
              LIVE NEWS WIRE
            </span>
            <span className="rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[10px] font-mono text-stone-300">
              10,000+ INSTITUTIONAL FEEDS
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 tabular-nums">
              <span className={`h-2 w-2 rounded-full ${isStreaming ? "bg-emerald-400 animate-ping" : "bg-rose-400"}`} />
              {isStreaming ? `WebSocket: CONNECTED (${latencyMs}ms)` : "WebSocket: PAUSED"}
            </span>
            <WhopBadge />
          </div>

          <h2 className="mt-2.5 text-2xl sm:text-3xl font-display font-medium tracking-tight text-[#f2efe8]">
            Live Financial News Stream &amp; Query Wire
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-stone-400">
            Sub-second dispatches across global wires, SEC EDGAR, and regulatory bulletins mapped directly to tradeable tickers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsStreaming((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-mono font-semibold transition ${
              isStreaming
                ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_20px_rgba(62,207,142,0.12)]"
                : "border-white/10 bg-white/[0.04] text-stone-400 hover:text-[#f2efe8]"
            }`}
          >
            <Radio className="h-3.5 w-3.5" />
            <span>{isStreaming ? "Stream Active" : "Stream Paused"}</span>
          </button>

          <button
            type="button"
            onClick={() => setShowApiConsole((prev) => !prev)}
            className={`flex items-center gap-1.5 rounded-xl border px-3.5 py-2 text-xs font-mono font-semibold transition ${
              showApiConsole
                ? "border-[#d8ab5a]/50 bg-[#d8ab5a]/15 text-[#f0c979]"
                : "border-white/10 bg-white/[0.04] text-stone-300 hover:border-[#d8ab5a]/40 hover:text-[#f0c979]"
            }`}
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Query API Console</span>
          </button>
        </div>
      </div>

      {/* Query API Console Box (Expandable) */}
      {showApiConsole && (
        <div className="rounded-xl border border-[#d8ab5a]/30 bg-[#090b10]/90 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="h-4 w-4 text-[#f0c979]" />
              <h3 className="font-mono text-xs font-semibold tracking-wider text-[#f0c979]">
                NEWS QUERY WIRE ENDPOINT SPECIFICATION
              </h3>
            </div>
            <button
              type="button"
              onClick={handleCopyApiCurl}
              className="flex items-center gap-1 text-[11px] font-mono text-[#f0c979] hover:underline"
            >
              <Copy className="h-3 w-3" />
              <span>{copiedId === "curl" ? "Copied curl!" : "Copy curl command"}</span>
            </button>
          </div>

          <div className="rounded-lg border border-white/[0.06] bg-[#050609] p-3 font-mono text-xs text-stone-400 overflow-x-auto space-y-1">
            <p className="text-[#f0c979]"># POST /api/newsfilter</p>
            <p>Content-Type: application/json</p>
            <p className="text-emerald-300">&#123; &quot;type&quot;: &quot;filterArticles&quot;, &quot;queryString&quot;: &quot;{queryString || "symbols:NVDA"}&quot; &#125;</p>
          </div>

          <p className="text-[11px] text-stone-400">
            Query dispatches by ticker (<code className="text-[#f0c979]">symbols:AAPL</code>), source (<code className="text-[#f0c979]">source:sec_edgar</code>), category (<code className="text-[#f0c979]">category:Geopolitics</code>), or Lucene operators (<code className="text-[#f0c979]">title:&quot;FDA Approval&quot; OR symbols:NVDA</code>).
          </p>
        </div>
      )}

      {/* Search & Query Bar */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#d8ab5a]" />
          <input
            type="text"
            aria-label="Lucene filter query"
            value={queryString}
            onChange={(e) => setQueryString(e.target.value)}
            placeholder='Lucene Filter Query (e.g. symbols:NVDA OR category:Geopolitics OR source:sec_edgar)...'
            className="w-full rounded-xl border border-white/10 bg-[#080a0f] py-3 pl-10 pr-20 text-xs sm:text-sm font-mono text-[#f2efe8] placeholder:text-stone-500 focus:border-[#d8ab5a]/60 focus:outline-none transition"
          />
          {queryString && (
            <button
              type="button"
              onClick={() => setQueryString("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[11px] font-mono text-stone-300 hover:text-white"
            >
              Clear
            </button>
          )}
        </div>

        {/* Query Presets Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-mono text-stone-400 flex items-center gap-1">
            <Layers className="h-3 w-3 text-[#d8ab5a]" />
            Presets:
          </span>
          {QUERY_PRESETS.map((preset) => (
            <button
              type="button"
              key={preset.id}
              onClick={() => setQueryString(preset.query)}
              className={`rounded-lg border px-2.5 py-1 text-[11px] font-mono transition ${
                queryString === preset.query
                  ? "border-[#d8ab5a]/60 bg-[#d8ab5a]/15 text-[#f0c979] font-semibold"
                  : "border-white/[0.08] bg-white/[0.03] text-stone-400 hover:text-[#f2efe8] hover:border-[#d8ab5a]/35"
              }`}
              title={preset.desc}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Category & Stream Refinement Bar */}
      <div className="flex flex-col gap-3 border-y border-white/[0.08] py-3.5 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Category filter">
          <span className="mr-1.5 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.12em] text-[#f0c979]">
            <Layers className="h-3.5 w-3.5 text-[#d8ab5a]" />
            Category:
          </span>
          {(["ALL", ...NEWS_CATEGORIES] as const).map((cat) => {
            const isActive = selectedCategory === cat;
            const count = categoryCounts[cat] ?? 0;
            const label = cat === "ALL" ? "All" : cat;
            return (
              <button
                type="button"
                key={cat}
                aria-pressed={isActive}
                onClick={() => setSelectedCategory(cat)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition ${
                  isActive
                    ? "bg-gradient-to-r from-[#d8ab5a] to-[#f0c979] text-[#050609] font-semibold shadow-sm"
                    : "border border-white/[0.08] bg-white/[0.03] text-stone-300 hover:border-[#d8ab5a]/35 hover:text-[#f2efe8]"
                }`}
              >
                <span>{label}</span>
                <span
                  className={`rounded px-1 py-0.2 text-[10px] tabular-nums ${
                    isActive ? "bg-[#050609]/20 text-[#050609]" : "bg-white/[0.06] text-stone-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2.5 border-t border-white/[0.05] pt-2.5">
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Filter by category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#080a0f] px-2.5 py-1.5 text-xs text-[#f2efe8] focus:border-[#d8ab5a]/50 focus:outline-none"
            >
              <option value="ALL">All Categories ({categoryCounts.ALL ?? 0})</option>
              {NEWS_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat} ({categoryCounts[cat] ?? 0})
                </option>
              ))}
            </select>

            <select
              aria-label="Filter by sentiment"
              value={selectedSentiment}
              onChange={(e) => setSelectedSentiment(e.target.value)}
              className="rounded-lg border border-white/10 bg-[#080a0f] px-2.5 py-1.5 text-xs text-[#f2efe8] focus:border-[#d8ab5a]/50 focus:outline-none"
            >
              <option value="ALL">All Sentiments</option>
              <option value="BULLISH">Bullish Only</option>
              <option value="BEARISH">Bearish Only</option>
              <option value="NEUTRAL">Neutral Only</option>
            </select>

            <button
              type="button"
              aria-pressed={watchlistOnly}
              onClick={() => setWatchlistOnly((prev) => !prev)}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition border ${
                watchlistOnly
                  ? "border-[#d8ab5a]/60 bg-[#d8ab5a]/15 text-[#f0c979] font-semibold"
                  : "border-white/[0.08] bg-white/[0.03] text-stone-300 hover:text-[#f2efe8]"
              }`}
            >
              <Bookmark className="h-3 w-3" />
              <span>My Watchlist Only</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {hasActiveFilters && (
              <button
                type="button"
                onClick={resetAllFilters}
                className="flex items-center gap-1 rounded-lg border border-[#d8ab5a]/30 bg-[#d8ab5a]/10 px-2.5 py-1.5 text-xs text-[#f0c979] hover:bg-[#d8ab5a]/20 transition"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Stream Area: Feed + Detail Drawer */}
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* Stream List */}
        <div className="space-y-3 max-h-[700px] overflow-y-auto pr-1" data-testid="news-feed-list">
          <div className="flex items-center justify-between text-xs font-mono text-stone-400 pb-1">
            <span>
              Matching Dispatches: <strong className="text-[#f0c979] tabular-nums">{filteredArticles.length}</strong>
              {selectedCategory !== "ALL" && (
                <span className="ml-2 text-stone-300">· Category: <strong className="text-[#f0c979]">{selectedCategory}</strong></span>
              )}
            </span>
            <span>Real-time Order: Newest First</span>
          </div>

          {filteredArticles.length === 0 ? (
            <div className="rounded-xl border border-white/[0.08] bg-[#080a0f] p-8 text-center text-stone-400">
              <AlertTriangle className="mx-auto h-8 w-8 text-[#d8ab5a] mb-2" />
              {isLoading && articles.length === 0 ? (
                <>
                  <p className="text-sm font-semibold text-[#f2efe8]">Connecting to live institutional news wire...</p>
                  <p className="text-xs mt-1">Streaming real-time SEC EDGAR, CNBC, MarketWatch &amp; Yahoo Finance dispatches.</p>
                </>
              ) : feedError && articles.length === 0 ? (
                <>
                  <p className="text-sm font-semibold text-[#f2efe8]">Live news wire temporarily unavailable ({feedError}).</p>
                  <p className="text-xs mt-1">No static or fabricated headlines displayed.</p>
                </>
              ) : (
                <>
                  <p className="text-sm font-semibold text-[#f2efe8]">No dispatches match current query criteria.</p>
                  <p className="text-xs mt-1">Try resetting the query or selecting another category or sentiment filter.</p>
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="mt-4 rounded-xl bg-gradient-to-r from-[#d8ab5a] to-[#f0c979] px-4 py-2 text-xs font-mono font-semibold text-[#050609]"
                  >
                    Reset All Filters
                  </button>
                </>
              )}
            </div>
          ) : (
            filteredArticles.map((art) => {
              const isSelected = resolvedActiveArticle?.id === art.id;
              const isBull = art.sentiment === "BULLISH";
              const isBear = art.sentiment === "BEARISH";

              return (
                <article
                  key={art.id}
                  onClick={() => setActiveArticle(art)}
                  className={`cursor-pointer rounded-xl border p-4 transition-all duration-200 ${
                    isSelected
                      ? "border-[#d8ab5a]/55 bg-[#d8ab5a]/[0.07] shadow-[0_8px_24px_rgba(216,171,90,0.1)]"
                      : "border-white/[0.07] bg-[#0a0d14]/80 hover:border-[#d8ab5a]/35 hover:bg-[#0e121b]"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="rounded-md bg-white/[0.04] border border-white/10 px-2 py-0.5 text-[10px] font-mono text-stone-300">
                        {art.source.name}
                      </span>
                      <span className="rounded-md bg-[#d8ab5a]/10 border border-[#d8ab5a]/30 px-2 py-0.5 text-[10px] font-mono text-[#f0c979] font-medium">
                        {art.category}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`rounded-md px-2 py-0.5 text-[10px] font-mono font-semibold ${
                          isBull
                            ? "bg-emerald-500/10 text-emerald-300 border border-emerald-400/25"
                            : isBear
                            ? "bg-rose-500/10 text-rose-300 border border-rose-400/25"
                            : "bg-sky-500/10 text-sky-300 border border-sky-400/25"
                        }`}
                      >
                        {art.sentiment}
                      </span>
                      <span className="text-[10px] font-mono text-stone-400 tabular-nums">
                        Impact: <strong className="text-[#f2efe8]">{art.impactScore}/10</strong>
                      </span>
                    </div>
                  </div>

                  <h3 className="mt-2.5 text-sm sm:text-[15px] font-semibold text-[#f2efe8] leading-snug">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveArticle(art);
                      }}
                      className="text-left hover:text-[#f0c979] focus:outline-none focus-visible:underline transition-colors"
                    >
                      {art.title}
                    </button>
                  </h3>

                  <p className="mt-1 line-clamp-2 text-xs text-stone-400 leading-relaxed">
                    {art.description}
                  </p>

                  <div className="mt-3 flex items-center justify-between pt-2.5 border-t border-white/[0.06] text-xs font-mono">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] text-stone-500 uppercase">Tickers:</span>
                      {art.symbols.map((sym) => (
                        <Link
                          key={sym}
                          href={`/ticker/${sym}`}
                          onClick={(e) => e.stopPropagation()}
                          className="rounded bg-[#050609] border border-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#f0c979] hover:border-[#d8ab5a]/60 transition"
                        >
                          ${sym}
                        </Link>
                      ))}
                    </div>

                    <span className="text-[10px] text-stone-400 flex items-center gap-1 tabular-nums">
                      <Clock className="h-3 w-3 text-stone-500" />
                      {new Date(art.publishedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </article>
              );
            })
          )}
        </div>

        {/* Selected Article Detail & Rationale Terminal */}
        <div className="rounded-xl border border-white/[0.09] bg-[#090c12]/90 p-5 space-y-4 lg:sticky lg:top-24 h-fit shadow-xl" data-testid="dispatch-dossier">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <span className="text-xs font-mono text-[#f0c979] font-semibold flex items-center gap-1.5 tracking-wider">
              <Zap className="h-4 w-4 text-[#d8ab5a]" />
              DISPATCH DOSSIER &amp; EXECUTION
            </span>
            <span className="text-[10px] font-mono text-stone-400 tabular-nums">
              ID: {resolvedActiveArticle?.id || "N/A"}
            </span>
          </div>

          {resolvedActiveArticle ? (
            <>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-md bg-emerald-500/10 border border-emerald-400/25 px-2.5 py-0.5 text-[10px] font-mono text-emerald-300">
                    {resolvedActiveArticle.source.name}
                  </span>
                  <span className="rounded-md bg-[#d8ab5a]/10 border border-[#d8ab5a]/30 px-2.5 py-0.5 text-[10px] font-mono text-[#f0c979]">
                    {resolvedActiveArticle.category}
                  </span>
                </div>
                <h3 className="mt-2.5 font-display text-lg font-medium text-[#f2efe8] leading-snug">
                  {resolvedActiveArticle.title}
                </h3>
                <p className="mt-1.5 text-xs text-stone-400 font-mono">
                  {resolvedActiveArticle.author} · {new Date(resolvedActiveArticle.publishedAt).toUTCString()}
                </p>
              </div>

              <div className="rounded-lg border border-white/[0.06] bg-[#050609] p-4 font-sans text-xs sm:text-sm leading-relaxed text-stone-200">
                {resolvedActiveArticle.description}
              </div>

              {resolvedActiveArticle.invalidationAlert && (
                <div className="rounded-lg border border-[#d8ab5a]/35 bg-[#d8ab5a]/[0.06] p-3 text-xs text-[#f0c979] flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-[#d8ab5a] shrink-0 mt-0.5" />
                  <div>
                    <strong className="font-mono uppercase text-[10px] tracking-wider text-[#d8ab5a]">
                      Invalidation Stop Threshold:
                    </strong>
                    <p className="mt-0.5 text-stone-200">{resolvedActiveArticle.invalidationAlert}</p>
                  </div>
                </div>
              )}

              {/* Tickers Action Row */}
              <div className="border-t border-white/[0.07] pt-3 space-y-2">
                <span className="text-xs font-mono text-stone-400">Mapped Ticker Analysis:</span>
                <div className="flex flex-wrap gap-2">
                  {resolvedActiveArticle.symbols.map((sym) => (
                    <Link
                      key={sym}
                      href={`/ticker/${sym}`}
                      className="flex items-center gap-1.5 rounded-lg border border-[#d8ab5a]/35 bg-[#d8ab5a]/10 px-3 py-1.5 text-xs font-mono font-semibold text-[#f0c979] hover:bg-[#d8ab5a]/20 transition"
                    >
                      <span>Analyze ${sym}</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </Link>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/[0.07] pt-3 flex items-center justify-between text-xs font-mono text-stone-400">
                <a
                  href={resolvedActiveArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[#f0c979] hover:underline"
                >
                  <span>Primary Dispatch Source</span>
                  <ExternalLink className="h-3 w-3" />
                </a>

                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(resolvedActiveArticle.title + " " + resolvedActiveArticle.url);
                    setCopiedId(resolvedActiveArticle.id);
                    setTimeout(() => setCopiedId(null), 2000);
                  }}
                  className="flex items-center gap-1 text-stone-400 hover:text-[#f2efe8]"
                >
                  <Share2 className="h-3 w-3" />
                  <span>{copiedId === resolvedActiveArticle.id ? "Copied!" : "Share"}</span>
                </button>
              </div>
            </>
          ) : (
            <p className="text-xs text-stone-400">No active dispatch matches your filter. Reset filters or select another category.</p>
          )}
        </div>
      </div>

      {/* Footer Telemetry Strip */}
      <div className="border-t border-white/[0.07] pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-stone-400 gap-2">
        <div className="flex items-center gap-2">
          <Globe className="h-3.5 w-3.5 text-[#d8ab5a]" />
          <span>Real-Time News Wire Architecture // 10,000+ Institutional Feeds</span>
        </div>
        <div className="text-emerald-400/90">
          Lucene Query Indexing · Zero-Lag Ticker Mapping
        </div>
      </div>
    </div>
  );
}
