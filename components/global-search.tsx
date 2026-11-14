"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Search,
  X,
  TrendingUp,
  FileText,
  Cpu,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import type {
  GlobalSearchResponse,
  SearchScope,
} from "@/lib/global-search";
import { useWhop } from "@/lib/whop-context";
import { isPublicRoute } from "@/components/locked-action";

interface GlobalSearchProps {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}

type FlatResultItem = {
  key: string;
  href: string;
};

const SCOPE_TABS: { id: SearchScope; label: string }[] = [
  { id: "all", label: "All" },
  { id: "assets", label: "Assets" },
  { id: "articles", label: "Research" },
  { id: "desks", label: "Analyst Desks" },
];

export default function GlobalSearchModal({
  open,
  onOpen,
  onClose,
}: GlobalSearchProps) {
  const router = useRouter();
  const { isUnlocked, openWhopModal } = useWhop();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<SearchScope>("all");
  const [data, setData] = useState<GlobalSearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  // Global keyboard shortcuts: Cmd/Ctrl + K or "/" outside inputs
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (open) onClose();
        else onOpen();
        return;
      }

      if (e.key === "/" && !open) {
        const target = e.target as HTMLElement | null;
        const tag = target?.tagName?.toLowerCase();
        if (
          tag === "input" ||
          tag === "textarea" ||
          tag === "select" ||
          target?.isContentEditable
        ) {
          return;
        }
        e.preventDefault();
        onOpen();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onOpen, onClose]);

  // Focus input when modal opens
  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
    }, 10);
    return () => window.clearTimeout(timer);
  }, [open]);

  // Fetch search results from /api/search
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController();
    const delay = query.trim() ? 90 : 0;

    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          q: query,
          scope,
          limit: scope === "all" ? "6" : "12",
        });
        const res = await fetch(`/api/search?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`Search failed (${res.status})`);
        const json: GlobalSearchResponse = await res.json();
        setData(json);
        setActiveIndex(0);
      } catch (err: unknown) {
        if ((err as { name?: string })?.name === "AbortError") return;
        setError("Unable to search catalog right now.");
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, delay);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [open, query, scope]);

  const flatItems = useMemo<FlatResultItem[]>(() => {
    if (!data) return [];
    const items: FlatResultItem[] = [];
    for (const a of data.assets) {
      items.push({ key: `asset-${a.symbol}`, href: a.href });
    }
    for (const art of data.articles) {
      items.push({ key: `article-${art.slug}`, href: art.href });
    }
    for (const desk of data.desks) {
      items.push({ key: `desk-${desk.id}`, href: desk.href });
    }
    return items;
  }, [data]);

  const navigateTo = (href: string, label?: string) => {
    onClose();
    if (!isUnlocked && !isPublicRoute(href.split("?")[0])) {
      openWhopModal(label || href, href);
      return;
    }
    router.push(href);
  };

  const handleDialogKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onClose();
      return;
    }

    if (!flatItems.length) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((prev) => (prev + 1) % flatItems.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((prev) => (prev - 1 + flatItems.length) % flatItems.length);
    } else if (e.key === "Enter") {
      const selected = flatItems[activeIndex];
      if (selected) {
        e.preventDefault();
        navigateTo(selected.href);
      }
    }
  };

  if (!open) return null;

  const activeKey = flatItems[activeIndex]?.key;
  const hasResults =
    data &&
    (data.assets.length > 0 ||
      data.articles.length > 0 ||
      data.desks.length > 0);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-black/75 px-4 pt-14 pb-8 backdrop-blur-sm sm:pt-20"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      onKeyDown={handleDialogKeyDown}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Global market search"
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-ink-900 shadow-2xl"
      >
        {/* Search Input Header */}
        <div className="flex items-center gap-3 bg-ink-950/75 px-4 py-3.5">
          <Search className="h-4 w-4 shrink-0 text-gold" aria-hidden="true" />
          <label htmlFor="global-search-input" className="sr-only">
            Search assets, research articles, and analyst desks
          </label>
          <input
            id="global-search-input"
            ref={inputRef}
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search symbols, asset names, research articles, or analyst desks..."
            className="w-full bg-transparent text-sm text-bone placeholder:text-muted/60 focus:outline-none"
          />
          {loading && (
            <Loader2
              className="h-4 w-4 shrink-0 animate-spin text-gold"
              aria-label="Searching"
            />
          )}
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              aria-label="Clear search query"
              className="rounded-md px-2 py-1 text-[11px] text-muted transition hover:bg-ink-800 hover:text-bone"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close search"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-ink-900 text-muted transition hover:bg-ink-850 hover:text-bone"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Category Filter Tabs */}
        <div
          role="tablist"
          aria-label="Search categories"
          className="flex flex-wrap items-center justify-between gap-2 bg-ink-900/95 px-4 py-2.5"
        >
          <div className="flex flex-wrap items-center gap-1.5">
            {SCOPE_TABS.map((tab) => {
              const active = scope === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setScope(tab.id)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "bg-gold text-ink-950 font-semibold"
                      : "bg-ink-950/75 text-muted hover:bg-ink-850 hover:text-bone"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2 text-[11px] text-muted">
            {data && !data.isFeatured && (
              <span className="font-mono">
                {data.counts.total} {data.counts.total === 1 ? "match" : "matches"}
              </span>
            )}
            {data?.isFeatured && (
              <span className="text-[10px] uppercase tracking-wider text-gold">
                Quick Jump
              </span>
            )}
          </div>
        </div>

        {/* Results Body */}
        <div className="max-h-[62vh] overflow-y-auto p-3 space-y-4">
          {error && (
            <div className="rounded-xl bg-down/15 p-4 text-xs text-down">
              {error}
            </div>
          )}

          {!error && loading && !data && (
            <div className="rounded-xl bg-ink-950/60 p-8 text-center text-xs text-muted">
              Searching 2,000+ assets, 70 research decks, and 44 analyst desks...
            </div>
          )}

          {!error && data && !hasResults && (
            <div className="rounded-xl bg-ink-950/60 p-8 text-center">
              <p className="text-sm font-medium text-bone">
                No results found for &ldquo;{data.query}&rdquo;
              </p>
              <p className="mt-1.5 text-xs text-muted">
                Try a ticker symbol (e.g. NVDA, BTC, SOL), company name, research topic, or analyst desk.
              </p>
            </div>
          )}

          {/* Assets Section */}
          {data && data.assets.length > 0 && (
            <section aria-label="Assets results">
              <div className="flex items-center justify-between px-2 pb-1.5">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
                  <TrendingUp className="h-3 w-3" aria-hidden="true" />
                  <span>
                    Assets{" "}
                    {!data.isFeatured && data.counts.assets > data.assets.length
                      ? `(${data.assets.length} of ${data.counts.assets})`
                      : `(${data.assets.length})`}
                  </span>
                </p>
                <Link
                  href="/markets"
                  onClick={(e) => {
                    if (!isUnlocked) {
                      e.preventDefault();
                      onClose();
                      openWhopModal("All Scored Markets", "/markets");
                    } else {
                      onClose();
                    }
                  }}
                  className="text-[11px] text-muted hover:text-gold-bright"
                >
                  Browse all →
                </Link>
              </div>
              <ul className="space-y-1">
                {data.assets.map((asset) => {
                  const key = `asset-${asset.symbol}`;
                  const isHighlighted = activeKey === key;
                  return (
                    <li key={key}>
                      <Link
                        href={asset.href}
                        onClick={(e) => {
                          if (!isUnlocked) {
                            e.preventDefault();
                            onClose();
                            openWhopModal(`${asset.symbol} · ${asset.name}`, asset.href);
                          } else {
                            onClose();
                          }
                        }}
                        className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition ${
                          isHighlighted
                            ? "bg-ink-800"
                            : "hover:bg-ink-850"
                        }`}
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <span className="w-20 shrink-0 rounded-md bg-ink-950/90 px-2 py-1 text-center font-mono text-xs font-bold text-gold-bright">
                            {asset.symbol}
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-bone">
                              {asset.name}
                            </p>
                            <p className="truncate text-[11px] text-muted">
                              {asset.group}
                            </p>
                          </div>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className="rounded-full bg-ink-950/85 px-2.5 py-0.5 font-mono text-[10px] uppercase text-muted">
                            {asset.kind}
                          </span>
                          <ArrowUpRight className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Research Articles Section */}
          {data && data.articles.length > 0 && (
            <section aria-label="Research articles results">
              <div className="flex items-center justify-between px-2 pb-1.5">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
                  <FileText className="h-3 w-3" aria-hidden="true" />
                  <span>
                    Research Articles{" "}
                    {!data.isFeatured && data.counts.articles > data.articles.length
                      ? `(${data.articles.length} of ${data.counts.articles})`
                      : `(${data.articles.length})`}
                  </span>
                </p>
                <Link
                  href="/research"
                  onClick={(e) => {
                    if (!isUnlocked) {
                      e.preventDefault();
                      onClose();
                      openWhopModal("All 70 Research Decks", "/research");
                    } else {
                      onClose();
                    }
                  }}
                  className="text-[11px] text-muted hover:text-gold-bright"
                >
                  All 70 decks →
                </Link>
              </div>
              <ul className="space-y-1">
                {data.articles.map((article) => {
                  const key = `article-${article.slug}`;
                  const isHighlighted = activeKey === key;
                  return (
                    <li key={key}>
                      <Link
                        href={article.href}
                        onClick={(e) => {
                          if (!isUnlocked) {
                            e.preventDefault();
                            onClose();
                            openWhopModal(article.title, article.href);
                          } else {
                            onClose();
                          }
                        }}
                        className={`flex items-start justify-between gap-3 rounded-xl px-3 py-2.5 transition ${
                          isHighlighted
                            ? "bg-ink-800"
                            : "hover:bg-ink-850"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-bone leading-snug">
                            {article.title}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-muted">
                            {article.author} · {article.readMinutes} min read ·{" "}
                            {article.tickers.slice(0, 4).join(", ")}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 pt-0.5">
                          <span className="rounded-full bg-ink-950/85 px-2.5 py-0.5 text-[10px] uppercase text-muted">
                            {article.category}
                          </span>
                          <ArrowUpRight className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Analyst Desks Section */}
          {data && data.desks.length > 0 && (
            <section aria-label="Analyst desks results">
              <div className="flex items-center justify-between px-2 pb-1.5">
                <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
                  <Cpu className="h-3 w-3" aria-hidden="true" />
                  <span>
                    Analyst Desks{" "}
                    {!data.isFeatured && data.counts.desks > data.desks.length
                      ? `(${data.desks.length} of ${data.counts.desks})`
                      : `(${data.desks.length})`}
                  </span>
                </p>
                <Link
                  href="/desks"
                  onClick={(e) => {
                    if (!isUnlocked) {
                      e.preventDefault();
                      onClose();
                      openWhopModal("Quantitative Analyst Desks", "/desks");
                    } else {
                      onClose();
                    }
                  }}
                  className="text-[11px] text-muted hover:text-gold-bright"
                >
                  All 44 desks →
                </Link>
              </div>
              <ul className="space-y-1">
                {data.desks.map((desk) => {
                  const key = `desk-${desk.id}`;
                  const isHighlighted = activeKey === key;
                  return (
                    <li key={key}>
                      <Link
                        href={desk.href}
                        onClick={(e) => {
                          if (!isUnlocked) {
                            e.preventDefault();
                            onClose();
                            openWhopModal(desk.name, desk.href);
                          } else {
                            onClose();
                          }
                        }}
                        className={`flex items-start justify-between gap-3 rounded-xl px-3 py-2.5 transition ${
                          isHighlighted
                            ? "bg-ink-800"
                            : "hover:bg-ink-850"
                        }`}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-bone leading-snug">
                            {desk.name}
                          </p>
                          <p className="mt-0.5 truncate text-[11px] text-muted">
                            {desk.leadAnalyst} · Focus: {desk.focusTickers.join(", ")}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2 pt-0.5">
                          <span className="rounded-full bg-ink-950/85 px-2.5 py-0.5 text-[10px] uppercase text-muted">
                            {desk.category}
                          </span>
                          <ArrowUpRight className="h-3.5 w-3.5 text-muted" aria-hidden="true" />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>

        {/* Keyboard Shortcut Footer */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-ink-950/80 px-4 py-2.5 text-[11px] text-muted">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded bg-ink-900 px-1.5 py-0.5 font-mono text-[10px] text-bone">
                ↑↓
              </kbd>{" "}
              navigate
            </span>
            <span>
              <kbd className="rounded bg-ink-900 px-1.5 py-0.5 font-mono text-[10px] text-bone">
                Enter
              </kbd>{" "}
              open
            </span>
            <span>
              <kbd className="rounded bg-ink-900 px-1.5 py-0.5 font-mono text-[10px] text-bone">
                Esc
              </kbd>{" "}
              close
            </span>
          </div>
          <span className="font-mono text-[10px] text-muted/80">
            2,000+ Assets · 70 Research Decks · 44 Analyst Desks
          </span>
        </div>
      </div>
    </div>
  );
}
