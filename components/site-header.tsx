"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import LiveClock from "@/components/live-clock";
import FeedBadge from "@/components/feed-badge";
import AuthButton from "@/components/auth-button";
import WhopBadge from "@/components/whop-badge";
import GlobalSearchModal from "@/components/global-search";
import { useWhop } from "@/lib/whop-context";
import {
  TrendingUp,
  BarChart3,
  Coins,
  Flame,
  Bell,
  Cpu,
  Terminal,
  FileText,
  Zap,
  Database,
  Globe,
  Compass,
  Radio,
  Search,
  ChevronDown,
  ChevronUp,
  List,
  X,
} from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  live?: boolean;
  pro?: boolean;
}

const DESK_TABS = [
  { href: "/realtime-news", label: "News Wire", icon: Radio, desc: "10,000+ Sources Real-Time News Stream & Query Wire", pro: true },
  { href: "/oraclex", label: "Vector RAG", icon: Compass, desc: "Cross-Asset Vector RAG, Market Internals & Liquidity Ladder", pro: true },
  { href: "/neuberg", label: "Macro & Perps", icon: Terminal, desc: "516-Panel Macro Regime, Fear & Greed & 24/7 Perpetuals", pro: true },
  { href: "/openstock", label: "Global Markets", icon: Globe, desc: "9 Global Exchanges, Multi-Tab Charts & Sentiment Radar", pro: true },
  { href: "/fincept", label: "DCF & Agents", icon: Cpu, desc: "37 AI Allocator Agents, DCF Valuation & Options Greeks", pro: true },
  { href: "/terminal", label: "Pro Terminal", icon: Terminal, desc: "Dual-Screen Charting, Level 2 Depth & Order Desk", pro: true },
  { href: "/openbb", label: "VaR & CLI", icon: Database, desc: "Quantitative Risk, VaR, Yield Curves & Portfolio CLI", pro: true },
  { href: "/gold-news", label: "News", icon: Zap, desc: "100 Live Breaking Action Catalysts", pro: true },
  { href: "/wsj", label: "Market Center", icon: FileText, desc: "Most Active, Form 4 Insiders & Deep Analysis", pro: true },
  { href: "/markets", label: "Wall Street Desk", icon: BarChart3, desc: "S&P 500, Nasdaq, Institutional Flow", pro: false },
  { href: "/calculator", label: "Day Trader Desk", icon: TrendingUp, desc: "Intraday Levels & Invalidation Sizing", pro: true },
  { href: "/crypto", label: "Crypto Desk", icon: Coins, desc: "Binance, Layer-1/2, Liquidity Float", pro: false },
  { href: "/meme-coins", label: "Meme Desk", icon: Flame, desc: "pump.fun, Bonding Curves, 2% Risk Cap", pro: false },
  { href: "/desks", label: "All 44 Desks", icon: Cpu, desc: "44 Quantitative Desks", pro: true },
];

const MAIN_LINKS: NavLink[] = [
  { href: "/realtime-news", label: "News Wire", live: true, pro: true },
  { href: "/oraclex", label: "Vector RAG", pro: true },
  { href: "/neuberg", label: "Macro & Perps", pro: true },
  { href: "/openstock", label: "Global Markets", pro: true },
  { href: "/fincept", label: "DCF & Agents", pro: true },
  { href: "/terminal", label: "Pro Terminal", pro: true },
  { href: "/openbb", label: "VaR & CLI", pro: true },
  { href: "/gold-news", label: "News", live: true, pro: true },
  { href: "/wsj", label: "Market Center", pro: true },
  { href: "/chat", label: "Trading Floor", live: true, pro: true },
  { href: "/desks", label: "44 Desks", pro: true },
  { href: "/markets", label: "Equities" },
  { href: "/crypto", label: "Crypto" },
  { href: "/meme-coins", label: "Memes" },
  { href: "/calculator", label: "Calculator", pro: true },
  { href: "/pricing", label: "Pricing" },
];

export default function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [showAllDesks, setShowAllDesks] = useState(false);
  const [showAllMain, setShowAllMain] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  useWhop();

  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowAllDesks(false);
        setShowAllMain(false);
      }
    };
    const handlePointerDown = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) {
        setShowAllDesks(false);
        setShowAllMain(false);
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
      {/* Top Analyst Desk Bar - Clear institutional separation of Wall Street, Day Trading, Crypto, and Meme Desks */}
      <div className="border-b border-line/50 bg-ink-900/60 px-4 py-1.5 text-xs hidden md:block">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3">
          <div className="flex min-w-0 flex-1 items-center gap-1 sm:gap-2 overflow-x-auto whitespace-nowrap pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)]">
            <span className="text-[10px] uppercase font-bold tracking-widest text-gold mr-2 hidden lg:inline shrink-0">
              Analyst Desks:
            </span>
            {DESK_TABS.map((desk) => {
              const Icon = desk.icon;
              const active = isActive(desk.href);
              return (
                <Link
                  key={desk.label}
                  href={desk.href}
                  className={`inline-flex shrink-0 items-center gap-1.5 rounded px-2.5 py-1 text-[11px] font-medium transition-all ${
                    active
                      ? "bg-gold/15 text-gold-bright border border-gold/30 shadow-sm"
                      : "text-muted hover:text-bone hover:bg-ink-800"
                  }`}
                >
                  <Icon className="h-3 w-3 text-gold" />
                  <span>{desk.label}</span>
                  {desk.pro && <WhopBadge size="xs" asSpan />}
                </Link>
              );
            })}
          </div>

          <div className="flex shrink-0 items-center gap-2.5 whitespace-nowrap">
            {/* VIP Fast Alerts Shortcut */}
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition"
              title="Terminal Push Alerts · Telegram & Discord"
            >
              <Bell className="h-3 w-3 text-emerald-400 animate-pulse" />
              <span>VIP Alerts Terminal</span>
              <WhopBadge size="xs" asSpan />
            </Link>
            <span className="h-3 w-px bg-line" />
            <LiveClock compact />
            <FeedBadge className="hidden xl:inline-flex text-[10px] uppercase tracking-wider text-muted" />
            <span className="h-3 w-px bg-line" />
            {/* 2. Expand Analyst Desks Vertically Toggle */}
            <button
              type="button"
              onClick={() => {
                setShowAllDesks((prev) => !prev);
                setShowAllMain(false);
              }}
              aria-expanded={showAllDesks}
              aria-controls="analyst-desks-vertical-menu"
              aria-label={showAllDesks ? "Collapse Analyst Desks vertical list" : "Show all Analyst Desks vertically"}
              className={`inline-flex shrink-0 items-center gap-1.5 rounded-md border px-2.5 py-1 text-[11px] font-mono font-semibold transition ${
                showAllDesks
                  ? "border-gold/60 bg-gold/20 text-gold-bright shadow-sm"
                  : "border-gold/35 bg-ink-850 text-gold hover:border-gold/60 hover:text-gold-bright"
              }`}
              title="Tampilkan seluruh Analyst Desks secara berurut ke bawah"
            >
              <List className="h-3 w-3" aria-hidden="true" />
              <span>All Desks ({DESK_TABS.length})</span>
              {showAllDesks ? (
                <ChevronUp className="h-3 w-3" aria-hidden="true" />
              ) : (
                <ChevronDown className="h-3 w-3" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-5">
        <Link href="/" className="group flex shrink-0 items-baseline gap-2" onClick={() => setOpen(false)}>
          <span className="font-display text-[1.4rem] tracking-tight text-bone">
            Next<span className="text-gold-bright">Wall</span>Street
          </span>
          <span className="rounded bg-gold/10 border border-gold/30 px-1.5 py-0.2 text-[9px] font-mono font-bold text-gold-bright uppercase tracking-wider hidden xl:inline">
            PRO DESK
          </span>
        </Link>

        {/* Desktop Links (Horizontally Scrollable) */}
        <nav className="hidden min-w-0 flex-1 items-center gap-1 xl:gap-1.5 overflow-x-auto whitespace-nowrap pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,black_calc(100%-24px),transparent)] lg:flex">
          {MAIN_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`relative flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-xs xl:text-[13px] font-medium transition-colors ${
                isActive(link.href)
                  ? "bg-ink-800 text-bone"
                  : "text-muted hover:bg-ink-850 hover:text-bone"
              }`}
            >
              <span>{link.label}</span>
              {link.pro && <WhopBadge size="xs" asSpan />}
              {link.live && (
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
              )}
            </Link>
          ))}
        </nav>

        {/* Right Action Cluster + 1. Expand Main Nav Button */}
        <div className="hidden shrink-0 items-center gap-2 xl:gap-2.5 lg:flex">
          <button
            type="button"
            onClick={() => {
              setShowAllMain((prev) => !prev);
              setShowAllDesks(false);
            }}
            aria-expanded={showAllMain}
            aria-controls="main-nav-vertical-menu"
            aria-label={showAllMain ? "Collapse Main Navigation vertical list" : "Show all Main links vertically"}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-mono font-semibold transition ${
              showAllMain
                ? "border-gold/60 bg-gold/20 text-gold-bright shadow-sm"
                : "border-gold/30 bg-ink-900 text-bone/90 hover:border-gold/55 hover:text-gold-bright"
            }`}
            title="Tampilkan seluruh menu Main secara berurut ke bawah"
          >
            <List className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
            <span>All Main ({MAIN_LINKS.length})</span>
            {showAllMain ? (
              <ChevronUp className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
            ) : (
              <ChevronDown className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setSearchOpen(true)}
            aria-label="Search assets, research, and analyst desks"
            className="inline-flex items-center gap-2 rounded-full border border-line bg-ink-900 px-3 py-1.5 text-xs text-muted transition hover:border-gold/40 hover:text-bone"
          >
            <Search className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
            <span>Search</span>
            <kbd className="hidden xl:inline rounded border border-line bg-ink-950 px-1.5 py-0.5 font-mono text-[10px] text-muted">
              ⌘K
            </kbd>
          </button>
          <Link
            href="/watchlist"
            className="text-xs text-muted transition-colors hover:text-bone flex items-center gap-1"
          >
            <span>Watchlist</span>
          </Link>
          <WhopBadge size="sm" />
          <AuthButton />
          <Link
            href="/pricing"
            className="rounded-full bg-gold px-4 py-2 text-xs font-bold text-ink-950 transition-all hover:bg-gold-bright shadow hover:scale-105"
          >
            Start PRO
          </Link>
        </div>

        {/* Mobile Actions: Search + Hamburger */}
        <div className="flex items-center gap-2 lg:hidden">
          <button
            type="button"
            aria-label="Search assets, research, and analyst desks"
            onClick={() => {
              setOpen(false);
              setSearchOpen(true);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-line bg-ink-900 text-gold transition hover:border-gold/40"
          >
            <Search className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label="Toggle navigation"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-bone"
          >
            <span className="sr-only">Menu</span>
            <div className="space-y-1.5">
              <span className={`block h-px w-5 bg-bone transition ${open ? "translate-y-[6px] rotate-45" : ""}`} />
              <span className={`block h-px w-5 bg-bone transition ${open ? "opacity-0" : ""}`} />
              <span className={`block h-px w-5 bg-bone transition ${open ? "-translate-y-[6px] -rotate-45" : ""}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Ordered Downward Analyst Desks Drawer (Anchored below full header so both top bars remain clickable) */}
      {showAllDesks && (
        <div
          id="analyst-desks-vertical-menu"
          role="region"
          aria-label="All Analyst Desks ordered downward"
          className="absolute inset-x-0 top-full z-50 hidden md:block border-b border-gold/30 bg-ink-950/98 shadow-[0_24px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl"
        >
          <div className="mx-auto max-w-7xl px-4 py-3">
            <div className="mb-2 flex items-center justify-between border-b border-line/60 pb-2">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-gold-bright">
                Analyst Desks Directory ({DESK_TABS.length}) · Ordered Top-to-Bottom
              </span>
              <button
                type="button"
                onClick={() => setShowAllDesks(false)}
                aria-label="Close Analyst Desks vertical list"
                className="inline-flex items-center gap-1 rounded border border-line bg-ink-900 px-2 py-0.5 text-[11px] font-mono text-muted hover:border-gold/40 hover:text-bone"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                <span>Close</span>
              </button>
            </div>
            <ol className="flex max-h-[60vh] flex-col divide-y divide-line/40 overflow-y-auto rounded-xl border border-line/70 bg-ink-900/70">
              {DESK_TABS.map((desk, idx) => {
                const Icon = desk.icon;
                const active = isActive(desk.href);
                return (
                  <li key={desk.label}>
                    <Link
                      href={desk.href}
                      onClick={() => setShowAllDesks(false)}
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
                        <span className="shrink-0 font-medium text-xs sm:text-[13px]">
                          {desk.label}
                        </span>
                        <span className="hidden truncate text-[11px] text-muted sm:inline">
                          — {desk.desc}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {desk.pro && <WhopBadge size="xs" asSpan />}
                        <span className="font-mono text-[10px] text-muted">{desk.href}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}

      {/* Ordered Downward Main Navigation Drawer */}
      {showAllMain && (
        <div
          id="main-nav-vertical-menu"
          role="region"
          aria-label="All Main Navigation links ordered downward"
          className="absolute inset-x-0 top-full z-50 hidden lg:block border-b border-gold/30 bg-ink-950/98 shadow-[0_24px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl"
        >
          <div className="mx-auto max-w-7xl px-5 py-3">
            <div className="mb-2 flex items-center justify-between border-b border-line/60 pb-2">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-widest text-gold-bright">
                Main Navigation Directory ({MAIN_LINKS.length}) · Ordered Top-to-Bottom
              </span>
              <button
                type="button"
                onClick={() => setShowAllMain(false)}
                aria-label="Close Main Navigation vertical list"
                className="inline-flex items-center gap-1 rounded border border-line bg-ink-900 px-2 py-0.5 text-[11px] font-mono text-muted hover:border-gold/40 hover:text-bone"
              >
                <X className="h-3 w-3" aria-hidden="true" />
                <span>Close</span>
              </button>
            </div>
            <ol className="flex max-h-[60vh] flex-col divide-y divide-line/40 overflow-y-auto rounded-xl border border-line/70 bg-ink-900/70">
              {MAIN_LINKS.map((link, idx) => {
                const active = isActive(link.href);
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setShowAllMain(false)}
                      className={`flex items-center justify-between gap-4 px-4 py-2.5 transition ${
                        active
                          ? "bg-gold/15 text-gold-bright"
                          : "text-bone/90 hover:bg-ink-850 hover:text-gold-bright"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 shrink-0 font-mono text-[11px] text-gold/80 tabular-nums">
                          {String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="text-xs sm:text-[13px] font-medium">{link.label}</span>
                        {link.live && (
                          <span className="inline-flex items-center gap-1 rounded border border-emerald-400/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[10px] text-emerald-300">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            LIVE
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {link.pro && <WhopBadge size="xs" asSpan />}
                        <span className="font-mono text-[10px] text-muted">{link.href}</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      )}

      {/* Mobile Drawer */}
      {open && (
        <nav className="border-t border-line/70 bg-ink-900 px-5 pb-5 pt-3 lg:hidden space-y-3">
          <div className="flex items-center justify-between border-b border-line/60 pb-3">
            <LiveClock />
            <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
              <span>Terminal Feeds Active</span>
            </span>
          </div>

          <div className="space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gold px-2">
              Analyst Desks
            </p>
            {DESK_TABS.map((desk) => {
              const Icon = desk.icon;
              return (
                <Link
                  key={desk.href}
                  href={desk.href}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium ${
                    isActive(desk.href) ? "bg-ink-800 text-bone" : "text-muted"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className="h-3.5 w-3.5 text-gold" />
                    <span>{desk.label}</span>
                  </span>
                  {desk.pro && <WhopBadge size="xs" asSpan />}
                </Link>
              );
            })}
          </div>

          <div className="border-t border-line/60 pt-2 space-y-1">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted px-2">
              Platforms &amp; Research
            </p>
            {[...MAIN_LINKS, { href: "/watchlist", label: "Watchlist", pro: true }].map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium ${
                  isActive(link.href) ? "bg-ink-800 text-bone" : "text-muted"
                }`}
              >
                <span>{link.label}</span>
                {link.pro && <WhopBadge size="xs" asSpan />}
              </Link>
            ))}
          </div>

          <div className="pt-3 border-t border-line/60 flex items-center justify-between">
            <AuthButton />
            <Link
              href="/pricing"
              onClick={() => setOpen(false)}
              className="rounded-full bg-gold px-4 py-2 text-xs font-bold text-ink-950"
            >
              Subscribe PRO ($29)
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
