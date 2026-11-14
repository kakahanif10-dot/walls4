"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef, type MouseEvent } from "react";
import LiveClock from "@/components/live-clock";
import FeedBadge from "@/components/feed-badge";
import AuthButton from "@/components/auth-button";
import GlobalSearchModal from "@/components/global-search";
import { useWhop } from "@/lib/whop-context";
import {
  Menu,
  Search,
  X,
  Radio,
  Compass,
  Terminal,
  Globe,
  Cpu,
  Database,
  Zap,
  FileText,
  BarChart3,
  TrendingUp,
  Coins,
  Flame,
  Bookmark,
  ExternalLink,
  Activity,
  BrainCircuit,
  ShieldCheck,
  Calculator,
  Monitor,
  Table2,
  Building2,
  FileSearch,
  LineChart,
  ShieldAlert,
  BookOpen,
  Radar,
  Layers,
  Scale,
  Gauge,
} from "lucide-react";

const SIMPLE_LINKS: Array<{ href: string; label: string; live?: boolean }> = [
  { href: "/markets", label: "Markets" },
  { href: "/crypto", label: "Digital Assets" },
  { href: "/research", label: "Research" },
  { href: "/academy", label: "Academy" },
  { href: "/community", label: "Community" },
];

export interface MainDirectoryItem {
  href: string;
  label: string;
  desc: string;
  icon: typeof Radio;
  live?: boolean;
}

export const ALL_MAIN_ITEMS: MainDirectoryItem[] = [
  {
    href: "/news-wire",
    label: "News Wire",
    desc: "Real-time multi-source news wire & ticker query stream",
    icon: Radio,
    live: true,
  },
  {
    href: "/vector-rag",
    label: "Vector RAG",
    desc: "Cross-asset semantic store, internals & liquidity ladder",
    icon: Compass,
  },
  {
    href: "/macro-perps",
    label: "Macro & Perps",
    desc: "516-panel macro regime, Fear & Greed & 24/7 perpetuals",
    icon: Terminal,
  },
  {
    href: "/nws-ai",
    label: "NWS AI",
    desc: "Titan 4.0 reasoning, 24kHz voice & search grounding terminal",
    icon: BrainCircuit,
    live: true,
  },
  {
    href: "/global-markets",
    label: "Global Markets & Map",
    desc: "Google Maps 11 global exchanges, multi-tab charts & radar",
    icon: Globe,
  },
  {
    href: "/dcf-agents",
    label: "DCF & Agents",
    desc: "37 capital allocator models, DCF valuation & options Greeks",
    icon: Cpu,
  },
  {
    href: "/pro-terminal",
    label: "Pro Terminal",
    desc: "Dual-screen charting, Level 2 depth & execution desk",
    icon: Terminal,
  },
  {
    href: "/var-cli",
    label: "VaR & CLI",
    desc: "Parametric & Monte Carlo VaR, yield curves & portfolio CLI",
    icon: Database,
  },
  {
    href: "/news",
    label: "News",
    desc: "100 live breaking action bulletins & trade directives",
    icon: Zap,
    live: true,
  },
  {
    href: "/market-center",
    label: "Market Center",
    desc: "Most active volume, Form 4 insiders & sector analysis",
    icon: FileText,
  },
  {
    href: "/markets",
    label: "Wall Street Desk",
    desc: "Large-cap US equities & institutional flow coverage",
    icon: BarChart3,
  },
  {
    href: "/calculator",
    label: "Day Trader Desk",
    desc: "Intraday invalidation levels & volatility position sizing",
    icon: TrendingUp,
  },
  {
    href: "/crypto",
    label: "Digital Assets Desk",
    desc: "Core BTC/ETH flows, perpetual funding & on-chain float",
    icon: Coins,
  },
  {
    href: "/crypto?tab=speculative",
    label: "Speculative Risk Desk",
    desc: "High-beta digital tokens & liquidity depth risk caps",
    icon: Flame,
  },
  {
    href: "/execution-terminal",
    label: "Trade Execution & Risk",
    desc: "Invalidation position sizer, 40/35/25 score simulator & audit log",
    icon: ShieldCheck,
  },
  {
    href: "/precision-calculator",
    label: "Precision Quant Calculator",
    desc: "Live free-API ATR sizing, Kelly Criterion, DCA ladder & FX",
    icon: Calculator,
    live: true,
  },
  {
    href: "/tools/bloomberg-desk",
    label: "Bloomberg Terminal Desk",
    desc: "Live equities, US Treasury yields, ECB FX & SEC EDGAR wire",
    icon: Monitor,
    live: true,
  },
  {
    href: "/tools/excel-dcf",
    label: "Excel DCF & Comps Model",
    desc: "5Y DCF workbook, CAPM WACC, 5x5 sensitivity & CSV export",
    icon: Table2,
  },
  {
    href: "/tools/capital-iq",
    label: "Capital IQ & FactSet Comps",
    desc: "SEC XBRL GAAP financials & peer EV/EBITDA, EV/Rev, P/E comps",
    icon: Building2,
    live: true,
  },
  {
    href: "/tools/alphasense",
    label: "AlphaSense Filings & Search",
    desc: "Live SEC EDGAR 10-K, 10-Q, 8-K & Form 4 institutional search",
    icon: FileSearch,
    live: true,
  },
  {
    href: "/tools/tradingview-screener",
    label: "TradingView Multi-Asset",
    desc: "Live OHLCV candlesticks, RSI-14, MACD, SMA-20/50 & screener",
    icon: LineChart,
    live: true,
  },
  {
    href: "/tools/glassnode-onchain",
    label: "Glassnode & CryptoQuant",
    desc: "Live Bitcoin mempool, sat/vB fees, hashrate & perp funding",
    icon: Activity,
    live: true,
  },
  {
    href: "/tools/chainalysis-aml",
    label: "Chainalysis & TRM Forensics",
    desc: "Live BTC/ETH wallet inspection, UTXO trace & AML risk scoring",
    icon: ShieldAlert,
    live: true,
  },
  {
    href: "/tools/messari-research",
    label: "Messari & Blockworks Intel",
    desc: "Token supply FDV float schedules & Snapshot DAO governance",
    icon: BookOpen,
    live: true,
  },
  {
    href: "/tools/nansen-arkham",
    label: "Nansen & Arkham Smart Money",
    desc: "Live ETH block whale transfers, block trades & stablecoin flows",
    icon: Radar,
    live: true,
  },
  {
    href: "/tools/defillama-terminal",
    label: "DeFiLlama & Token Terminal",
    desc: "Live TVL rankings, protocol 24h/30d fees & P/F ratio comps",
    icon: Layers,
    live: true,
  },
  {
    href: "/tools/coinmetrics-kaiko",
    label: "Coin Metrics & Kaiko Feeds",
    desc: "Normalized Binance, Coinbase & Kraken L2 books & slippage",
    icon: Scale,
    live: true,
  },
  {
    href: "/tools/crypto-fear-greed",
    label: "Crypto Fear & Greed",
    desc: "Real-time 0–100 sentiment gauge, regime extremes & BTC/ETH context",
    icon: Gauge,
    live: true,
  },
  {
    href: "/desks",
    label: "Quantitative Desks",
    desc: "Complete institutional quantitative research directory",
    icon: Cpu,
  },
  {
    href: "/tools/whale-alert",
    label: "Live Whale Movement Feed",
    desc: "Real-time ETH block whale alerts, spot blocks & stablecoin flows",
    icon: Radar,
    live: true,
  },
  {
    href: "/tools/ai-sentiment",
    label: "AI Market Sentiment",
    desc: "Real-time AI sentiment synthesis across Fear & Greed & equities breadth",
    icon: BrainCircuit,
    live: true,
  },
  {
    href: "/tools/top-signals",
    label: "Top 3 Signals Today",
    desc: "Daily highest-conviction scores with live price targets & stops",
    icon: TrendingUp,
    live: true,
  },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const { isUnlocked, openWhopModal } = useWhop();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const isActive = (href: string) =>
    pathname === href ||
    pathname.startsWith(`${href}/`) ||
    (href === "/crypto" && pathname === "/meme-coins");

  const handleLockedNav = (e: MouseEvent<HTMLAnchorElement>, label: string, href?: string) => {
    if (!isUnlocked) {
      e.preventDefault();
      e.stopPropagation();
      setDirectoryOpen(false);
      setMobileOpen(false);
      openWhopModal(label, href);
      return true;
    }
    setDirectoryOpen(false);
    setMobileOpen(false);
    return false;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDirectoryOpen(false);
        setMobileOpen(false);
      }
    };
    const handlePointerDown = (e: MouseEvent | globalThis.MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setDirectoryOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  return (
    <>
      <header ref={headerRef} className="sticky top-0 z-50 bg-ink-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5">
          {/* Editorial Brand */}
          <Link
            href="/"
            className="group flex shrink-0 items-baseline"
            onClick={() => {
              setMobileOpen(false);
              setDirectoryOpen(false);
            }}
          >
            <span className="font-display text-[1.35rem] tracking-tight text-bone">
              Next<span className="text-gold-bright">Wall</span>Street
            </span>
          </Link>

          {/* Primary Single-Row Navigation */}
          <nav className="hidden items-center gap-1 lg:flex">
            {SIMPLE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch={isUnlocked ? undefined : false}
                onClick={(e) => handleLockedNav(e, link.label, link.href)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] xl:text-sm whitespace-nowrap transition-colors ${
                  isActive(link.href)
                    ? "bg-ink-800 text-bone"
                    : "text-muted hover:bg-ink-850 hover:text-bone"
                }`}
              >
                {link.live && (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"
                    aria-hidden="true"
                  />
                )}
                <span>{link.label}</span>
              </Link>
            ))}

            {/* Trade Tools Popover Button & Floating Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDirectoryOpen((prev) => !prev)}
                aria-expanded={directoryOpen}
                aria-controls="trade-tools-directory-menu"
                aria-label={directoryOpen ? "Close Trade Tools directory" : "Open Trade Tools directory"}
                title="Trade Tools · Directory & Desks"
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] xl:text-sm whitespace-nowrap transition-colors ${
                  directoryOpen
                    ? "bg-gold/15 text-gold-bright"
                    : "text-muted hover:bg-ink-850 hover:text-bone"
                }`}
              >
                <span>Trade Tools</span>
                <span className="rounded-full bg-gold/15 px-1.5 py-0.2 font-mono text-[10px] text-gold-bright">
                  {ALL_MAIN_ITEMS.length}
                </span>
              </button>

              {/* Compact Elongated Popover Dropdown */}
              {directoryOpen && (
                <div
                  id="trade-tools-directory-menu"
                  role="menu"
                  aria-label="Trade Tools Directory"
                  className="absolute left-0 top-full mt-2.5 z-50 w-[390px] sm:w-[420px] rounded-2xl bg-[#0b0e16]/98 p-3.5 shadow-[0_24px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl animate-in fade-in zoom-in-95 duration-150"
                >
                  {/* Dropdown Header */}
                  <div className="flex items-center justify-between rounded-xl bg-ink-950/60 px-3 py-2.5">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gold-bright">
                          Desk &amp; Terminal Directory
                        </span>
                        <span className="rounded-full bg-gold/15 px-2 py-0.2 font-mono text-[10px] text-gold-bright font-semibold">
                          {ALL_MAIN_ITEMS.length} Modules
                        </span>
                      </div>
                      <p className="text-[11px] text-muted mt-0.5">
                        {isUnlocked
                          ? "Clicking an item opens in a new tab ↗"
                          : "Lifetime Premium ($1,487 USD) unlocks all 32 tools"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDirectoryOpen(false)}
                      className="rounded-lg p-1.5 text-muted hover:bg-ink-800 hover:text-bone transition-colors"
                      title="Close directory"
                      aria-label="Close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Elongated Clean Scrollable Single List (32 items) */}
                  <div className="mt-2.5 max-h-[62vh] sm:max-h-[520px] space-y-1 overflow-y-auto pr-1 overscroll-contain">
                    {ALL_MAIN_ITEMS.map((item, idx) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={`all-main-${idx}-${item.label}`}
                          href={item.href}
                          prefetch={isUnlocked ? undefined : false}
                          target={isUnlocked ? "_blank" : undefined}
                          rel={isUnlocked ? "noopener noreferrer" : undefined}
                          onClick={(e) =>
                            handleLockedNav(
                              e,
                              `Trade Tool #${String(idx + 1).padStart(2, "0")} · ${item.label}`,
                              item.href,
                            )
                          }
                          className={`group flex items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-xs transition-all ${
                            active
                              ? "bg-gold/15 text-gold-bright"
                              : "text-bone/90 hover:bg-ink-850 hover:text-gold-bright"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="w-5 shrink-0 font-mono text-[11px] font-semibold text-gold/75 tabular-nums">
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-ink-900 group-hover:bg-gold/10 transition-colors">
                              <Icon className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-bone group-hover:text-gold-bright text-[12.5px] truncate">
                                  {item.label}
                                </span>
                                {item.live && (
                                  <span className="inline-flex items-center gap-1 rounded bg-emerald-500/15 px-1.5 py-0.2 font-mono text-[9px] text-emerald-300">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    LIVE
                                  </span>
                                )}
                              </div>
                              <p className="truncate text-[10.5px] text-muted group-hover:text-muted/90">
                                {item.desc}
                              </p>
                            </div>
                          </div>
                          {isUnlocked && (
                            <div className="flex shrink-0 items-center gap-1">
                              <ExternalLink className="h-3 w-3 text-muted/50 group-hover:text-gold-bright transition-colors" />
                            </div>
                          )}
                        </Link>
                      );
                    })}
                  </div>

                  {/* Dropdown Footer Quick Links */}
                  <div className="mt-2.5 flex items-center justify-between rounded-xl bg-ink-950/60 px-3 py-2 text-[11px] text-muted">
                    <div className="flex items-center gap-3">
                      <Link
                        href="/pipeline"
                        prefetch={isUnlocked ? undefined : false}
                        target={isUnlocked ? "_blank" : undefined}
                        rel={isUnlocked ? "noopener noreferrer" : undefined}
                        onClick={(e) => handleLockedNav(e, "Live Market Pipeline", "/pipeline")}
                        className="hover:text-gold-bright flex items-center gap-1 transition-colors"
                      >
                        <Activity className="h-3 w-3 text-gold" />
                        <span>Pipeline</span>
                      </Link>
                      <Link
                        href="/watchlist"
                        prefetch={isUnlocked ? undefined : false}
                        target={isUnlocked ? "_blank" : undefined}
                        rel={isUnlocked ? "noopener noreferrer" : undefined}
                        onClick={(e) => handleLockedNav(e, "Watchlist", "/watchlist")}
                        className="hover:text-gold-bright flex items-center gap-1 transition-colors"
                      >
                        <Bookmark className="h-3 w-3 text-gold" />
                        <span>Watchlist</span>
                      </Link>
                    </div>
                    <Link
                      href="/pricing"
                      onClick={() => setDirectoryOpen(false)}
                      className="font-medium text-gold-bright hover:underline"
                    >
                      Get Lifetime Access →
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <Link
              href="/watchlist"
              prefetch={isUnlocked ? undefined : false}
              onClick={(e) => handleLockedNav(e, "Watchlist", "/watchlist")}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] xl:text-sm whitespace-nowrap transition-colors ${
                isActive("/watchlist")
                  ? "bg-ink-800 text-bone"
                  : "text-muted hover:bg-ink-850 hover:text-bone"
              }`}
            >
              <span>Watchlist</span>
            </Link>
            <a
              href="mailto:support@nextwallstreet.com"
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] xl:text-sm whitespace-nowrap text-muted transition-colors hover:bg-ink-850 hover:text-bone"
            >
              Customer Service
            </a>
          </nav>

          {/* Right Cluster */}
          <div className="hidden shrink-0 items-center gap-3 xl:gap-4 lg:flex">
            <div className="hidden items-center gap-2.5 xl:flex">
              <LiveClock compact />
            </div>

            <button
              type="button"
              onClick={() => {
                setDirectoryOpen(false);
                setSearchOpen(true);
              }}
              aria-label="Search assets, research, and analyst desks"
              title="Search (⌘K)"
              className="flex h-8 w-8 items-center justify-center rounded-full text-gold transition-colors hover:bg-ink-850 hover:text-gold-bright"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>

            <AuthButton />
            <Link
              href="/pricing"
              onClick={() => setDirectoryOpen(false)}
              className="rounded-full bg-gold px-4 py-1.5 text-[13px] xl:text-sm font-semibold whitespace-nowrap text-ink-950 transition-colors hover:bg-gold-bright"
            >
              Get Lifetime Access
            </Link>
          </div>

          {/* Mobile Actions: Search + Menu */}
          <div className="flex items-center gap-2 lg:hidden">
            <button
              type="button"
              aria-label="Search assets, research, and analyst desks"
              onClick={() => {
                setMobileOpen(false);
                setSearchOpen(true);
              }}
              className="flex h-9 w-9 items-center justify-center rounded-full text-gold transition-colors hover:bg-ink-850 hover:text-gold-bright"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-9 items-center gap-1.5 rounded-lg bg-ink-900 px-3 text-xs font-medium text-bone hover:bg-ink-850"
            >
              {mobileOpen ? (
                <X className="h-4 w-4 text-gold-bright" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4 text-gold-bright" aria-hidden="true" />
              )}
              <span>Menu</span>
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <nav className="max-h-[84vh] overflow-y-auto bg-ink-950/98 px-5 pb-6 pt-3 lg:hidden space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-ink-900/60 px-3.5 py-2.5">
              <LiveClock />
              <FeedBadge className="text-[10px] uppercase tracking-[0.14em] text-muted" />
            </div>

            {/* Standard Primary Navigation */}
            <div className="grid gap-1">
              {[...SIMPLE_LINKS, { href: "/watchlist", label: "Watchlist" }, { href: "mailto:support@nextwallstreet.com", label: "Customer Service" }].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={isUnlocked ? undefined : false}
                  onClick={(e) => link.href.startsWith("mailto:") ? setMobileOpen(false) : handleLockedNav(e, link.label, link.href)}
                  className={`flex items-center justify-between rounded-md px-3 py-2 text-sm ${
                    isActive(link.href) ? "bg-ink-800 text-bone" : "text-muted hover:text-bone"
                  }`}
                >
                  <span className="inline-flex items-center gap-2">
                    {"live" in link && link.live && (
                      <span
                        className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"
                        aria-hidden="true"
                      />
                    )}
                    <span>{link.label}</span>
                  </span>
                  {"live" in link && link.live && (
                    <span className="rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[9px] text-emerald-300">
                      LIVE CHAT
                    </span>
                  )}
                </Link>
              ))}
            </div>

            {/* Single Unified Trade Tools Directory (32 items) */}
            <div className="rounded-xl bg-ink-900/50 p-2.5 space-y-1">
              <div className="flex items-center justify-between px-2 pb-1.5">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-gold">
                  Directory · Trade Tools ({ALL_MAIN_ITEMS.length})
                </p>
                <span className="text-[10px] text-muted">
                  {isUnlocked ? "Opens in new tab ↗" : "$1,487 USD Lifetime"}
                </span>
              </div>
              {ALL_MAIN_ITEMS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={`m-main-${idx}-${item.label}`}
                    href={item.href}
                    prefetch={isUnlocked ? undefined : false}
                    target={isUnlocked ? "_blank" : undefined}
                    rel={isUnlocked ? "noopener noreferrer" : undefined}
                    onClick={(e) =>
                      handleLockedNav(
                        e,
                        `Trade Tool #${String(idx + 1).padStart(2, "0")} · ${item.label}`,
                        item.href,
                      )
                    }
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium ${
                      isActive(item.href) ? "bg-ink-800 text-gold-bright" : "text-bone/90 hover:bg-ink-900 hover:text-gold-bright"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="w-5 font-mono text-[10px] text-gold/75">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <Icon className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                      <span>{item.label}</span>
                      {item.live && (
                        <span className="rounded bg-emerald-500/20 px-1 py-0.2 text-[9px] text-emerald-300">
                          LIVE
                        </span>
                      )}
                    </span>
                    {isUnlocked && (
                      <ExternalLink className="h-3 w-3 text-muted/60" />
                    )}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center justify-between rounded-xl bg-ink-900/50 px-3.5 py-3">
              <AuthButton />
              <Link
                href="/pricing"
                onClick={() => setMobileOpen(false)}
                className="rounded-full bg-gold px-4 py-2 text-xs font-semibold text-ink-950"
              >
                Get Lifetime Access
              </Link>
            </div>
          </nav>
        )}
      </header>

      <GlobalSearchModal
        open={searchOpen}
        onOpen={() => setSearchOpen(true)}
        onClose={() => setSearchOpen(false)}
      />
    </>
  );
}
