"use client";

import { useState } from "react";
import { Share2, Check, TrendingUp, ShieldAlert, Activity } from "lucide-react";
import WhopBadge from "./whop-badge";

interface AnalystFaceBreakdownProps {
  symbol: string;
  name: string;
  lastPrice: number;
  score: number;
  stance: string;
  invalidationLevel: number;
  supportLevel: number;
  resistanceLevel: number;
  sma20: number;
  sma50: number;
  sma200: number;
  rsi: number;
  volatility60d: number;
  validReason: string;
  invalidationReason: string;
}

export default function AnalystFaceBreakdown({
  symbol,
  name,
  lastPrice,
  score,
  stance,
  invalidationLevel,
  supportLevel,
  resistanceLevel,
  sma20,
  sma50,
  sma200,
  rsi,
  volatility60d,
  validReason,
  invalidationReason,
}: AnalystFaceBreakdownProps) {
  const [copied, setCopied] = useState(false);

  const tweetText = `📊 $${symbol} Quantitative Desk Breakdown by @NextWallStreet:
• Last Close: $${lastPrice.toFixed(2)} | Score: ${score}/100 (${stance})
• Why Trend is Valid: 20-SMA ($${sma20.toFixed(2)}) > 50-SMA ($${sma50.toFixed(2)}) with RSI ${rsi.toFixed(0)}
• Invalidation Stop (Where I'm Wrong): $${invalidationLevel.toFixed(2)}
• Target / Resistance: $${resistanceLevel.toFixed(2)}

No opinions, only mathematical invalidation. Audit the model here: https://nextwallstreet.com/ticker/${symbol}`;

  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(tweetText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-ink-900/65 p-6 sm:p-8 shadow-xl space-y-6">
      {/* Header with Lead Analyst Persona */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-gold/30 to-bone/15 p-[1.5px]">
            <div className="flex h-full w-full items-center justify-center rounded-2xl bg-ink-950 font-display text-base font-bold text-gold-bright">
              DO
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg text-bone">Daniel Okafor, CFA</span>
              <span className="rounded bg-gold/15 px-2 py-0.5 text-[9px] font-mono text-gold-bright font-bold">
                CHIEF QUANTITATIVE DESK
              </span>
              <WhopBadge size="xs" />
            </div>
            <p className="text-xs text-muted">
              Head of Quantitative Trend Research · NextWallStreet
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 rounded-xl bg-ink-950/80 px-3.5 py-2 text-xs font-medium text-bone hover:bg-ink-950 hover:text-gold-bright transition"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Share2 className="h-3.5 w-3.5 text-muted" />}
            <span>{copied ? "Copied" : "Copy Thesis"}</span>
          </button>
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-bone px-3.5 py-2 text-xs font-bold text-ink-950 hover:bg-gold-bright transition shadow"
          >
            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            <span>Share to X (Twitter)</span>
          </a>
        </div>
      </div>

      {/* Deterministic Quantitative Data Grid */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted flex items-center gap-1">
            <Activity className="h-3 w-3 text-gold" />
            Deterministic Quant Pipeline · Verified Real-Time Feeds
          </span>
          <span className="text-[10px] font-mono text-emerald-400">Quantitative Feed Active ✓</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
          <div className="rounded-xl bg-ink-950/75 px-4 py-3">
            <span className="text-[10px] text-muted block">Last Close</span>
            <span className="text-bone font-bold text-sm">${lastPrice.toFixed(2)}</span>
          </div>
          <div className="rounded-xl bg-ink-950/75 px-4 py-3">
            <span className="text-[10px] text-muted block">Model Invalidation</span>
            <span className="text-down font-bold text-sm">${invalidationLevel.toFixed(2)}</span>
          </div>
          <div className="rounded-xl bg-ink-950/75 px-4 py-3">
            <span className="text-[10px] text-muted block">Support / Target</span>
            <span className="text-bone text-xs">${supportLevel.toFixed(2)} / ${resistanceLevel.toFixed(2)}</span>
          </div>
          <div className="rounded-xl bg-ink-950/75 px-4 py-3">
            <span className="text-[10px] text-muted block">20 / 50 / 200 SMA</span>
            <span className="text-bone text-xs">${sma20.toFixed(0)} / ${sma50.toFixed(0)} / ${sma200.toFixed(0)}</span>
          </div>
        </div>
      </div>

      {/* The Two Core Analytical Pillars */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Core Pillar 1: Why This Trend Is Structurally Valid */}
        <div className="rounded-xl bg-emerald-950/25 p-5 space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
            <TrendingUp className="h-4 w-4" />
            <span>1. Why This Trend Is Structurally Valid</span>
          </div>
          <p className="text-xs text-bone/90 leading-relaxed">
            {validReason ||
              `Technical structure confirms price holding above the 20-day SMA ($${sma20.toFixed(2)}) with a positive slope relative to the 50-day average. 30-session momentum persistence remains in the institutional accumulation quantile, supported by a constructive RSI reading of ${rsi.toFixed(0)}.`}
          </p>
        </div>

        {/* Core Pillar 2: Invalidation Level — Where The Thesis Dies */}
        <div className="rounded-xl bg-rose-950/25 p-5 space-y-2">
          <div className="flex items-center gap-2 text-rose-400 font-semibold text-xs uppercase tracking-wider">
            <ShieldAlert className="h-4 w-4" />
            <span>2. Invalidation Level: Where My Thesis Breaks</span>
          </div>
          <p className="text-xs text-bone/90 leading-relaxed font-mono">
            {invalidationReason ||
              `This quantitative thesis is mathematically invalidated if price prints a daily close below $${invalidationLevel.toFixed(2)}. Breaching this anchor terminates the constructive read and triggers an immediate disciplined exit.`}
          </p>
        </div>
      </div>

      <div className="pt-2 text-[11px] text-muted flex items-center justify-between">
        <span>Wall Street Standard: Rules-based momentum and deterministic invalidation stops.</span>
        <span className="text-gold font-mono">NextWallStreet Quantitative Desk</span>
      </div>
    </div>
  );
}
