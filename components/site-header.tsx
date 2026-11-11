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
  MessageSquare,
  Calculator,
  CreditCard,
  Activity,
  Bookmark,
} from "lucide-react";

const SIMPLE_LINKS = [
  { href: "/markets", label: "Markets" },
  { href: "/crypto", label: "Crypto" },
  { href: "/meme-coins", label: "Meme coins" },
  { href: "/research", label: "Research" },
  { href: "/academy", label: "Academy" },
  { href: "/chat", label: "Live chat" },
  { href: "/pricing", label: "Pricing" },
];

const PUSTAKA_MAIN = [
  { href: "/realtime-news", label: "News Wire", desc: "Real-time multi-source news wire & ticker query stream", icon: Radio, live: true },
  { href: "/oraclex", label: "Vector RAG", desc: "Cross-asset semantic store, internals & liquidity ladder", icon: Compass },
  { href: "/neuberg", label: "Macro & Perps", desc: "516-panel macro regime, Fear & Greed & 24/7 perpetuals", icon: Terminal },
  { href: "/openstock", label: "Global Markets", desc: "9 global exchanges, multi-tab charts & sentiment radar", icon: Globe },
  { href: "/fincept", label: "DCF & Agents", desc: "37 capital allocator models, DCF valuation & options Greeks", icon: Cpu },
  { href: "/terminal", label: "Pro Terminal", desc: "Dual-screen charting, Level 2 depth & execution desk", icon: Terminal },
  { href: "/openbb", label: "VaR & CLI", desc: "Parametric & Monte Carlo VaR, yield curves & portfolio CLI", icon: Database },
  { href: "/gold-news", label: "News", desc: "100 live breaking action bulletins & trade directives", icon: Zap, live: true },
  { href: "/wsj", label: "Market Center", desc: "Most active volume, Form 4 insiders & sector analysis", icon: FileText },
  { href: "/chat", label: "Trading Floor", desc: "Live market commentary & member floor channels", icon: MessageSquare, live: true },
  { href: "/desks", label: "44 Desks", desc: "Full catalog of 44 specialized quantitative research desks", icon: Cpu },
  { href: "/markets", label: "Equities", desc: "S&P 500, Nasdaq & growth equity trend score board", icon: BarChart3 },
  { href: "/crypto", label: "Crypto", desc: "Digital assets scored by flow, float & liquidity regime", icon: Coins },
  { href: "/meme-coins", label: "Memes", desc: "Speculative bonding curve & attention-risk monitor", icon: Flame },
  { href: "/calculator", label: "Calculator", desc: "Invalidation-anchored position sizing engine", icon: Calculator },
  { href: "/pricing", label: "Pricing", desc: "Membership plans, trial details & feature comparison", icon: CreditCard },
];

const PUSTAKA_DESKS = [
  { href: "/realtime-news", label: "News Wire", desc: "Sub-second institutional wire & regulatory alerts", icon: Radio },
  { href: "/oraclex", label: "Vector RAG", desc: "SEC filings & FOMC transcript semantic vector desk", icon: Compass },
  { href: "/neuberg", label: "Macro & Perps", desc: "Macro regime quadrants & cross-exchange perpetuals", icon: Terminal },
  { href: "/openstock", label: "Global Markets", desc: "International equity sessions & sector rotation radar", icon: Globe },
  { href: "/fincept", label: "DCF & Agents", desc: "Quantitative valuation agents & option surface desk", icon: Cpu },
  { href: "/terminal", label: "Pro Terminal", desc: "Multi-monitor order book & intraday execution desk", icon: Terminal },
  { href: "/openbb", label: "VaR & CLI", desc: "Risk analytics, efficient frontier & macro CLI desk", icon: Database },
  { href: "/gold-news", label: "News", desc: "Minute-by-minute catalyst & macro bulletin desk", icon: Zap },
  { href: "/wsj", label: "Market Center", desc: "Insider Form 4 ledger & institutional equity breadth", icon: FileText },
  { href: "/markets", label: "Wall Street Desk", desc: "Large-cap US equities & institutional flow coverage", icon: BarChart3 },
  { href: "/calculator", label: "Day Trader Desk", desc: "Intraday invalidation levels & volatility position sizing", icon: TrendingUp },
  { href: "/crypto", label: "Crypto Desk", desc: "Spot ETF flows, perpetual funding & on-chain float", icon: Coins },
  { href: "/meme-coins", label: "Meme Desk", desc: "High-volatility speculative assets with strict 2% caps", icon: Flame },
  { href: "/desks", label: "All 44 Desks", desc: "Complete 44-desk quantitative research directory", icon: Cpu },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pustakaOpen, setPustakaOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPustakaOpen(false);
        setMobileOpen(false);
      }
    };
    const handlePointerDown = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setPustakaOpen(false);
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
      <header ref={headerRef} className="sticky top-0 z-50 border-b border-line/70 bg-ink-950/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5">
          {/* Simple Editorial Brand matching wallls */}
          <Link
            href="/"
            className="group flex shrink-0 items-baseline gap-2"
            onClick={() => {
              setMobileOpen(false);
              setPustakaOpen(false);
            }}
          >
            <span className="font-display text-[1.35rem] tracking-tight text-bone">
              Next<span className="text-gold-bright">Wall</span>Street
            </span>
            <span className="hidden text-[10px] font-medium uppercase tracking-[0.2em] text-muted 2xl:inline">
              Research
            </span>
          </Link>

          {/* Simple Primary Navigation */}
          <nav className="hidden items-center gap-0.5 xl:gap-1 lg:flex">
            {SIMPLE_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setPustakaOpen(false)}
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
                setPustakaOpen(false);
                setSearchOpen(true);
              }}
              aria-label="Search assets, research, and analyst desks"
              title="Search (⌘K)"
              className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ink-900 px-2.5 py-1.5 text-xs text-muted transition hover:border-gold/40 hover:text-bone"
            >
              <Search className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
              <kbd className="hidden xl:inline font-mono text-[10px] text-muted">
                ⌘K
              </kbd>
            </button>

            <Link
              href="/watchlist"
              onClick={() => setPustakaOpen(false)}
              className="text-[13px] xl:text-sm text-muted whitespace-nowrap transition-colors hover:text-bone"
            >
              Watchlist
            </Link>

            <Link
              href="/pricing"
              onClick={() => setPustakaOpen(false)}
              className="rounded-full border border-gold/50 bg-gold/10 px-3.5 py-1.5 text-[13px] xl:text-sm font-medium whitespace-nowrap text-gold-bright transition-colors hover:bg-gold/20"
            >
              Subscribe
            </Link>

            {/* All Main 3-line Menu / Pustaka Directory Button */}
            <button
              type="button"
              onClick={() => setPustakaOpen((prev) => !prev)}
              aria-expanded={pustakaOpen}
              aria-controls="all-main-pustaka-menu"
              aria-label={pustakaOpen ? "Close All Main directory" : "Open All Main directory"}
              title="All Main · Pustaka Terminal & Analyst Desks"
              className={`inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] xl:text-sm font-medium whitespace-nowrap transition-colors ${
                pustakaOpen
                  ? "border-gold bg-gold/20 text-gold-bright"
                  : "border-line bg-ink-900 text-bone hover:border-gold/50 hover:text-gold-bright"
              }`}
            >
              {pustakaOpen ? (
                <X className="h-4 w-4 text-gold-bright" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4 text-gold-bright" aria-hidden="true" />
              )}
              <span>All Main</span>
            </button>
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
              className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-ink-900 text-gold transition hover:border-gold/40"
            >
              <Search className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              aria-label="Toggle navigation and All Main directory"
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((v) => !v)}
              className="flex h-9 items-center gap-1.5 rounded-md border border-line bg-ink-900 px-2.5 text-xs font-medium text-bone hover:border-gold/40"
            >
              {mobileOpen ? (
                <X className="h-4 w-4 text-gold-bright" aria-hidden="true" />
              ) : (
                <Menu className="h-4 w-4 text-gold-bright" aria-hidden="true" />
              )}
              <span>All Main</span>
            </button>
          </div>
        </div>

        {/* Desktop Pustaka / All Main Downward Drawer */}
        {pustakaOpen && (
          <div
            id="all-main-pustaka-menu"
            role="region"
            aria-label="All Main and Analyst Desks Pustaka directory"
            className="absolute inset-x-0 top-full z-50 hidden border-b border-gold/30 bg-ink-950/98 shadow-[0_24px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl lg:block"
          >
            <div className="mx-auto max-w-7xl px-5 py-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3 border-b border-line/60 pb-3">
                <div>
                  <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-gold-bright">
                    Pustaka · All Main Terminals &amp; Analyst Desks
                  </p>
                  <p className="mt-0.5 text-xs text-muted">
                    Full institutional suite stacked in order — {PUSTAKA_MAIN.length} Main Platforms &amp;{" "}
                    {PUSTAKA_DESKS.length} Analyst Desks.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5">
                  <Link
                    href="/pipeline"
                    onClick={() => setPustakaOpen(false)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ink-900 px-3 py-1.5 text-xs text-muted transition hover:border-gold/40 hover:text-bone"
                  >
                    <Activity className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                    <span>Pipeline</span>
                  </Link>
                  <Link
                    href="/watchlist"
                    onClick={() => setPustakaOpen(false)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-line bg-ink-900 px-3 py-1.5 text-xs text-muted transition hover:border-gold/40 hover:text-bone"
                  >
                    <Bookmark className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                    <span>Watchlist</span>
                  </Link>
                  <AuthButton />
                  <button
                    type="button"
                    onClick={() => setPustakaOpen(false)}
                    aria-label="Close All Main directory"
                    className="inline-flex items-center gap-1 rounded-full border border-line bg-ink-900 px-3 py-1.5 text-xs font-mono text-muted hover:border-gold/40 hover:text-bone"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Close</span>
                  </button>
                </div>
              </div>

              <div className="max-h-[70vh] space-y-6 overflow-y-auto pr-1">
                {/* 1. Main Section (16) */}
                <div>
                  <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
                    Main Platforms &amp; Navigation ({PUSTAKA_MAIN.length})
                  </h3>
                  <ol className="flex flex-col divide-y divide-line/40 rounded-xl border border-line/70 bg-ink-900/70">
                    {PUSTAKA_MAIN.map((item, idx) => {
                      const Icon = item.icon;
                      const active = isActive(item.href);
                      return (
                        <li key={`main-${idx}-${item.label}`}>
                          <Link
                            href={item.href}
                            onClick={() => setPustakaOpen(false)}
                            className={`flex items-center justify-between gap-4 px-4 py-2.5 transition ${
                              active
                                ? "bg-gold/15 text-gold-bright"
                                : "text-bone/90 hover:bg-ink-850 hover:text-gold-bright"
                            }`}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="w-6 shrink-0 font-mono text-[11px] text-gold/80 tabular-nums">
                                {String(idx + 1).padStart(2, "0")}
                              </span>
                              <Icon className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                              <span className="shrink-0 text-[13px] font-medium">{item.label}</span>
                              <span className="hidden truncate text-xs text-muted sm:inline">
                                — {item.desc}
                              </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              {item.live && (
                                <span className="inline-flex items-center gap-1 rounded border border-emerald-400/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                                  LIVE
                                </span>
                              )}
                              <span className="font-mono text-[11px] text-muted">{item.href}</span>
                            </div>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </div>

                {/* 2. Analyst Desks Section (14) */}
                <div>
                  <h3 className="mb-2 font-mono text-[11px] font-semibold uppercase tracking-[0.16em] text-gold">
                    Analyst Desks ({PUSTAKA_DESKS.length})
                  </h3>
                  <ol className="flex flex-col divide-y divide-line/40 rounded-xl border border-line/70 bg-ink-900/70">
                    {PUSTAKA_DESKS.map((desk, idx) => {
                      const Icon = desk.icon;
                      const active = isActive(desk.href);
                      return (
                        <li key={`desk-${idx}-${desk.label}`}>
                          <Link
                            href={desk.href}
                            onClick={() => setPustakaOpen(false)}
                            className={`flex items-center justify-between gap-4 px-4 py-2.5 transition ${
                              active
                                ? "bg-gold/15 text-gold-bright"
                                : "text-bone/90 hover:bg-ink-850 hover:text-gold-bright"
                            }`}
                          >
                            <div className="flex min-w-0 items-center gap-3">
                              <span className="w-6 shrink-0 font-mono text-[11px] text-gold/80 tabular-nums">
                                {String(idx + 1).padStart(2, "0")}
                              </span>
                              <Icon className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
                              <span className="shrink-0 text-[13px] font-medium">{desk.label}</span>
                              <span className="hidden truncate text-xs text-muted sm:inline">
                                — {desk.desc}
                              </span>
                            </div>
                            <span className="shrink-0 font-mono text-[11px] text-muted">{desk.href}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Drawer */}
        {mobileOpen && (
          <nav className="max-h-[82vh] overflow-y-auto border-t border-line/70 bg-ink-900 px-5 pb-6 pt-3 lg:hidden space-y-4">
            <div className="flex items-center justify-between border-b border-line/60 pb-3">
              <LiveClock />
              <FeedBadge className="text-[10px] uppercase tracking-[0.14em] text-muted" />
            </div>

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

            <div className="border-t border-line/60 pt-3 space-y-1.5">
              <p className="px-2 font-mono text-[10px] font-bold uppercase tracking-widest text-gold">
                Pustaka · Main ({PUSTAKA_MAIN.length})
              </p>
              {PUSTAKA_MAIN.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={`m-main-${idx}-${item.label}`}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium ${
                      isActive(item.href) ? "bg-ink-800 text-bone" : "text-muted hover:text-bone"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="w-5 font-mono text-[10px] text-gold/75">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <Icon className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                      <span>{item.label}</span>
                    </span>
                    <span className="font-mono text-[10px] text-muted/70">{item.href}</span>
                  </Link>
                );
              })}
            </div>

            <div className="border-t border-line/60 pt-3 space-y-1.5">
              <p className="px-2 font-mono text-[10px] font-bold uppercase tracking-widest text-gold">
                Pustaka · Analyst Desks ({PUSTAKA_DESKS.length})
              </p>
              {PUSTAKA_DESKS.map((desk, idx) => {
                const Icon = desk.icon;
                return (
                  <Link
                    key={`m-desk-${idx}-${desk.label}`}
                    href={desk.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium ${
                      isActive(desk.href) ? "bg-ink-800 text-bone" : "text-muted hover:text-bone"
                    }`}
                  >
                    <span className="flex items-center gap-2.5">
                      <span className="w-5 font-mono text-[10px] text-gold/75">
                        {String(idx + 1).padStart(2, "0")}
                      </span>
                      <Icon className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
                      <span>{desk.label}</span>
                    </span>
                    <span className="font-mono text-[10px] text-muted/70">{desk.href}</span>
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
