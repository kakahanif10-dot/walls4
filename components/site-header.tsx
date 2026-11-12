"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import LiveClock from "@/components/live-clock";
import FeedBadge from "@/components/feed-badge";
import AuthButton from "@/components/auth-button";
import GlobalSearchModal from "@/components/global-search";
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
} from "lucide-react";

const SIMPLE_LINKS = [
  { href: "/markets", label: "Markets" },
  { href: "/crypto", label: "Crypto" },
  { href: "/meme-coins", label: "Meme coins" },
  { href: "/research", label: "Research" },
  { href: "/academy", label: "Academy" },
  { href: "/nws-ai", label: "Nws AI & Community" },
  { href: "/pricing", label: "Pricing" },
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
    label: "Crypto Desk",
    desc: "Spot ETF flows, perpetual funding & on-chain float",
    icon: Coins,
  },
  {
    href: "/meme-coins",
    label: "Meme Desk",
    desc: "High-volatility speculative assets with strict 2% caps",
    icon: Flame,
  },
  {
    href: "/desks",
    label: "All 44 Desks",
    desc: "Complete 44-desk quantitative research directory",
    icon: Cpu,
  },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [directoryOpen, setDirectoryOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDirectoryOpen(false);
        setMobileOpen(false);
      }
    };
    const handlePointerDown = (e: MouseEvent) => {
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
      <header ref={headerRef} className="sticky top-0 z-50 border-b border-line/70 bg-ink-950/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5">
          {/* Simple Editorial Brand */}
          <Link
            href="/"
            className="group flex shrink-0 items-baseline gap-2"
            onClick={() => {
              setMobileOpen(false);
              setDirectoryOpen(false);
            }}
          >
            <span className="font-display text-[1.35rem] tracking-tight text-bone">
              Next<span className="text-gold-bright">Wall</span>Street
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-muted 2xl:inline">
              Research
            </span>
          </Link>

          {/* Primary Navigation */}
          <nav className="hidden items-center gap-0.5 xl:gap-1 lg:flex">
            {SIMPLE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setDirectoryOpen(false)}
                className={`rounded-full px-2.5 xl:px-3 py-1.5 text-[13px] xl:text-sm whitespace-nowrap transition-colors ${
                  isActive(link.href)
                    ? "bg-ink-800 text-bone"
                    : "text-muted hover:bg-ink-850 hover:text-bone"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right Cluster */}
          <div className="hidden shrink-0 items-center gap-2.5 xl:gap-3 lg:flex">
            <div className="hidden items-center gap-2.5 xl:flex">
              <span className="h-4 w-px bg-line" />
              <LiveClock compact />
              <span className="h-4 w-px bg-line" />
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

            <Link
              href="/watchlist"
              onClick={() => setDirectoryOpen(false)}
              className="text-[13px] xl:text-sm text-muted whitespace-nowrap transition-colors hover:text-bone"
            >
              Watchlist
            </Link>

            <Link
              href="/pricing"
              onClick={() => setDirectoryOpen(false)}
              className="rounded-full border border-gold/50 bg-gold/10 px-3.5 py-1.5 text-[13px] xl:text-sm font-medium whitespace-nowrap text-gold-bright transition-colors hover:bg-gold/20"
            >
              Subscribe
            </Link>

            {/* Trade Tools Popover Button & Floating Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setDirectoryOpen((prev) => !prev)}
                aria-expanded={directoryOpen}
                aria-controls="trade-tools-directory-menu"
                aria-label={directoryOpen ? "Close Trade Tools directory" : "Open Trade Tools directory"}
                title="Trade Tools · Directory & Desks"
                className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] xl:text-sm font-medium whitespace-nowrap transition-all shadow-sm ${
                  directoryOpen
                    ? "border-gold bg-gold/20 text-gold-bright ring-1 ring-gold/40"
                    : "border-line bg-ink-900 text-bone hover:border-gold/50 hover:text-gold-bright"
                }`}
              >
                {directoryOpen ? (
                  <X className="h-4 w-4 text-gold-bright" aria-hidden="true" />
                ) : (
                  <Menu className="h-4 w-4 text-gold-bright" aria-hidden="true" />
                )}
                <span>Trade Tools</span>
                <span className="rounded-full bg-gold/20 px-1.5 py-0.2 font-mono text-[10px] text-gold-bright">
                  14
                </span>
              </button>

              {/* Compact Elongated Popover Dropdown (Not Full Page) */}
              {directoryOpen && (
                <div
                  id="trade-tools-directory-menu"
                  role="menu"
                  aria-label="Trade Tools Directory"
                  className="absolute right-0 top-full mt-2.5 z-50 w-[390px] sm:w-[420px] rounded-2xl border border-gold/35 bg-[#080a10]/98 p-3 shadow-[0_24px_60px_rgba(0,0,0,0.85)] backdrop-blur-2xl ring-1 ring-gold/20 animate-in fade-in zoom-in-95 duration-150"
                >
                  {/* Dropdown Header */}
                  <div className="flex items-center justify-between border-b border-line/60 pb-2.5 px-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-gold-bright">
                          Trade Tools Directory
                        </span>
                        <span className="rounded-full bg-gold/15 border border-gold/40 px-1.5 py-0.2 font-mono text-[10px] text-gold-bright font-semibold">
                          14 Desks
                        </span>
                      </div>
                      <p className="text-[11px] text-muted mt-0.5">
                        Clicking an item opens in a new tab <span className="text-gold">↗</span>
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

                  {/* Elongated Clean Scrollable Single List (14 items) */}
                  <div className="mt-2 max-h-[62vh] sm:max-h-[520px] space-y-1 overflow-y-auto pr-1 overscroll-contain">
                    {ALL_MAIN_ITEMS.map((item, idx) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <Link
                          key={`all-main-${idx}-${item.label}`}
                          href={item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setDirectoryOpen(false)}
                          className={`group flex items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-xs transition-all ${
                            active
                              ? "bg-gold/15 text-gold-bright border border-gold/40 shadow-inner"
                              : "text-bone/90 hover:bg-ink-850 hover:text-gold-bright border border-transparent hover:border-gold/25"
                          }`}
                        >
                          <div className="flex min-w-0 items-center gap-2.5">
                            <span className="w-5 shrink-0 font-mono text-[11px] font-semibold text-gold/75 tabular-nums">
                              {String(idx + 1).padStart(2, "0")}
                            </span>
                            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-line/70 bg-ink-900 group-hover:border-gold/40 group-hover:bg-gold/10 transition-colors">
                              <Icon className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <span className="font-medium text-bone group-hover:text-gold-bright text-[12.5px] truncate">
                                  {item.label}
                                </span>
                                {item.live && (
                                  <span className="inline-flex items-center gap-1 rounded border border-emerald-400/30 bg-emerald-500/10 px-1.5 py-0.2 font-mono text-[9px] text-emerald-300">
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
                          <div className="flex shrink-0 items-center gap-1">
                            <ExternalLink className="h-3 w-3 text-muted/50 group-hover:text-gold-bright transition-colors" />
                          </div>
                        </Link>
                      );
                    })}
                  </div>

                  {/* Dropdown Footer Quick Links */}
                  <div className="mt-2.5 flex items-center justify-between border-t border-line/60 pt-2 px-1 text-[11px] text-muted">
                    <div className="flex items-center gap-3">
                      <Link
                        href="/pipeline"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setDirectoryOpen(false)}
                        className="hover:text-gold-bright flex items-center gap-1 transition-colors"
                      >
                        <Activity className="h-3 w-3 text-gold" />
                        <span>Pipeline ↗</span>
                      </Link>
                      <Link
                        href="/watchlist"
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setDirectoryOpen(false)}
                        className="hover:text-gold-bright flex items-center gap-1 transition-colors"
                      >
                        <Bookmark className="h-3 w-3 text-gold" />
                        <span>Watchlist ↗</span>
                      </Link>
                    </div>
                    <Link
                      href="/pricing"
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={() => setDirectoryOpen(false)}
                      className="font-medium text-gold-bright hover:underline"
                    >
                      Subscribe ↗
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Actions: Search + 3-line Menu */}
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
              aria-label="Toggle navigation and Trade Tools directory"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-9 items-center gap-1.5 rounded-md border border-line bg-ink-900 px-2.5 text-xs font-medium text-bone hover:border-gold/40"
            >
              {mobileOpen ? (
                <X className="h-4 w-4 text-gold-bright" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4 text-gold-bright" aria-hidden="true" />
              )}
              <span>Trade Tools</span>
            </button>
          </div>
        </div>

        {/* Mobile Drawer (Only Single Clean List with 14 Items, Opening in New Tab) */}
        {mobileOpen && (
          <nav className="max-h-[84vh] overflow-y-auto border-t border-line/70 bg-ink-950 px-5 pb-6 pt-3 lg:hidden space-y-4">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <LiveClock />
              <FeedBadge className="text-[10px] uppercase tracking-[0.14em] text-muted" />
            </div>

            {/* Standard Primary Navigation */}
            <div className="grid gap-1">
              {[...SIMPLE_LINKS, { href: "/watchlist", label: "Watchlist" }].map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`rounded-md px-3 py-2 text-sm ${
                    isActive(link.href) ? "bg-ink-800 text-bone" : "text-muted hover:text-bone"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Single Unified Trade Tools Directory (14 items) */}
            <div className="border-t border-line/60 pt-3 space-y-1.5">
              <div className="flex items-center justify-between px-2 pb-1">
                <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-gold">
                  Directory · Trade Tools ({ALL_MAIN_ITEMS.length})
                </p>
                <span className="text-[10px] text-muted">Opens in new tab ↗</span>
              </div>
              {ALL_MAIN_ITEMS.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={`m-main-${idx}-${item.label}`}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setMobileOpen(false)}
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
                    <ExternalLink className="h-3 w-3 text-muted/60" />
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center justify-between border-t border-line/60 pt-3">
              <AuthButton />
              <Link
                href="/pricing"
                onClick={() => setMobileOpen(false)}
                className="rounded-full border border-gold/50 bg-gold/10 px-4 py-2 text-xs font-medium text-gold-bright"
              >
                Subscribe
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
