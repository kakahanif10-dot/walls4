"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Activity, ArrowUpRight, BrainCircuit, Radar, ShieldCheck, TrendingUp } from "lucide-react";
import InstitutionalToolShell from "./tool-shell";
import type {
  LiveAiSentimentPayload,
  LiveTopSignalsPayload,
  LiveWhaleFeedPayload,
} from "@/lib/live-frontpage-data";

function formatUsdCompact(val: number): string {
  const abs = Math.abs(val);
  if (abs >= 1e9) return `$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(abs / 1e3).toFixed(1)}K`;
  return `$${abs.toFixed(0)}`;
}

function formatPriceSmart(val: number): string {
  if (!Number.isFinite(val) || val <= 0) return "$0.00";
  return `$${val.toLocaleString("en-US", {
    minimumFractionDigits: val < 1 ? 4 : 2,
    maximumFractionDigits: val < 1 ? 6 : 2,
  })}`;
}

export function WhaleAlertToolView() {
  const [data, setData] = useState<LiveWhaleFeedPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"ALL" | "ON-CHAIN ETH" | "SPOT BLOCK" | "STABLECOIN FLOW">("ALL");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/institutional-feed?tool=whale-alert", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const items = (data?.report.items ?? []).filter((it) => filter === "ALL" || it.channel === filter);

  return (
    <InstitutionalToolShell
      slug="whale-alert"
      asOf={data?.asOf}
      activeSources={data?.sources}
      loading={loading}
      onRefresh={load}
    >
      {({ isLight }) => {
        const card = isLight ? "bg-white text-slate-900" : "bg-ink-950/75 text-zinc-100";
        const rowBg = isLight ? "bg-slate-50/80 hover:bg-slate-100" : "hover:bg-ink-900/50";
        const headBg = isLight ? "bg-slate-100 text-slate-600" : "bg-ink-900/80 text-zinc-400";
        const muted = isLight ? "text-slate-500" : "text-zinc-400";
        const chipBg = isLight ? "bg-white text-slate-600 hover:bg-slate-100" : "bg-ink-950/65 text-zinc-400 hover:bg-ink-850";
        const report = data?.report;

        return (
          <div className="space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <div className={`rounded-xl p-4 ${card}`}>
                <p className={`text-[11px] uppercase tracking-wider ${muted}`}>Tracked Whale Volume</p>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums">
                  {report ? formatUsdCompact(report.totalTrackedUsd) : "—"}
                </p>
              </div>
              <div className={`rounded-xl p-4 ${card}`}>
                <p className={`text-[11px] uppercase tracking-wider ${muted}`}>Largest Single Print</p>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-emerald-400">
                  {report ? formatUsdCompact(report.largestPrintUsd) : "—"}
                </p>
              </div>
              <div className={`rounded-xl p-4 ${card}`}>
                <p className={`text-[11px] uppercase tracking-wider ${muted}`}>Net Smart-Money Bias</p>
                <p className="mt-1 font-mono text-2xl font-bold text-[#f0c979]">
                  {report?.netFlowBias ?? "—"}
                </p>
              </div>
              <div className={`rounded-xl p-4 ${card}`}>
                <p className={`text-[11px] uppercase tracking-wider ${muted}`}>ETH Head Block</p>
                <p className="mt-1 font-mono text-2xl font-bold tabular-nums">
                  {report?.ethBlockNumber ? `#${report.ethBlockNumber.toLocaleString()}` : "Live"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {(["ALL", "ON-CHAIN ETH", "SPOT BLOCK", "STABLECOIN FLOW"] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setFilter(tab)}
                  className={`rounded-xl px-3.5 py-1.5 text-xs font-mono font-semibold transition ${
                    filter === tab
                      ? "bg-[#d8ab5a]/20 text-[#f0c979]"
                      : chipBg
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className={`overflow-x-auto rounded-xl p-2 ${card}`}>
              <table className="w-full text-left text-xs border-separate border-spacing-y-1">
                <thead className={`text-[10px] uppercase tracking-wider ${headBg}`}>
                  <tr>
                    <th className="px-4 py-2.5 rounded-l-lg">Time</th>
                    <th className="px-4 py-2.5">Asset</th>
                    <th className="px-4 py-2.5">Channel</th>
                    <th className="px-4 py-2.5">Direction</th>
                    <th className="px-4 py-2.5 text-right">Size</th>
                    <th className="px-4 py-2.5 text-right">USD Value</th>
                    <th className="px-4 py-2.5 rounded-r-lg">On-Chain / Tape Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id} className={`transition ${rowBg}`}>
                      <td className={`px-4 py-3 font-mono whitespace-nowrap ${muted}`}>{item.timestamp}</td>
                      <td className="px-4 py-3 font-mono font-bold text-[#f0c979]">{item.asset}</td>
                      <td className="px-4 py-3 font-mono whitespace-nowrap">{item.channel}</td>
                      <td className="px-4 py-3 font-mono font-semibold">
                        <span
                          className={
                            item.direction === "ACCUMULATION" || item.direction === "MINT"
                              ? "text-emerald-400"
                              : item.direction === "DISTRIBUTION" || item.direction === "BURN"
                                ? "text-rose-400"
                                : "text-amber-300"
                          }
                        >
                          {item.direction}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-right whitespace-nowrap">{item.amountLabel}</td>
                      <td className="px-4 py-3 font-mono text-right font-semibold tabular-nums whitespace-nowrap">
                        {formatUsdCompact(item.usdValue)}
                      </td>
                      <td className={`px-4 py-3 leading-relaxed ${muted}`}>{item.summary}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }}
    </InstitutionalToolShell>
  );
}

export function AiSentimentToolView() {
  const [data, setData] = useState<LiveAiSentimentPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/institutional-feed?tool=ai-sentiment", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <InstitutionalToolShell
      slug="ai-sentiment"
      asOf={data?.asOf}
      activeSources={data?.sources}
      loading={loading}
      onRefresh={load}
    >
      {({ isLight }) => {
        const card = isLight ? "bg-white text-slate-900" : "bg-ink-950/75 text-zinc-100";
        const subCard = isLight ? "bg-slate-50 text-slate-900" : "bg-ink-900/70 text-zinc-100";
        const muted = isLight ? "text-slate-500" : "text-zinc-400";
        const r = data?.report;

        return (
          <div className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-12">
              <div className={`lg:col-span-5 rounded-xl p-5 space-y-4 ${card}`}>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#f0c979]">
                    <BrainCircuit className="h-4 w-4" />
                    <span>Real-Time AI Composite</span>
                  </span>
                  <span className="font-mono text-xs text-emerald-400">
                    {r ? `${r.confidencePct}% Confidence` : "Syncing..."}
                  </span>
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-5xl font-bold tabular-nums">
                    {r ? r.compositeScore : "—"}
                  </span>
                  <span className={`text-sm font-mono ${muted}`}>/ 100 · {r?.regime ?? "Loading"}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 via-amber-400 to-emerald-400"
                    style={{ width: `${r?.compositeScore ?? 50}%` }}
                  />
                </div>
                <p className="text-xs font-semibold text-[#f0c979]">{r?.stanceBias ?? ""}</p>
                <p className={`text-xs leading-relaxed ${muted}`}>{r?.deskSummary ?? ""}</p>
              </div>

              <div className={`lg:col-span-7 rounded-xl p-5 space-y-4 ${card}`}>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Activity className="h-4 w-4 text-emerald-400" />
                  <span>Live Telemetry Drivers</span>
                </h3>
                <div className="grid gap-3 sm:grid-cols-3">
                  {(r?.drivers ?? []).map((drv) => (
                    <div key={drv.label} className={`rounded-xl p-3.5 ${subCard}`}>
                      <p className={`text-[11px] ${muted}`}>{drv.label}</p>
                      <p
                        className={`mt-1.5 font-mono text-xs font-semibold ${
                          drv.tone === "bull"
                            ? "text-emerald-400"
                            : drv.tone === "bear"
                              ? "text-rose-400"
                              : "text-[#f0c979]"
                        }`}
                      >
                        {drv.value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 font-mono text-xs tabular-nums">
                  <div className={`rounded-xl p-3 ${subCard}`}>
                    <p className={`font-sans text-[11px] ${muted}`}>Equities Pulse</p>
                    <p className="mt-1 text-base font-bold">{r ? `${r.equityPulseScore}/100` : "—"}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${subCard}`}>
                    <p className={`font-sans text-[11px] ${muted}`}>Breadth (60+)</p>
                    <p className="mt-1 text-base font-bold">{r ? `${r.equityBreadthPct}%` : "—"}</p>
                  </div>
                  <div className={`rounded-xl p-3 ${subCard}`}>
                    <p className={`font-sans text-[11px] ${muted}`}>BTC 24h Flow</p>
                    <p className="mt-1 text-base font-bold">
                      {r?.btcChange24h !== null && r?.btcChange24h !== undefined
                        ? `${r.btcChange24h >= 0 ? "+" : ""}${r.btcChange24h.toFixed(2)}%`
                        : "—"}
                    </p>
                  </div>
                  <div className={`rounded-xl p-3 ${subCard}`}>
                    <p className={`font-sans text-[11px] ${muted}`}>BTC Dominance</p>
                    <p className="mt-1 text-base font-bold">
                      {r?.btcDominancePct !== null && r?.btcDominancePct !== undefined
                        ? `${r.btcDominancePct.toFixed(1)}%`
                        : "—"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }}
    </InstitutionalToolShell>
  );
}

export function TopSignalsToolView() {
  const [data, setData] = useState<LiveTopSignalsPayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/institutional-feed?tool=top-signals", { cache: "no-store" });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const signals = data?.signals ?? [];

  return (
    <InstitutionalToolShell
      slug="top-signals"
      asOf={data?.asOf}
      activeSources={data?.sources}
      loading={loading}
      onRefresh={load}
    >
      {({ isLight }) => {
        const card = isLight ? "bg-white text-slate-900 hover:bg-slate-50" : "bg-ink-950/75 text-zinc-100 hover:bg-ink-900/80";
        const rowBg = isLight ? "bg-slate-50/80 hover:bg-slate-100" : "hover:bg-ink-900/50";
        const headBg = isLight ? "bg-slate-100 text-slate-600" : "bg-ink-900/80 text-zinc-400";
        const muted = isLight ? "text-slate-500" : "text-zinc-400";

        return (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-3">
              {signals.slice(0, 3).map((sig) => (
                <Link
                  key={sig.symbol}
                  href={`/ticker/${sig.symbol}`}
                  className={`rounded-xl p-5 space-y-3 transition ${card}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-[#f0c979]">
                      SIGNAL #{sig.rank} · {sig.kind.toUpperCase()}
                    </span>
                    <span className="rounded-md bg-emerald-500/15 px-2.5 py-0.5 font-mono text-[10px] font-bold text-emerald-400">
                      {sig.stance.toUpperCase()} ({sig.score}/100)
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <div>
                      <p className="font-mono text-xl font-bold">{sig.symbol}</p>
                      <p className={`text-xs truncate max-w-[180px] ${muted}`}>{sig.name}</p>
                    </div>
                    <div className="text-right font-mono">
                      <p className="text-base font-bold tabular-nums">{formatPriceSmart(sig.price)}</p>
                      <p className={`text-xs tabular-nums ${sig.change24h >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {sig.change24h >= 0 ? "+" : ""}
                        {sig.change24h.toFixed(2)}%
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 font-mono text-[11px]">
                    <div>
                      <span className={muted}>Target: </span>
                      <strong className="text-emerald-400">{formatPriceSmart(sig.targetPrice)}</strong>
                    </div>
                    <div className="text-right">
                      <span className={muted}>Invalidation: </span>
                      <strong className="text-rose-400">{formatPriceSmart(sig.invalidationPrice)}</strong>
                    </div>
                  </div>
                  <p className={`text-[11px] leading-relaxed ${muted}`}>{sig.rationale}</p>
                </Link>
              ))}
            </div>

            <div className={`overflow-x-auto rounded-xl p-2 ${isLight ? "bg-white text-slate-900" : "bg-ink-950/75 text-zinc-100"}`}>
              <table className="w-full text-left text-xs border-separate border-spacing-y-1">
                <thead className={`text-[10px] uppercase tracking-wider ${headBg}`}>
                  <tr>
                    <th className="px-4 py-2.5 rounded-l-lg">Rank</th>
                    <th className="px-4 py-2.5">Asset</th>
                    <th className="px-4 py-2.5 text-right">Spot Price</th>
                    <th className="px-4 py-2.5 text-right">24h</th>
                    <th className="px-4 py-2.5 text-right">Score</th>
                    <th className="px-4 py-2.5">Stance</th>
                    <th className="px-4 py-2.5 text-right">Target</th>
                    <th className="px-4 py-2.5 text-right">Invalidation</th>
                    <th className="px-4 py-2.5 text-right rounded-r-lg">R:R</th>
                  </tr>
                </thead>
                <tbody>
                  {signals.map((sig) => (
                    <tr key={sig.symbol} className={`transition ${rowBg}`}>
                      <td className="px-4 py-3 font-mono font-bold text-[#f0c979]">#{sig.rank}</td>
                      <td className="px-4 py-3">
                        <Link href={`/ticker/${sig.symbol}`} className="inline-flex items-center gap-1 font-mono font-bold hover:text-[#f0c979]">
                          <span>{sig.symbol}</span>
                          <ArrowUpRight className="h-3 w-3" />
                        </Link>
                        <div className={`text-[11px] ${muted}`}>{sig.name}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-right tabular-nums">{formatPriceSmart(sig.price)}</td>
                      <td className={`px-4 py-3 font-mono text-right tabular-nums ${sig.change24h >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                        {sig.change24h >= 0 ? "+" : ""}{sig.change24h.toFixed(2)}%
                      </td>
                      <td className="px-4 py-3 font-mono text-right font-bold">{sig.score}/100</td>
                      <td className="px-4 py-3 font-mono font-semibold text-emerald-400">{sig.stance}</td>
                      <td className="px-4 py-3 font-mono text-right text-emerald-400">{formatPriceSmart(sig.targetPrice)}</td>
                      <td className="px-4 py-3 font-mono text-right text-rose-400">{formatPriceSmart(sig.invalidationPrice)}</td>
                      <td className="px-4 py-3 font-mono text-right text-[#f0c979]">{sig.riskReward}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      }}
    </InstitutionalToolShell>
  );
}
