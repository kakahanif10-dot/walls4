"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Search, ShieldAlert, ShieldCheck } from "lucide-react";
import InstitutionalToolShell from "./tool-shell";
import { formatCompactCurrency } from "@/lib/institutional-tools-data";

function useCryptoStyles(isLight: boolean) {
  return {
    card: isLight ? "bg-white text-slate-900" : "bg-ink-950/75 text-zinc-100",
    subCard: isLight ? "bg-slate-50 text-slate-900" : "bg-ink-900/65 text-zinc-100",
    muted: isLight ? "text-slate-500" : "text-zinc-400",
    input: isLight
      ? "bg-slate-50 text-slate-900 focus:ring-1 focus:ring-emerald-600/40"
      : "bg-ink-900/90 text-zinc-100 focus:ring-1 focus:ring-emerald-500/40",
    rowHover: isLight ? "hover:bg-slate-100/70" : "hover:bg-ink-900/50",
    thBg: isLight ? "bg-slate-100 text-slate-600" : "bg-ink-900/90 text-zinc-400",
  };
}

// ---------------------------------------------------------------------------
// 6. GLASSNODE & CRYPTOQUANT ON-CHAIN TELEMETRY
// ---------------------------------------------------------------------------
interface GlassnodeData {
  sources: string[];
  asOf: string;
  fees: { fastestFee: number; halfHourFee: number; hourFee: number; economyFee: number; minimumFee: number } | null;
  mempool: { count: number; vsize: number; total_fee: number } | null;
  difficulty: { progressPercent: number; difficultyChange: number; remainingBlocks: number } | null;
  currentHashrateEh: number | null;
  hashrateSeries: Array<{ date: string; ehPerSec: number }>;
  recentBlocks: Array<{ height: number; txCount: number; sizeMb: number; pool: string; feesBtc: number | null; timestamp: string }>;
  derivatives: {
    btcMarkPrice: number | null;
    btcFunding8hPct: number | null;
    btcOpenInterestUsd: number | null;
    ethMarkPrice: number | null;
    ethFunding8hPct: number | null;
  };
}

export function GlassnodeOnchainView() {
  const [data, setData] = useState<GlassnodeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/institutional-feed?tool=glassnode-onchain", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Live on-chain feed error (${res.status})`);
      }
      setData(await res.json());
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Live on-chain telemetry unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const hashrateSvg = useMemo(() => {
    const series = data?.hashrateSeries ?? [];
    if (series.length < 2) return null;
    const vals = series.map((d) => d.ehPerSec);
    const min = Math.min(...vals) * 0.98;
    const max = Math.max(...vals) * 1.02;
    const range = Math.max(1, max - min);
    const w = 520;
    const h = 110;
    const pts = series
      .map((d, i) => {
        const x = (i / (series.length - 1)) * (w - 20) + 10;
        const y = h - 12 - ((d.ehPerSec - min) / range) * (h - 24);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(" ");
    return { w, h, pts };
  }, [data]);

  return (
    <InstitutionalToolShell
      slug="glassnode-onchain"
      asOf={data?.asOf}
      activeSources={data?.sources}
      loading={loading}
      onRefresh={load}
    >
      {({ isLight }) => {
        const s = useCryptoStyles(isLight);
        return (
          <div className="space-y-5">
            {fetchError && !loading && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-rose-500/15 px-4 py-3 text-xs text-rose-300">
                <span>Live Bitcoin on-chain telemetry temporarily unavailable ({fetchError}).</span>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="rounded-lg bg-rose-500/20 px-2.5 py-1 font-medium hover:bg-rose-500/30"
                >
                  Retry
                </button>
              </div>
            )}
            {/* KPI Telemetry Strip */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className={`rounded-xl p-3.5 ${s.card}`}>
                <div className={`text-[11px] ${s.muted}`}>Network Hashrate</div>
                <div className="mt-1 font-mono text-lg font-semibold tabular-nums">
                  {data?.currentHashrateEh !== null && data?.currentHashrateEh !== undefined
                    ? `${data.currentHashrateEh.toFixed(1)} EH/s`
                    : "—"}
                </div>
              </div>
              <div className={`rounded-xl p-3.5 ${s.card}`}>
                <div className={`text-[11px] ${s.muted}`}>Mempool Pending</div>
                <div className="mt-1 font-mono text-lg font-semibold tabular-nums">
                  {data?.mempool ? data.mempool.count.toLocaleString() : "—"}
                </div>
              </div>
              <div className={`rounded-xl p-3.5 ${s.card}`}>
                <div className={`text-[11px] ${s.muted}`}>Fastest Fee Rate</div>
                <div className="mt-1 font-mono text-lg font-semibold text-amber-500 tabular-nums">
                  {data?.fees ? `${data.fees.fastestFee} sat/vB` : "—"}
                </div>
              </div>
              <div className={`rounded-xl p-3.5 ${s.card}`}>
                <div className={`text-[11px] ${s.muted}`}>Difficulty Progress</div>
                <div className="mt-1 font-mono text-lg font-semibold tabular-nums">
                  {data?.difficulty ? `${data.difficulty.progressPercent.toFixed(1)}%` : "—"}
                </div>
              </div>
              <div className={`rounded-xl p-3.5 ${s.card}`}>
                <div className={`text-[11px] ${s.muted}`}>BTC Perp Open Int.</div>
                <div className="mt-1 font-mono text-lg font-semibold text-emerald-500 tabular-nums">
                  {data?.derivatives?.btcOpenInterestUsd !== null && data?.derivatives?.btcOpenInterestUsd !== undefined
                    ? formatCompactCurrency(data.derivatives.btcOpenInterestUsd)
                    : "—"}
                </div>
              </div>
              <div className={`rounded-xl p-3.5 ${s.card}`}>
                <div className={`text-[11px] ${s.muted}`}>BTC 8h Funding</div>
                <div className="mt-1 font-mono text-lg font-semibold tabular-nums">
                  {data?.derivatives?.btcFunding8hPct !== null && data?.derivatives?.btcFunding8hPct !== undefined
                    ? `${data.derivatives.btcFunding8hPct.toFixed(4)}%`
                    : "—"}
                </div>
              </div>
            </div>

            <div className="grid gap-5 lg:grid-cols-12">
              {/* Fee Market + Hashrate Chart */}
              <div className={`lg:col-span-5 rounded-xl p-4 sm:p-5 space-y-4 ${s.card}`}>
                <h3 className="text-sm font-semibold">Bitcoin Fee Pressure &amp; Hashrate Trend</h3>
                <div className="grid grid-cols-2 gap-2.5 font-mono text-xs tabular-nums">
                  <div className={`rounded-xl p-3 ${s.subCard}`}>
                    <div className={s.muted}>Next Block</div>
                    <div className="mt-1 text-base font-semibold">
                      {data?.fees ? `${data.fees.fastestFee} sat/vB` : "—"}
                    </div>
                  </div>
                  <div className={`rounded-xl p-3 ${s.subCard}`}>
                    <div className={s.muted}>30 Min Target</div>
                    <div className="mt-1 text-base font-semibold">
                      {data?.fees ? `${data.fees.halfHourFee} sat/vB` : "—"}
                    </div>
                  </div>
                  <div className={`rounded-xl p-3 ${s.subCard}`}>
                    <div className={s.muted}>1 Hour Target</div>
                    <div className="mt-1 text-base font-semibold">
                      {data?.fees ? `${data.fees.hourFee} sat/vB` : "—"}
                    </div>
                  </div>
                  <div className={`rounded-xl p-3 ${s.subCard}`}>
                    <div className={s.muted}>Mempool Size</div>
                    <div className="mt-1 text-base font-semibold">
                      {data?.mempool ? `${(data.mempool.vsize / 1e6).toFixed(1)} vMB` : "—"}
                    </div>
                  </div>
                </div>

                {hashrateSvg && (
                  <div className={`rounded-xl p-3 ${s.subCard}`}>
                    <div className={`text-[11px] mb-1.5 ${s.muted}`}>30-Day Network Hashrate Curve (EH/s)</div>
                    <svg viewBox={`0 0 ${hashrateSvg.w} ${hashrateSvg.h}`} className="w-full h-28">
                      <path d={hashrateSvg.pts} fill="none" stroke="#10b981" strokeWidth={2} />
                    </svg>
                  </div>
                )}
              </div>

              {/* Recent Mined Blocks Table */}
              <div className={`lg:col-span-7 rounded-xl p-4 sm:p-5 space-y-3 ${s.card}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Live Bitcoin Block Settlement &amp; Miner Pool Feed</h3>
                  <span className={`font-mono text-[11px] ${s.muted}`}>Mempool.space</span>
                </div>
                <div className={`overflow-x-auto rounded-xl p-2 ${s.subCard}`}>
                  <table className="w-full text-xs font-mono tabular-nums border-separate border-spacing-y-1">
                    <thead>
                      <tr className={s.thBg}>
                        <th className="py-2 px-3 text-left font-medium rounded-l-lg">Height</th>
                        <th className="py-2 px-3 text-left font-sans font-medium">Mining Pool</th>
                        <th className="py-2 px-3 text-right font-medium">Txs</th>
                        <th className="py-2 px-3 text-right font-medium">Size</th>
                        <th className="py-2 px-3 text-right font-medium rounded-r-lg">Total Fees</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.recentBlocks ?? []).map((b) => (
                        <tr key={b.height} className={`transition-colors ${s.rowHover}`}>
                          <td className="py-2 px-3 font-semibold text-emerald-500 rounded-l-lg">#{b.height}</td>
                          <td className="py-2 px-3 font-sans">{b.pool}</td>
                          <td className="py-2 px-3 text-right">{b.txCount.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right">{b.sizeMb.toFixed(2)} MB</td>
                          <td className="py-2 px-3 text-right rounded-r-lg">
                            {b.feesBtc !== null ? `${b.feesBtc.toFixed(4)} BTC` : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      }}
    </InstitutionalToolShell>
  );
}

// ---------------------------------------------------------------------------
// 7. CHAINALYSIS & TRM LABS WALLET FORENSICS
// ---------------------------------------------------------------------------
interface ChainalysisData {
  sources: string[];
  asOf: string;
  chain: "bitcoin" | "ethereum";
  address: string;
  entityType: string;
  balanceNative: number;
  nativeUnit: string;
  txCount: number;
  unconfirmedCount: number;
  risk: {
    score: number;
    tier: "Low Risk" | "Moderate Review" | "Elevated Risk" | "High Risk Flag";
    factors: Array<{ label: string; impact: string; severity: "low" | "med" | "high" }>;
  };
  recentTxs: Array<{
    txid: string;
    confirmed: boolean;
    blockHeight: number | null;
    time: string;
    amountNative: number;
    feeDisplay: string;
  }>;
}

const SAMPLE_WALLETS = [
  { label: "BTC · Genesis Wallet", addr: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa" },
  { label: "BTC · Binance Cold Reserve", addr: "34xp4vRoCGJym3xR7yCVPFHoCNxv4Twseo" },
  { label: "ETH · Vitalik.eth", addr: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045" },
  { label: "ETH · Uniswap V2 Router", addr: "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D" },
];

export function ChainalysisAmlView() {
  const [addressInput, setAddressInput] = useState(SAMPLE_WALLETS[1].addr);
  const [data, setData] = useState<ChainalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const inspectAddress = useCallback(async (addr: string) => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(
        `/api/institutional-feed?tool=chainalysis-aml&address=${encodeURIComponent(addr.trim())}`,
        { cache: "no-store" },
      );
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `AML RPC feed error (${res.status})`);
      }
      setData(await res.json());
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Live blockchain AML RPC feed unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void inspectAddress(addressInput);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <InstitutionalToolShell
      slug="chainalysis-aml"
      asOf={data?.asOf}
      activeSources={data?.sources}
      loading={loading}
      onRefresh={() => inspectAddress(addressInput)}
    >
      {({ isLight }) => {
        const s = useCryptoStyles(isLight);
        const riskTierColor =
          data?.risk.tier === "High Risk Flag"
            ? "text-rose-500"
            : data?.risk.tier === "Elevated Risk" || data?.risk.tier === "Moderate Review"
              ? "text-amber-500"
              : "text-emerald-500";

        return (
          <div className="space-y-5">
            {fetchError && !loading && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-rose-500/15 px-4 py-3 text-xs text-rose-300">
                <span>Live address forensics RPC temporarily unavailable ({fetchError}).</span>
                <button
                  type="button"
                  onClick={() => void inspectAddress(addressInput)}
                  className="rounded-lg bg-rose-500/20 px-2.5 py-1 font-medium hover:bg-rose-500/30"
                >
                  Retry
                </button>
              </div>
            )}
            {/* Address Forensic Search Bar */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void inspectAddress(addressInput);
              }}
              className={`rounded-xl p-4 sm:p-5 space-y-3 ${s.card}`}
            >
              <div className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className={`h-4 w-4 absolute left-3 top-2.5 ${s.muted}`} aria-hidden="true" />
                  <input
                    type="text"
                    value={addressInput}
                    onChange={(e) => setAddressInput(e.target.value)}
                    aria-label="Blockchain wallet address"
                    placeholder="Paste Bitcoin (1.../3.../bc1...) or Ethereum (0x...) address..."
                    className={`w-full rounded-xl pl-9 pr-3 py-2 font-mono text-xs outline-none ${s.input}`}
                  />
                </div>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500 transition-colors whitespace-nowrap shrink-0"
                >
                  Screen Address
                </button>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {SAMPLE_WALLETS.map((w) => (
                  <button
                    key={w.addr}
                    type="button"
                    onClick={() => {
                      setAddressInput(w.addr);
                      void inspectAddress(w.addr);
                    }}
                    className={`rounded-xl px-3 py-1 text-[11px] font-medium transition-colors whitespace-nowrap shrink-0 ${
                      addressInput === w.addr
                        ? "bg-emerald-500/20 text-emerald-400"
                        : `${s.subCard} ${s.muted}`
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>
            </form>

            {/* Forensic Metrics Grid */}
            <div className="grid gap-5 lg:grid-cols-12">
              <div className={`lg:col-span-5 rounded-xl p-4 sm:p-5 space-y-4 ${s.card}`}>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className={`text-xs ${s.muted}`}>AML Heuristic Risk Score</div>
                    <div className={`mt-1 flex items-center gap-2 font-mono text-2xl font-bold tabular-nums ${riskTierColor}`}>
                      {data?.risk.tier === "Low Risk" ? (
                        <ShieldCheck className="h-6 w-6" aria-hidden="true" />
                      ) : (
                        <ShieldAlert className="h-6 w-6" aria-hidden="true" />
                      )}
                      <span>{data ? `${data.risk.score}/100 · ${data.risk.tier}` : "—"}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 font-mono text-xs tabular-nums">
                  <div className={`rounded-xl p-3 ${s.subCard}`}>
                    <div className={s.muted}>On-Chain Balance</div>
                    <div className="mt-1 text-base font-semibold">
                      {data ? `${data.balanceNative.toLocaleString(undefined, { maximumFractionDigits: 4 })} ${data.nativeUnit}` : "—"}
                    </div>
                  </div>
                  <div className={`rounded-xl p-3 ${s.subCard}`}>
                    <div className={s.muted}>Confirmed Txs</div>
                    <div className="mt-1 text-base font-semibold">
                      {data ? data.txCount.toLocaleString() : "—"}
                    </div>
                  </div>
                </div>

                <div className="pt-2 space-y-2">
                  <div className="text-xs font-semibold">Classification: {data?.entityType ?? "—"}</div>
                  {(data?.risk.factors ?? []).map((f, i) => (
                    <div key={i} className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs ${s.subCard}`}>
                      <span>{f.label}</span>
                      <span className="font-mono text-[11px] font-semibold">{f.impact}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* On-Chain Transaction Trace Table */}
              <div className={`lg:col-span-7 rounded-xl p-4 sm:p-5 space-y-3 ${s.card}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">Live Transaction Graph Trace</h3>
                  <span className={`font-mono text-[11px] ${s.muted}`}>
                    Chain: {data?.chain === "ethereum" ? "Ethereum Mainnet" : "Bitcoin UTXO"}
                  </span>
                </div>
                <div className={`overflow-x-auto rounded-xl p-2 ${s.subCard}`}>
                  <table className="w-full text-xs font-mono tabular-nums border-separate border-spacing-y-1">
                    <thead>
                      <tr className={s.thBg}>
                        <th className="py-2 px-3 text-left font-medium rounded-l-lg">Tx Hash / ID</th>
                        <th className="py-2 px-3 text-left font-medium">Block</th>
                        <th className="py-2 px-3 text-left font-medium">UTC Time</th>
                        <th className="py-2 px-3 text-right font-medium">Value ({data?.nativeUnit ?? "BTC"})</th>
                        <th className="py-2 px-3 text-right font-medium rounded-r-lg">Network Fee</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.recentTxs ?? []).map((tx) => (
                        <tr key={tx.txid} className={`transition-colors ${s.rowHover}`}>
                          <td className="py-2 px-3 text-emerald-500 rounded-l-lg">
                            {tx.txid.slice(0, 12)}…{tx.txid.slice(-6)}
                          </td>
                          <td className="py-2 px-3">{tx.blockHeight ? `#${tx.blockHeight}` : "Mempool"}</td>
                          <td className={`py-2 px-3 ${s.muted}`}>{tx.time}</td>
                          <td className="py-2 px-3 text-right">
                            {tx.amountNative.toFixed(4)} {data?.nativeUnit ?? "BTC"}
                          </td>
                          <td className={`py-2 px-3 text-right rounded-r-lg ${s.muted}`}>{tx.feeDisplay}</td>
                        </tr>
                      ))}
                      {data && data.recentTxs.length === 0 && (
                        <tr>
                          <td colSpan={5} className={`py-6 text-center font-sans ${s.muted}`}>
                            {data.chain === "ethereum"
                              ? `Ethereum RPC verified balance (${data.balanceNative.toFixed(4)} ETH), nonce (${data.txCount} txs), and ${data.entityType} state.`
                              : "No recent UTXO transactions found."}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      }}
    </InstitutionalToolShell>
  );
}

// ---------------------------------------------------------------------------
// 8. MESSARI & BLOCKWORKS PROTOCOL INTEL
// ---------------------------------------------------------------------------
interface MessariData {
  sources: string[];
  asOf: string;
  tokenomics: Array<{
    symbol: string;
    name: string;
    price: number;
    change24hPct: number;
    marketCap: number;
    fdv: number;
    floatPct: number;
    volume24h: number;
  }>;
  proposals: Array<{
    id: string;
    dao: string;
    title: string;
    state: string;
    votes: number;
    scoresTotal: number;
    endDate: string;
  }>;
}

export function MessariResearchView() {
  const [data, setData] = useState<MessariData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [govFilter, setGovFilter] = useState<"all" | "active" | "closed">("all");

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/institutional-feed?tool=messari-research", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Messari feed error (${res.status})`);
      }
      setData(await res.json());
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Live protocol tokenomics feed unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const proposals = useMemo(() => {
    return (data?.proposals ?? []).filter((p) => govFilter === "all" || p.state === govFilter);
  }, [data, govFilter]);

  return (
    <InstitutionalToolShell
      slug="messari-research"
      asOf={data?.asOf}
      activeSources={data?.sources}
      loading={loading}
      onRefresh={load}
    >
      {({ isLight }) => {
        const s = useCryptoStyles(isLight);
        return (
          <div className="space-y-4">
            {fetchError && !loading && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-rose-500/15 px-4 py-3 text-xs text-rose-300">
                <span>Live protocol intelligence temporarily unavailable ({fetchError}).</span>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="rounded-lg bg-rose-500/20 px-2.5 py-1 font-medium hover:bg-rose-500/30"
                >
                  Retry
                </button>
              </div>
            )}
          <div className="grid gap-5 lg:grid-cols-12">
            {/* Supply & FDV Schedules */}
            <div className={`lg:col-span-7 rounded-xl p-4 sm:p-5 space-y-3 ${s.card}`}>
              <h3 className="text-sm font-semibold">Token Supply Schedules &amp; Circulating vs. FDV</h3>
              <div className={`overflow-x-auto rounded-xl p-2 ${s.subCard}`}>
                <table className="w-full text-xs font-mono tabular-nums border-separate border-spacing-y-1">
                  <thead>
                    <tr className={s.thBg}>
                      <th className="py-2.5 px-3 text-left font-sans font-semibold rounded-l-lg">Asset</th>
                      <th className="py-2.5 px-3 text-right font-medium">Spot</th>
                      <th className="py-2.5 px-3 text-right font-medium">Market Cap</th>
                      <th className="py-2.5 px-3 text-right font-medium">FDV</th>
                      <th className="py-2.5 px-3 text-right font-medium rounded-r-lg">Float %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.tokenomics ?? []).map((t) => (
                      <tr key={t.symbol} className={`transition-colors ${s.rowHover}`}>
                        <td className="py-2.5 px-3 font-sans rounded-l-lg">
                          <span className="font-semibold">{t.symbol}</span>{" "}
                          <span className={s.muted}>{t.name}</span>
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          ${t.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </td>
                        <td className="py-2.5 px-3 text-right">{formatCompactCurrency(t.marketCap)}</td>
                        <td className="py-2.5 px-3 text-right">{formatCompactCurrency(t.fdv)}</td>
                        <td className="py-2.5 px-3 text-right text-emerald-500 font-semibold rounded-r-lg">
                          {t.floatPct.toFixed(1)}%
                        </td>
                      </tr>
                    ))}
                    {loading && (data?.tokenomics?.length ?? 0) === 0 && (
                      <tr>
                        <td colSpan={5} className={`py-6 text-center font-sans ${s.muted}`}>
                          Fetching token supply schedules from CoinGecko...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Live Snapshot DAO Governance */}
            <div className={`lg:col-span-5 rounded-xl p-4 sm:p-5 space-y-3 ${s.card}`}>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold">DAO Governance Proposals</h3>
                <div className="flex items-center gap-1">
                  {(["all", "active", "closed"] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setGovFilter(st)}
                      className={`rounded-lg px-2.5 py-1 text-[11px] capitalize whitespace-nowrap shrink-0 ${
                        govFilter === st
                          ? "bg-emerald-500/20 text-emerald-400"
                          : `${s.subCard} ${s.muted}`
                      }`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {proposals.map((p) => (
                  <div key={p.id} className={`rounded-xl p-3.5 text-xs space-y-1.5 ${s.subCard}`}>
                    <div className="flex items-center justify-between font-mono text-[11px]">
                      <span className="font-semibold text-emerald-500">{p.dao}</span>
                      <span className={p.state === "active" ? "text-amber-500 uppercase" : s.muted}>
                        {p.state} · Ends {p.endDate}
                      </span>
                    </div>
                    <p className="font-medium leading-snug">{p.title}</p>
                    <div className={`font-mono text-[11px] tabular-nums ${s.muted}`}>
                      {p.votes.toLocaleString()} voters · {Math.round(p.scoresTotal).toLocaleString()} voting power
                    </div>
                  </div>
                ))}
                {!loading && proposals.length === 0 && (
                  <div className={`py-6 text-center text-xs ${s.muted}`}>No governance proposals in this filter.</div>
                )}
              </div>
            </div>
          </div>
          </div>
        );
      }}
    </InstitutionalToolShell>
  );
}

// ---------------------------------------------------------------------------
// 9. NANSEN & ARKHAM SMART MONEY FLOWS
// ---------------------------------------------------------------------------
interface NansenData {
  sources: string[];
  asOf: string;
  ethBlockNumber: number;
  stablecoins: Array<{ symbol: string; name: string; supplyUsd: number; change24hUsd: number; chainsCount: number }>;
  whaleTrades: Array<{ id: string; asset: string; side: "BUY" | "SELL"; price: number; notionalUsd: number; time: string }>;
  ethWhaleTxs: Array<{ hash: string; from: string; to: string; valueEth: number }>;
}

export function NansenArkhamView() {
  const [data, setData] = useState<NansenData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/institutional-feed?tool=nansen-arkham", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Smart money feed error (${res.status})`);
      }
      setData(await res.json());
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Live smart money flow feed unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <InstitutionalToolShell
      slug="nansen-arkham"
      asOf={data?.asOf}
      activeSources={data?.sources}
      loading={loading}
      onRefresh={load}
    >
      {({ isLight }) => {
        const s = useCryptoStyles(isLight);
        return (
          <div className="space-y-4">
            {fetchError && !loading && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-rose-500/15 px-4 py-3 text-xs text-rose-300">
                <span>Live whale flow telemetry temporarily unavailable ({fetchError}).</span>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="rounded-lg bg-rose-500/20 px-2.5 py-1 font-medium hover:bg-rose-500/30"
                >
                  Retry
                </button>
              </div>
            )}
          <div className="grid gap-5 lg:grid-cols-12">
            {/* Stablecoin Liquidity Flows */}
            <div className={`lg:col-span-4 rounded-xl p-4 sm:p-5 space-y-3 ${s.card}`}>
              <h3 className="text-sm font-semibold">Stablecoin Supply &amp; 24h Net Flow</h3>
              <div className="space-y-2">
                {(data?.stablecoins ?? []).map((st) => (
                  <div
                    key={st.symbol}
                    className={`flex items-center justify-between rounded-xl px-3.5 py-2.5 font-mono text-xs tabular-nums ${s.subCard}`}
                  >
                    <div>
                      <div className="font-semibold font-sans">{st.symbol}</div>
                      <div className={`text-[10px] font-sans ${s.muted}`}>{st.chainsCount} chains</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCompactCurrency(st.supplyUsd)}</div>
                      <div className={st.change24hUsd >= 0 ? "text-emerald-500" : "text-rose-500"}>
                        {st.change24hUsd >= 0 ? "+" : ""}
                        {formatCompactCurrency(st.change24hUsd)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Exchange Whale Tape + On-Chain ETH Transfers */}
            <div className="lg:col-span-8 space-y-5">
              <div className={`rounded-xl p-4 sm:p-5 space-y-3 ${s.card}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold">
                    Live Ethereum Mainnet Whale Transfers {data?.ethBlockNumber ? `(Block #${data.ethBlockNumber.toLocaleString()})` : ""}
                  </h3>
                </div>
                <div className={`overflow-x-auto rounded-xl p-2 ${s.subCard}`}>
                  <table className="w-full text-xs font-mono tabular-nums border-separate border-spacing-y-1">
                    <thead>
                      <tr className={s.thBg}>
                        <th className="py-2 px-3 text-left font-medium rounded-l-lg">Tx Hash</th>
                        <th className="py-2 px-3 text-left font-medium">From</th>
                        <th className="py-2 px-3 text-left font-medium">To</th>
                        <th className="py-2 px-3 text-right font-medium rounded-r-lg">Value (ETH)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.ethWhaleTxs ?? []).map((tx) => (
                        <tr key={tx.hash} className={`transition-colors ${s.rowHover}`}>
                          <td className="py-2 px-3 text-emerald-500 rounded-l-lg">{tx.hash.slice(0, 12)}…</td>
                          <td className={`py-2 px-3 ${s.muted}`}>{tx.from.slice(0, 10)}…</td>
                          <td className={`py-2 px-3 ${s.muted}`}>{tx.to.slice(0, 10)}…</td>
                          <td className="py-2 px-3 text-right font-semibold rounded-r-lg">{tx.valueEth.toFixed(2)} ETH</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className={`rounded-xl p-4 sm:p-5 space-y-3 ${s.card}`}>
                <h3 className="text-sm font-semibold">Largest Live Spot Block Executions (BTC &amp; ETH)</h3>
                <div className={`overflow-x-auto rounded-xl p-2 ${s.subCard}`}>
                  <table className="w-full text-xs font-mono tabular-nums border-separate border-spacing-y-1">
                    <thead>
                      <tr className={s.thBg}>
                        <th className="py-2 px-3 text-left font-medium rounded-l-lg">Time (UTC)</th>
                        <th className="py-2 px-3 text-left font-medium">Pair</th>
                        <th className="py-2 px-3 text-left font-medium">Taker Side</th>
                        <th className="py-2 px-3 text-right font-medium">Exec Price</th>
                        <th className="py-2 px-3 text-right font-medium rounded-r-lg">Notional</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(data?.whaleTrades ?? []).map((tr) => (
                        <tr key={tr.id} className={`transition-colors ${s.rowHover}`}>
                          <td className={`py-2 px-3 rounded-l-lg ${s.muted}`}>{tr.time}</td>
                          <td className="py-2 px-3 font-semibold">{tr.asset}/USDT</td>
                          <td
                            className={`py-2 px-3 font-semibold ${
                              tr.side === "BUY" ? "text-emerald-500" : "text-rose-500"
                            }`}
                          >
                            {tr.side}
                          </td>
                          <td className="py-2 px-3 text-right">${tr.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                          <td className="py-2 px-3 text-right font-semibold rounded-r-lg">{formatCompactCurrency(tr.notionalUsd)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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

// ---------------------------------------------------------------------------
// 10. DEFILLAMA & TOKEN TERMINAL TVL + P/F VALUATION
// ---------------------------------------------------------------------------
interface DefillamaData {
  sources: string[];
  asOf: string;
  totalDeFiFees24h: number;
  totalDeFiFees30d: number;
  protocols: Array<{
    name: string;
    symbol: string;
    category: string;
    tvl: number;
    change1d: number;
    change7d: number;
    mcap: number;
    fees24h: number;
    annualizedFees: number;
    pfRatio: number | null;
    mcapTvl: number | null;
  }>;
  chains: Array<{ name: string; tvl: number; tokenSymbol?: string }>;
}

export function DefillamaTerminalView() {
  const [data, setData] = useState<DefillamaData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [cat, setCat] = useState("ALL");
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch("/api/institutional-feed?tool=defillama-terminal", { cache: "no-store" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `DeFiLlama feed error (${res.status})`);
      }
      setData(await res.json());
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Live DeFi TVL & fee feed unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const categories = useMemo(() => {
    const set = new Set<string>(["ALL"]);
    for (const p of data?.protocols ?? []) {
      if (p.category) set.add(p.category);
    }
    return Array.from(set).slice(0, 7);
  }, [data]);

  const filteredProtocols = useMemo(() => {
    return (data?.protocols ?? []).filter((p) => {
      const matchCat = cat === "ALL" || p.category === cat;
      const matchQ =
        !query.trim() ||
        p.name.toLowerCase().includes(query.toLowerCase()) ||
        p.symbol.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQ;
    });
  }, [data, cat, query]);

  return (
    <InstitutionalToolShell
      slug="defillama-terminal"
      asOf={data?.asOf}
      activeSources={data?.sources}
      loading={loading}
      onRefresh={load}
    >
      {({ isLight }) => {
        const s = useCryptoStyles(isLight);
        return (
          <div className="space-y-5">
            {fetchError && !loading && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-rose-500/15 px-4 py-3 text-xs text-rose-300">
                <span>Live DeFiLlama TVL &amp; fee feed temporarily unavailable ({fetchError}).</span>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="rounded-lg bg-rose-500/20 px-2.5 py-1 font-medium hover:bg-rose-500/30"
                >
                  Retry
                </button>
              </div>
            )}
            {/* Global Chain Dominance Strip */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {(data?.chains ?? []).slice(0, 5).map((c) => (
                <div key={c.name} className={`rounded-xl p-3.5 ${s.card}`}>
                  <div className={`text-[11px] ${s.muted}`}>{c.name} TVL</div>
                  <div className="mt-1 font-mono text-lg font-semibold text-emerald-500 tabular-nums">
                    {formatCompactCurrency(c.tvl)}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                {categories.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCat(c)}
                    className={`rounded-xl px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 ${
                      cat === c
                        ? "bg-emerald-500/20 text-emerald-400"
                        : `${s.subCard} ${s.muted}`
                    }`}
                  >
                    {c === "ALL" ? "All Categories" : c}
                  </button>
                ))}
              </div>
              <div className="relative w-full md:w-64">
                <Search className={`h-4 w-4 absolute left-3 top-2.5 ${s.muted}`} aria-hidden="true" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Filter protocols..."
                  className={`w-full rounded-xl pl-9 pr-3 py-2 text-xs outline-none ${s.input}`}
                />
              </div>
            </div>

            <div className={`overflow-x-auto rounded-xl p-2 ${s.card}`}>
              <table className="w-full text-xs font-mono tabular-nums border-separate border-spacing-y-1">
                <thead>
                  <tr className={s.thBg}>
                    <th className="py-2.5 px-3 text-left font-sans font-semibold rounded-l-lg">Protocol</th>
                    <th className="py-2.5 px-3 text-left font-sans font-semibold">Category</th>
                    <th className="py-2.5 px-3 text-right font-medium">TVL</th>
                    <th className="py-2.5 px-3 text-right font-medium">1D Chg</th>
                    <th className="py-2.5 px-3 text-right font-medium">24h Fees</th>
                    <th className="py-2.5 px-3 text-right font-medium">Ann. Fees</th>
                    <th className="py-2.5 px-3 text-right font-medium">MCap/TVL</th>
                    <th className="py-2.5 px-3 text-right font-medium rounded-r-lg">P/F Ratio</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProtocols.map((p) => (
                    <tr key={p.name} className={`transition-colors ${s.rowHover}`}>
                      <td className="py-2.5 px-3 font-sans font-semibold rounded-l-lg">
                        {p.name} <span className={`font-mono text-[10px] ${s.muted}`}>{p.symbol}</span>
                      </td>
                      <td className={`py-2.5 px-3 font-sans ${s.muted}`}>{p.category}</td>
                      <td className="py-2.5 px-3 text-right font-semibold">{formatCompactCurrency(p.tvl)}</td>
                      <td className={`py-2.5 px-3 text-right ${p.change1d >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                        {p.change1d >= 0 ? "+" : ""}
                        {p.change1d.toFixed(2)}%
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {p.fees24h > 0 ? formatCompactCurrency(p.fees24h) : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {p.annualizedFees > 0 ? formatCompactCurrency(p.annualizedFees) : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {p.mcapTvl !== null ? `${p.mcapTvl.toFixed(2)}×` : "—"}
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-500 font-semibold rounded-r-lg">
                        {p.pfRatio !== null ? `${p.pfRatio.toFixed(1)}×` : "—"}
                      </td>
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

// ---------------------------------------------------------------------------
// 11. COIN METRICS & KAIKO MULTI-VENUE ORDER BOOKS
// ---------------------------------------------------------------------------
interface KaikoData {
  sources: string[];
  asOf: string;
  symbol: string;
  compositeMid: number;
  crossVenueDispersionBps: number;
  venues: Array<{
    venue: string;
    bestBid: number;
    bestAsk: number;
    mid: number;
    spreadBps: number;
    bidDepthUsd: number;
    askDepthUsd: number;
    slip100kBps: number;
    slip500kBps: number;
    topBids: Array<{ price: number; size: number }>;
    topAsks: Array<{ price: number; size: number }>;
  }>;
}

export function CoinMetricsKaikoView() {
  const [symbol, setSymbol] = useState<"BTC" | "ETH" | "SOL">("BTC");
  const [data, setData] = useState<KaikoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const load = useCallback(async (sym: string) => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await fetch(`/api/institutional-feed?tool=coinmetrics-kaiko&symbol=${encodeURIComponent(sym)}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.error || `Orderbook feed error (${res.status})`);
      }
      setData(await res.json());
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : "Live multi-venue orderbook feed unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load(symbol);
  }, [load, symbol]);

  return (
    <InstitutionalToolShell
      slug="coinmetrics-kaiko"
      asOf={data?.asOf}
      activeSources={data?.sources}
      loading={loading}
      onRefresh={() => load(symbol)}
    >
      {({ isLight }) => {
        const s = useCryptoStyles(isLight);
        return (
          <div className="space-y-5">
            {fetchError && !loading && (
              <div className="flex items-center justify-between gap-3 rounded-xl bg-rose-500/15 px-4 py-3 text-xs text-rose-300">
                <span>Live multi-venue orderbook feed temporarily unavailable ({fetchError}).</span>
                <button
                  type="button"
                  onClick={() => void load(symbol)}
                  className="rounded-lg bg-rose-500/20 px-2.5 py-1 font-medium hover:bg-rose-500/30"
                >
                  Retry
                </button>
              </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                {(["BTC", "ETH", "SOL"] as const).map((sym) => (
                  <button
                    key={sym}
                    type="button"
                    onClick={() => setSymbol(sym)}
                    className={`rounded-xl px-3.5 py-1.5 font-mono text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      symbol === sym
                        ? "bg-emerald-500/20 text-emerald-400"
                        : `${s.subCard} ${s.muted}`
                    }`}
                  >
                    {sym}/USD
                  </button>
                ))}
              </div>

              {data && (
                <div className="flex flex-wrap items-center gap-4 font-mono text-xs tabular-nums">
                  <span>
                    Composite Ref Mid:{" "}
                    <strong className="text-emerald-500">
                      ${data.compositeMid.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </strong>
                  </span>
                  <span className={s.muted}>
                    Cross-Venue Dispersion: <strong>{data.crossVenueDispersionBps.toFixed(2)} bps</strong>
                  </span>
                </div>
              )}
            </div>

            {/* Venue Comparison Cards */}
            <div className="grid gap-4 lg:grid-cols-3">
              {(data?.venues ?? []).map((v) => (
                <div key={v.venue} className={`rounded-xl p-4 sm:p-5 space-y-3 ${s.card}`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{v.venue}</h3>
                    <span className="font-mono text-xs text-emerald-500 tabular-nums">
                      Spread {v.spreadBps.toFixed(2)} bps
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 font-mono text-xs tabular-nums">
                    <div className={`rounded-xl p-2.5 ${s.subCard}`}>
                      <div className={s.muted}>Best Bid / Ask</div>
                      <div className="mt-1 font-semibold">
                        ${v.bestBid.toFixed(2)} / ${v.bestAsk.toFixed(2)}
                      </div>
                    </div>
                    <div className={`rounded-xl p-2.5 ${s.subCard}`}>
                      <div className={s.muted}>$100K / $500K Slippage</div>
                      <div className="mt-1 font-semibold text-amber-500">
                        {v.slip100kBps.toFixed(2)} / {v.slip500kBps.toFixed(2)} bps
                      </div>
                    </div>
                  </div>

                  {/* Top L2 Book Snapshot */}
                  <div className={`rounded-xl p-2 overflow-hidden ${s.subCard}`}>
                    <table className="w-full text-[11px] font-mono tabular-nums border-separate border-spacing-y-0.5">
                      <thead>
                        <tr className={s.thBg}>
                          <th className="py-1.5 px-2.5 text-left font-medium rounded-l-md">Bid Size</th>
                          <th className="py-1.5 px-2.5 text-right font-medium text-emerald-500">Bid</th>
                          <th className="py-1.5 px-2.5 text-left font-medium text-rose-500">Ask</th>
                          <th className="py-1.5 px-2.5 text-right font-medium rounded-r-md">Ask Size</th>
                        </tr>
                      </thead>
                      <tbody>
                        {v.topBids.slice(0, 6).map((b, i) => {
                          const a = v.topAsks[i];
                          return (
                            <tr key={i} className={`transition-colors ${s.rowHover}`}>
                              <td className="py-1 px-2.5 rounded-l-md">{b.size.toFixed(3)}</td>
                              <td className="py-1 px-2.5 text-right text-emerald-500">${b.price.toFixed(2)}</td>
                              <td className="py-1 px-2.5 text-rose-500">{a ? `$${a.price.toFixed(2)}` : "—"}</td>
                              <td className="py-1 px-2.5 text-right rounded-r-md">{a ? a.size.toFixed(3) : "—"}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }}
    </InstitutionalToolShell>
  );
}

export { CryptoFearGreedView } from "./crypto-fear-greed-view";

