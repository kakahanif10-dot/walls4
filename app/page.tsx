import Link from "next/link";
import TickerTape from "@/components/ticker-tape";
import Sparkline from "@/components/sparkline";
import WhopBadge from "@/components/whop-badge";
import FastAlertBanner from "@/components/fast-alert-banner";
import BuyerReviews from "@/components/buyer-reviews";
import RulesVsFundamental from "@/components/rules-vs-fundamental";
import AnalystFaceBreakdown from "@/components/analyst-face-breakdown";
import { LivePrice, LiveChange } from "@/components/live-price";
import { ARTICLES, COURSES } from "@/lib/content";
import { marketPulse, rowsFor, stanceColor, ASSET_BY_SYMBOL, metricsFor, type Row } from "@/lib/market";
import { ensureMarketData } from "@/lib/market-data";
import { TrendingUp, BarChart3, Coins, Flame, ArrowRight, Terminal, Zap, FileText, Database, Cpu, Bot, Globe, Compass, Radio } from "lucide-react";

function BoardRow({ row }: { row: Row }) {
  return (
    <Link
      href={`/ticker/${row.symbol}`}
      className="group flex items-center justify-between gap-4 border-b border-line/60 py-3.5 last:border-0 hover:bg-ink-850/40 px-2 rounded-lg transition-colors"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="w-14 shrink-0 font-mono text-sm font-semibold text-bone group-hover:text-gold-bright">
          {row.symbol}
        </span>
        <span className="hidden truncate text-xs text-muted sm:block">{row.group}</span>
      </div>
      <div className="flex items-center gap-4">
        <Sparkline values={row.spark} width={70} height={22} className="hidden sm:block" />
        <span className="w-24 text-right">
          <LivePrice symbol={row.symbol} base={row.price} className="font-mono text-sm text-bone" />
        </span>
        <span className="w-16 text-right">
          <LiveChange symbol={row.symbol} change={row.change24h} className="font-mono text-xs" />
        </span>
        <span className={`hidden w-24 rounded-full border px-2 py-1 text-center text-[11px] sm:inline-block ${stanceColor(row.stance)}`}>
          {row.stance}
        </span>
      </div>
    </Link>
  );
}

export default async function HomePage() {
  await ensureMarketData();
  const pulse = marketPulse();
  const stockRows = rowsFor("stock").slice(0, 5);
  const cryptoRows = rowsFor("crypto").slice(0, 5);
  const memeRows = rowsFor("meme").slice(0, 5);
  const featuredArticles = ARTICLES.slice(0, 3);
  const courses = COURSES.slice(0, 4);

  // Focus asset for Quantitative Desk Breakdown
  const nvdaAsset = ASSET_BY_SYMBOL["NVDA"] || ASSET_BY_SYMBOL["BTC"];
  const nvdaMetrics = nvdaAsset ? metricsFor(nvdaAsset) : null;

  return (
    <div>
      {/* HERO SECTION */}
      <section className="grain relative overflow-hidden border-b border-line/60">
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
          <div className="rise">
            {/* Catchy Motto Badge */}
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-xs text-gold-bright font-medium">
              <span className="h-2 w-2 rounded-full bg-up animate-pulse" />
              <span>Engineered for Day Traders, Crypto Mavericks &amp; Wall Street Desks</span>
              <WhopBadge size="xs" />
            </div>

            <h1 className="mt-6 font-display text-[2.75rem] leading-[1.05] text-bone sm:text-6xl">
              Know which
              <br />
              <span className="text-gold-bright">trends are real.</span>
            </h1>

            <p className="mt-6 max-w-xl text-[15px] sm:text-base leading-relaxed text-muted">
              Sized around mathematical invalidation, not hope. NextWall Street runs continuous 5-factor quantitative scoring across 2,000+ assets with <strong>44 Specialized Analyst Desks</strong> spanning Wall Street Equities, Microstructure Day Trading, Crypto Liquidity, and Risk Architecture.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/pricing"
                className="rounded-full bg-gold px-7 py-3.5 text-sm font-bold text-ink-950 transition hover:bg-gold-bright shadow-lg hover:scale-105"
              >
                Start 14-Day Free Trial ($29/mo)
              </Link>
              <Link
                href="/chat"
                className="rounded-full border border-line bg-ink-900 px-6 py-3.5 text-sm font-medium text-bone transition hover:border-gold/40 hover:text-gold-bright flex items-center gap-2"
              >
                <span>Live Trading Floor</span>
                <span className="h-2 w-2 rounded-full bg-emerald-400" />
              </Link>
            </div>

            <div className="mt-5 flex items-center gap-4 text-xs text-muted/80">
              <span>✓ Live Telegram &amp; Discord Terminal Feeds</span>
              <span>•</span>
              <span>✓ Deterministic Quant Feeds (Zero Hallucinations)</span>
              <span>•</span>
              <span>✓ 44 Specialized Desks</span>
            </div>

            <dl className="mt-10 grid max-w-lg grid-cols-4 gap-4 border-t border-line/60 pt-7">
              {[
                { k: "2,000+", v: "Assets Tracked" },
                { k: "44", v: "Analyst Desks" },
                { k: "70", v: "Research Decks" },
                { k: "60", v: "Masterclasses" },
              ].map((item) => (
                <div key={item.v}>
                  <dt className="font-display text-2xl sm:text-3xl text-bone">{item.k}</dt>
                  <dd className="mt-0.5 text-[11px] text-muted">{item.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Market Pulse & WSJ-Grade Institutional Desk Composite */}
          <div className="rise rounded-2xl border border-line bg-ink-900/85 p-6 backdrop-blur space-y-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold flex items-center gap-1.5">
                  <BarChart3 className="h-3.5 w-3.5 text-gold" />
                  Wall Street Desk Composite
                </p>
                <p className="mt-1 text-xs text-muted">Composite of equity trend scores &amp; yield regimes</p>
              </div>
              <span className="rounded-full border border-up/40 bg-up/10 px-2.5 py-1 text-[11px] text-up font-semibold">
                {pulse.label}
              </span>
            </div>

            <div className="flex items-end gap-3">
              <span className="font-mono text-5xl text-bone font-bold">{pulse.score}</span>
              <span className="pb-2 text-xs text-muted font-mono">/ 100 STANCE COMPOSITE</span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-line">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold/60 via-gold to-up transition-all duration-500"
                style={{ width: `${pulse.score}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-line bg-ink-850 p-3.5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted">Market Breadth</p>
                <p className="mt-1 font-mono text-xl text-bone">{pulse.breadth}%</p>
                <p className="text-[10px] text-muted/70">Names scoring 60+ (Above 50-SMA)</p>
              </div>
              <div className="rounded-xl border border-line bg-ink-850 p-3.5">
                <p className="text-[10px] uppercase tracking-[0.14em] text-muted flex items-center justify-between">
                  <span>Risk Regime</span>
                  <WhopBadge size="xs" />
                </p>
                <p className="mt-1 font-mono text-xl text-gold-bright">Elevated</p>
                <p className="text-[10px] text-muted/70">Size down, not out (Volatility scaled)</p>
              </div>
            </div>

            <div className="border-t border-line/60 pt-4">
              <Link
                href="/research"
                className="group flex items-start gap-3"
              >
                <span className="mt-0.5 rounded bg-gold/15 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-gold shrink-0">
                  DESK MEMO
                </span>
                <span className="text-xs sm:text-sm leading-snug text-bone/90 group-hover:text-gold-bright transition">
                  Wall Street Morning Memo: How second-derivative semiconductor capex dictates modern momentum.
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* TICKER TAPE */}
      <TickerTape rows={rowsFor().slice(0, 18)} />

      {/* INSTITUTIONAL TERMINALS & ACTION FEEDS */}
      <section className="mx-auto max-w-7xl px-5 pt-12 pb-4">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {/* 1. Live News Stream & Query Wire */}
          <Link
            href="/realtime-news"
            className="group relative overflow-hidden rounded-2xl border border-[#d8ab5a]/25 bg-gradient-to-br from-[#0e1218] via-[#090b10] to-[#050609] p-5 shadow-[0_14px_34px_rgba(0,0,0,0.45)] transition-all duration-300 hover:border-[#d8ab5a]/70 hover:shadow-[0_0_36px_rgba(216,171,90,0.18)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-400/25 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-emerald-300 uppercase tracking-[0.12em]">
                  <Radio className="h-3 w-3 text-emerald-400 animate-pulse" />
                  LIVE NEWS WIRE
                </span>
                <span className="text-[11px] font-mono font-semibold text-[#f0c979]">10,000+ FEEDS</span>
              </div>
              <h3 className="mt-4 font-display text-lg font-medium text-[#f2efe8] group-hover:text-[#f0c979] transition">
                Live News Stream &amp; Query Wire
              </h3>
              <p className="mt-2 text-xs text-stone-400 font-sans leading-relaxed">
                Sub-second multi-source market news stream across Reuters, WSJ, Market Analysis &amp; SEC EDGAR mapped directly to ticker symbols with Lucene query filtering.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-3 text-xs font-mono text-[#d8ab5a]">
              <span>Open News Wire →</span>
              <span className="text-emerald-400 font-semibold">Live Socket</span>
            </div>
          </Link>

          {/* 2. Cross-Asset Vector RAG & Liquidity Radar */}
          <Link
            href="/oraclex"
            className="group relative overflow-hidden rounded-2xl border border-[#d8ab5a]/25 bg-gradient-to-br from-[#0e1218] via-[#090b10] to-[#050609] p-5 shadow-[0_14px_34px_rgba(0,0,0,0.45)] transition-all duration-300 hover:border-[#d8ab5a]/70 hover:shadow-[0_0_36px_rgba(216,171,90,0.18)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-[#d8ab5a]/10 border border-[#d8ab5a]/30 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-[#f0c979] uppercase tracking-[0.12em]">
                  <Compass className="h-3 w-3 text-[#d8ab5a]" />
                  VECTOR RAG
                </span>
                <span className="whitespace-nowrap text-[11px] font-mono font-semibold text-sky-300">SEMANTIC STORE</span>
              </div>
              <h3 className="mt-4 font-display text-lg font-medium text-[#f2efe8] group-hover:text-[#f0c979] transition">
                Cross-Asset Vector RAG &amp; Liquidity Radar
              </h3>
              <p className="mt-2 text-xs text-stone-400 font-sans leading-relaxed">
                Vector memory RAG indexing SEC filings and FOMC transcripts, 24h Advance/Decline internals, standing leverage liquidity ladder &amp; Borsa İstanbul board.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-3 text-xs font-mono text-[#d8ab5a]">
              <span>Launch Vector Radar →</span>
              <span className="text-sky-300 font-semibold">Semantic Sync</span>
            </div>
          </Link>

          {/* 3. 516-Panel Macro & Perpetuals Workstation */}
          <Link
            href="/neuberg"
            className="group relative overflow-hidden rounded-2xl border border-[#d8ab5a]/25 bg-gradient-to-br from-[#12100d] via-[#090b10] to-[#050609] p-5 shadow-[0_14px_34px_rgba(0,0,0,0.45)] transition-all duration-300 hover:border-[#d8ab5a]/70 hover:shadow-[0_0_36px_rgba(216,171,90,0.18)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#d8ab5a]/10 border border-[#d8ab5a]/30 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-[#f0c979] uppercase tracking-[0.12em]">
                  <Terminal className="h-3 w-3 text-[#d8ab5a]" />
                  MACRO WORKSTATION
                </span>
                <span className="text-[11px] font-mono font-semibold text-emerald-400">516 PANELS</span>
              </div>
              <h3 className="mt-4 font-display text-lg font-medium text-[#f2efe8] group-hover:text-[#f0c979] transition">
                516-Panel Macro &amp; Perpetuals Workstation
              </h3>
              <p className="mt-2 text-xs text-stone-400 font-sans leading-relaxed">
                Modular 516-panel cockpit with Fear &amp; Greed composite dial, Macro Regime Quadrants, 24/7 equity &amp; crypto perpetuals, and live event prediction books.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-3 text-xs font-mono text-[#d8ab5a]">
              <span>Open Macro Desk →</span>
              <span className="text-emerald-400 font-semibold">Perps &amp; Macro</span>
            </div>
          </Link>

          {/* 4. Global Markets & Sentiment Hub */}
          <Link
            href="/openstock"
            className="group relative overflow-hidden rounded-2xl border border-[#d8ab5a]/25 bg-gradient-to-br from-[#0c1311] via-[#090b10] to-[#050609] p-5 shadow-[0_14px_34px_rgba(0,0,0,0.45)] transition-all duration-300 hover:border-[#d8ab5a]/70 hover:shadow-[0_0_36px_rgba(216,171,90,0.18)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-500/10 border border-emerald-400/25 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-emerald-300 uppercase tracking-[0.12em]">
                  <Globe className="h-3 w-3 text-emerald-400" />
                  GLOBAL EXCHANGES
                </span>
                <span className="text-[11px] font-mono font-semibold text-[#f0c979]">9 REGIONS</span>
              </div>
              <h3 className="mt-4 font-display text-lg font-medium text-[#f2efe8] group-hover:text-[#f0c979] transition">
                Global Markets &amp; Sentiment Hub
              </h3>
              <p className="mt-2 text-xs text-stone-400 font-sans leading-relaxed">
                Track 9 international exchange hubs, multi-tab ticker charts with SMA overlays, social crowd sentiment radar, sector rotation heatmap &amp; custom price triggers.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-3 text-xs font-mono text-[#d8ab5a]">
              <span>Explore 9 Hubs →</span>
              <span className="text-emerald-400 font-semibold">Live Sessions</span>
            </div>
          </Link>

          {/* 5. AI Allocator Agents, DCF & Options Greeks */}
          <Link
            href="/fincept"
            className="group relative overflow-hidden rounded-2xl border border-[#d8ab5a]/25 bg-gradient-to-br from-[#13100a] via-[#090b10] to-[#050609] p-5 shadow-[0_14px_34px_rgba(0,0,0,0.45)] transition-all duration-300 hover:border-[#d8ab5a]/70 hover:shadow-[0_0_36px_rgba(216,171,90,0.18)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#d8ab5a]/10 border border-[#d8ab5a]/30 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-[#f0c979] uppercase tracking-[0.12em]">
                  <Cpu className="h-3 w-3 text-[#d8ab5a]" />
                  VALUATION &amp; AGENTS
                </span>
                <span className="text-[11px] font-mono font-semibold text-[#f0c979]">37 MODELS</span>
              </div>
              <h3 className="mt-4 font-display text-lg font-medium text-[#f2efe8] group-hover:text-[#f0c979] transition">
                AI Allocator Agents, DCF &amp; Options Greeks
              </h3>
              <p className="mt-2 text-xs text-stone-400 font-sans leading-relaxed">
                37 capital allocator frameworks, Gordon Growth DCF intrinsic modeling, Black-Scholes Greeks, 100+ macro connectors, paper execution &amp; strategy node graph.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-3 text-xs font-mono text-[#d8ab5a]">
              <span>Launch Quant Suite →</span>
              <span className="text-[#f0c979] font-semibold">DCF &amp; Greeks</span>
            </div>
          </Link>

          {/* 6. Dual-Screen Charting & Order Desk */}
          <Link
            href="/terminal"
            className="group relative overflow-hidden rounded-2xl border border-[#d8ab5a]/25 bg-gradient-to-br from-[#101116] via-[#090b10] to-[#050609] p-5 shadow-[0_14px_34px_rgba(0,0,0,0.45)] transition-all duration-300 hover:border-[#d8ab5a]/70 hover:shadow-[0_0_36px_rgba(216,171,90,0.18)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[#d8ab5a]/10 border border-[#d8ab5a]/30 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-[#f0c979] uppercase tracking-[0.12em]">
                  <Terminal className="h-3 w-3 text-[#d8ab5a]" />
                  PRO ORDER DESK
                </span>
                <span className="text-[11px] font-mono font-semibold text-emerald-400">&lt;GO&gt;</span>
              </div>
              <h3 className="mt-4 font-display text-lg font-medium text-[#f2efe8] group-hover:text-[#f0c979] transition">
                Dual-Screen Charting &amp; Order Desk
              </h3>
              <p className="mt-2 text-xs text-stone-400 font-sans leading-relaxed">
                Dual-monitor execution console with intraday area/candle charts, interactive shortcut keyboard deck, Level 2 depth ladder, Time &amp; Sales tape &amp; global matrix.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-3 text-xs font-mono text-[#d8ab5a]">
              <span>Launch Pro Desk →</span>
              <span className="text-[#f0c979] font-semibold">Level 2 DOM</span>
            </div>
          </Link>

          {/* 7. Quantitative Risk, VaR & Portfolio CLI */}
          <Link
            href="/openbb"
            className="group relative overflow-hidden rounded-2xl border border-[#d8ab5a]/25 bg-gradient-to-br from-[#0c1118] via-[#090b10] to-[#050609] p-5 shadow-[0_14px_34px_rgba(0,0,0,0.45)] transition-all duration-300 hover:border-[#d8ab5a]/70 hover:shadow-[0_0_36px_rgba(216,171,90,0.18)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-md bg-sky-500/10 border border-sky-400/25 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-sky-300 uppercase tracking-[0.12em]">
                  <Database className="h-3 w-3 text-sky-400" />
                  QUANT RISK CLI
                </span>
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h3 className="mt-4 font-display text-lg font-medium text-[#f2efe8] group-hover:text-[#f0c979] transition">
                Quantitative Risk, VaR &amp; Portfolio CLI
              </h3>
              <p className="mt-2 text-xs text-stone-400 font-sans leading-relaxed">
                High-speed command-line workstation for Parametric &amp; Monte Carlo VaR, US Treasury yield curves, Markowitz Efficient Frontier &amp; FINRA dark pool flow.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-white/[0.07] pt-3 text-xs font-mono text-[#d8ab5a]">
              <span>Open Quant CLI →</span>
              <span className="text-sky-300 font-semibold">VaR &amp; Frontier</span>
            </div>
          </Link>

          {/* 3. News Action */}
          <Link
            href="/gold-news"
            className="group relative overflow-hidden rounded-2xl border-2 border-amber-500/40 bg-gradient-to-br from-amber-950/20 via-ink-900 to-ink-950 p-5 transition-all duration-300 hover:border-amber-400 hover:shadow-[0_0_35px_rgba(216,171,90,0.2)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/40 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 uppercase tracking-wider">
                  <Zap className="h-3 w-3 text-amber-400" />
                  100 BULLETINS
                </span>
                <span className="flex h-2 w-2 rounded-full bg-amber-400 animate-ping" />
              </div>
              <h3 className="mt-4 font-display text-lg text-bone group-hover:text-gold-bright transition">
                News Action
              </h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                100 breaking dossiers updated minute-by-minute across geopolitics, executive investigations, and central bank repos with direct BUY, HOLD, and TRIM trade directives.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-line/60 pt-3 text-xs text-gold font-medium">
              <span>100 Catalysts →</span>
              <span className="font-mono text-emerald-400">Minute Sync</span>
            </div>
          </Link>

          {/* 4. Market Center */}
          <Link
            href="/wsj"
            className="group relative overflow-hidden rounded-2xl border-2 border-stone-800 bg-stone-950/90 p-5 transition-all duration-300 hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.15)] flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-serif font-black tracking-widest text-[9px] uppercase px-2 py-0.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded">
                  INTELLIGENCE
                </span>
                <span className="text-[10px] text-stone-400 font-mono">MARKET DATA</span>
              </div>
              <h3 className="mt-4 font-serif text-lg text-stone-100 group-hover:text-amber-400 transition">
                Market Center
              </h3>
              <p className="mt-2 text-xs text-stone-400 font-serif leading-relaxed">
                Most Active by Volume, SEC Form 4 insider transaction ledger, S&amp;P 500 / Nasdaq sector heatmaps, and exclusive institutional executive columns.
              </p>
            </div>
            <div className="mt-6 flex items-center justify-between border-t border-stone-800 pt-3 text-xs text-amber-400 font-serif">
              <span>Market Center →</span>
              <span className="text-stone-400 text-[11px] font-mono">SEC Form 4</span>
            </div>
          </Link>
        </div>
      </section>

      {/* 44 ANALYST DESKS SHOWCASE */}
      <section className="mx-auto max-w-7xl px-5 py-16">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-line/60 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                44 Specialized Quantitative Desks
              </span>
              <WhopBadge size="xs" />
            </div>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl text-bone">
              Institutional Cross-Asset Desks.
            </h2>
            <p className="mt-2 text-sm text-muted max-w-2xl">
              Dedicated institutional coverage across four major asset classes: Wall Street large-cap equities, intraday day trading, macro yield regimes, on-chain crypto liquidity, and risk-capped speculative assets.
            </p>
          </div>
          <Link
            href="/desks"
            className="rounded-full border border-gold/40 bg-gold/10 px-4 py-2 text-xs font-bold text-gold-bright hover:bg-gold/20 transition flex items-center gap-1.5 shrink-0"
          >
            <span>Explore All 44 Desks</span>
            <span>→</span>
          </Link>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {/* Desk 1: Wall Street Desk */}
          <div className="rounded-2xl border border-line bg-ink-900/60 p-6 flex flex-col justify-between hover:border-gold/50 transition-all shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15 text-gold-bright">
                  <BarChart3 className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono font-bold text-muted uppercase">S&amp;P 500 / Nasdaq</span>
              </div>
              <h3 className="mt-4 font-display text-xl text-bone">Wall Street Desk</h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Tracks 800+ large-cap equities, AI compute sector rotations, earnings revisions, and institutional dark pool block accumulation.
              </p>
              <div className="mt-4 space-y-1.5 text-[11px] text-bone/80 font-mono">
                <p>• Lead Analyst: Daniel Okafor, CFA</p>
                <p>• 30 Dedicated Research Decks</p>
                <p>• Horizon: 3–12 Week Swing</p>
              </div>
            </div>
            <Link
              href="/markets"
              className="mt-6 flex items-center justify-between border-t border-line/60 pt-3 text-xs font-semibold text-gold-bright hover:text-gold"
            >
              <span>View Equity Coverage</span>
              <span>→</span>
            </Link>
          </div>

          {/* Desk 2: Day Trader Desk (PRO) */}
          <div className="rounded-2xl border border-gold/40 bg-gold/[0.04] p-6 flex flex-col justify-between hover:border-gold transition-all shadow-md relative overflow-hidden">
            <div className="absolute top-3 right-3">
              <WhopBadge size="xs" />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/20 text-gold-bright">
                  <TrendingUp className="h-5 w-5" />
                </div>
              </div>
              <h3 className="mt-4 font-display text-xl text-bone flex items-center gap-2">
                <span>Day Trader Desk</span>
              </h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Level-to-level momentum, 5-minute Opening Range Breakout (ORB) models, and volatility-normalized position sizing engines.
              </p>
              <div className="mt-4 space-y-1.5 text-[11px] text-bone/80 font-mono">
                <p>• Lead: Sarah Vance, CFA</p>
                <p>• Definitive Invalidation Anchors</p>
                <p>• Sub-second Terminal Push Alerts</p>
              </div>
            </div>
            <Link
              href="/calculator"
              className="mt-6 flex items-center justify-between border-t border-gold/30 pt-3 text-xs font-bold text-gold-bright hover:text-gold"
            >
              <span>Access Invalidation Sizing</span>
              <span>→</span>
            </Link>
          </div>

          {/* Desk 3: Crypto Desk */}
          <div className="rounded-2xl border border-line bg-ink-900/60 p-6 flex flex-col justify-between hover:border-gold/50 transition-all shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/15 text-sky-400">
                  <Coins className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono font-bold text-muted uppercase">Binance / Coinbase</span>
              </div>
              <h3 className="mt-4 font-display text-xl text-bone">Crypto Desk</h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                830+ digital assets graded on float, stablecoin issuance velocity, perpetual futures funding skew, and global M2 expansion.
              </p>
              <div className="mt-4 space-y-1.5 text-[11px] text-bone/80 font-mono">
                <p>• Lead: Elena Rostova</p>
                <p>• 22 Crypto Research Decks</p>
                <p>• Real-time WebSocket Price Feeds</p>
              </div>
            </div>
            <Link
              href="/crypto"
              className="mt-6 flex items-center justify-between border-t border-line/60 pt-3 text-xs font-semibold text-gold-bright hover:text-gold"
            >
              <span>View Digital Asset Board</span>
              <span>→</span>
            </Link>
          </div>

          {/* Desk 4: Meme Coin Desk */}
          <div className="rounded-2xl border border-line bg-ink-900/60 p-6 flex flex-col justify-between hover:border-gold/50 transition-all shadow-sm">
            <div>
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/15 text-rose-400">
                  <Flame className="h-5 w-5" />
                </div>
                <span className="text-[10px] font-mono font-bold text-muted uppercase">pump.fun / Solana</span>
              </div>
              <h3 className="mt-4 font-display text-xl text-bone">Meme Coin Desk</h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Graded strictly as high-volatility attention instruments, not investments. Protected by developer wallet audits and a hard 2% risk cap.
              </p>
              <div className="mt-4 space-y-1.5 text-[11px] text-bone/80 font-mono">
                <p>• Lead: Marcus Thorne</p>
                <p>• 18 pump.fun Alpha Decks</p>
                <p>• 4-Hour Attention Half-Life Filter</p>
              </div>
            </div>
            <Link
              href="/meme-coins"
              className="mt-6 flex items-center justify-between border-t border-line/60 pt-3 text-xs font-semibold text-gold-bright hover:text-gold"
            >
              <span>View Speculative Risk Board</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* LEAD QUANTITATIVE BREAKDOWN WIDGET */}
      {nvdaMetrics && (
        <section className="mx-auto max-w-7xl px-5 py-8">
          <AnalystFaceBreakdown
            symbol={nvdaAsset.symbol}
            name={nvdaAsset.name}
            lastPrice={nvdaMetrics.last}
            score={nvdaMetrics.score}
            stance={nvdaMetrics.stance}
            invalidationLevel={Math.min(nvdaMetrics.sma20, nvdaMetrics.sma50) * 0.975}
            supportLevel={nvdaMetrics.sma50}
            resistanceLevel={nvdaMetrics.high52}
            sma20={nvdaMetrics.sma20}
            sma50={nvdaMetrics.sma50}
            sma200={nvdaMetrics.sma200}
            rsi={nvdaMetrics.rsi}
            volatility60d={nvdaMetrics.vol}
            validReason="NVDA momentum structure remains intact with price holding comfortably above the 20-day and 50-day moving average confluence. Hyperscaler datacenter accelerator backlogs continue to outstrip merchant supply, sustaining a top-decile quantitative composite score above 78."
            invalidationReason={`My quantitative thesis is objectively invalidated if NVDA closes below $${(Math.min(nvdaMetrics.sma20, nvdaMetrics.sma50) * 0.975).toFixed(2)}. At that level, the second-derivative momentum cycle ends, triggering an immediate disciplined cut.`}
          />
        </section>
      )}

      {/* RULES-BASED MOMENTUM VS FUNDAMENTAL RATIO (SIMPLY WALL ST CONTRAST) */}
      <RulesVsFundamental />

      {/* LIVE MARKET BOARDS BY DESK */}
      <section className="mx-auto max-w-7xl px-5 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Wall Street Large Cap Leaders */}
          <div className="rounded-2xl border border-line bg-ink-900/60 p-6">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <h3 className="font-display text-xl text-bone flex items-center gap-2">
                <span>Wall Street Equity Leaders</span>
              </h3>
              <Link href="/markets" className="text-xs text-gold hover:text-gold-bright font-medium">
                View 800+ Equities →
              </Link>
            </div>
            <div className="mt-3 divide-y divide-line/40">
              {stockRows.map((r) => (
                <BoardRow key={r.symbol} row={r} />
              ))}
            </div>
          </div>

          {/* Crypto & Speculative Highlights */}
          <div className="rounded-2xl border border-line bg-ink-900/60 p-6">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <h3 className="font-display text-xl text-bone flex items-center gap-2">
                <span>Crypto &amp; Flow Breakouts</span>
                <WhopBadge size="xs" />
              </h3>
              <Link href="/crypto" className="text-xs text-gold hover:text-gold-bright font-medium">
                View 1,200+ Assets →
              </Link>
            </div>
            <div className="mt-3 divide-y divide-line/40">
              {[...cryptoRows.slice(0, 3), ...memeRows.slice(0, 2)].map((r) => (
                <BoardRow key={r.symbol} row={r} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* VERIFIED BUYER & TRADER REVIEWS */}
      <BuyerReviews />

      {/* VIP FAST ALERT CHANNEL */}
      <section className="mx-auto max-w-7xl px-5 py-10">
        <FastAlertBanner />
      </section>

      {/* 70 RESEARCH DECKS & 60 MASTERCLASSES PRO SECTION */}
      <section className="mx-auto max-w-7xl px-5 py-16 border-t border-line/60">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-line/60 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">
                Institutional Library
              </span>
              <WhopBadge size="xs" />
            </div>
            <h2 className="mt-2 font-display text-3xl sm:text-4xl text-bone">
              70 Research Decks &amp; 60 Video Masterclasses.
            </h2>
            <p className="mt-2 text-sm text-muted max-w-xl">
              Cataloged across three core disciplines: Wall Street Equities, Crypto &amp; Layer-1/2 Flows, and Meme Coin Risk Architecture.
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/research"
              className="rounded-full border border-line bg-ink-900 px-4 py-2 text-xs font-semibold text-bone hover:border-gold/50"
            >
              All 70 Decks →
            </Link>
            <Link
              href="/academy/watch"
              className="rounded-full bg-gold px-4 py-2 text-xs font-bold text-ink-950 hover:bg-gold-bright"
            >
              Watch 60 Videos ▶
            </Link>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {/* Card 1: 30 Wall Street Decks */}
          <div className="rounded-xl border border-line bg-ink-900/50 p-6 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gold">30 Decks</span>
              <h3 className="mt-2 font-display text-xl text-bone">Wall Street &amp; Day Trading</h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Second-derivative AI capex cycles, breadth divergence signals, 09:15 EST pre-market volume gaps, options dealer gamma flips, and 60-day realized volatility budgeting.
              </p>
            </div>
            <Link href="/research" className="mt-6 text-xs text-gold-bright font-semibold hover:underline">
              Explore Equity Decks →
            </Link>
          </div>

          {/* Card 2: 22 Crypto Decks */}
          <div className="rounded-xl border border-line bg-ink-900/50 p-6 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">22 Decks</span>
              <h3 className="mt-2 font-display text-xl text-bone">Crypto &amp; Layer-1/2 Flows</h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Spot ETF inflow velocity, stablecoin net issuance, perpetual funding rate extremes, blob space fee economics, and on-chain whale accumulation clusters.
              </p>
            </div>
            <Link href="/research" className="mt-6 text-xs text-gold-bright font-semibold hover:underline">
              Explore Crypto Decks →
            </Link>
          </div>

          {/* Card 3: 18 Meme Coin Decks */}
          <div className="rounded-xl border border-line bg-ink-900/50 p-6 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400">18 Decks</span>
              <h3 className="mt-2 font-display text-xl text-bone">Meme Coins &amp; pump.fun</h3>
              <p className="mt-2 text-xs text-muted leading-relaxed">
                Bonding curve migration mathematics, developer bundle detection, social virality decay half-lives, and immutable LP lock contract auditing.
              </p>
            </div>
            <Link href="/research" className="mt-6 text-xs text-gold-bright font-semibold hover:underline">
              Explore Meme Decks →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
