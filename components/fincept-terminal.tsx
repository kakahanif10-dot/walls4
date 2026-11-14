"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Terminal,
  Activity,
  ShieldAlert,
  Play,
  CheckCircle2,
  ChevronRight,
  Database,
  BarChart2,
  Ship,
  Bot,
  Check,
  Workflow,
  Globe,
  DollarSign,
} from "lucide-react";
import {
  FINCEPT_AGENTS,
  FINCEPT_DATA_CONNECTORS,
  MARITIME_CHOKEPOINTS,
  INITIAL_PAPER_POSITIONS,
  computeFinceptDCF,
  computeBlackScholesGreeks,
  executeFinceptCommand,
  type FinceptAgent,
  type FinceptLiveMacro,
  type DCFModelInputs,
  type DCFModelResult,
  type OptionsPricerInputs,
  type OptionsPricerResult,
  type PaperPosition,
  type FinceptCLIResponse,
} from "@/lib/fincept-platform";
import { ASSETS, ASSET_BY_SYMBOL, fmtPrice, metricsFor } from "@/lib/market";
import { useQuotes } from "@/components/live-prices";
import WhopBadge from "@/components/whop-badge";

type QuantDesk = "cli" | "agents" | "dcf" | "options" | "paper" | "connectors" | "node";

function getAssetLastPrice(symbol: string): number {
  const asset = ASSET_BY_SYMBOL[symbol] || ASSETS[0];
  return metricsFor(asset).last;
}

export default function FinceptTerminal() {
  const liveQuotes = useQuotes();
  const liveLastPrice = (symbol: string): number =>
    liveQuotes[symbol]?.price ?? getAssetLastPrice(symbol);

  const [activeDesk, setActiveDesk] = useState<QuantDesk>("cli");
  const [liveMacro, setLiveMacro] = useState<FinceptLiveMacro>({});

  // CLI Workstation State
  const [commandInput, setCommandInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cliLogs, setCliLogs] = useState<FinceptCLIResponse[]>([
    {
      command: "welcome",
      title: "NextWall Valuation & Agent Engine (C++20 / Embedded Python 3.11)",
      output:
        "Welcome to the NextWall Quantitative Valuation & Agent Desk.\nConnected to 100+ global financial data connectors, 37 specialized investor/macro AI allocator agents, and institutional quant pricing engines.\nType 'help' or click any command preset below to begin.",
      type: "info",
    },
  ]);
  const logEndRef = useRef<HTMLDivElement>(null);

  // Agent Lab State
  const [selectedAgent, setSelectedAgent] = useState<FinceptAgent>(FINCEPT_AGENTS[0]);
  const [agentTicker, setAgentTicker] = useState("NVDA");
  const [agentEvaluation, setAgentEvaluation] = useState(() => {
    const asset = ASSET_BY_SYMBOL["NVDA"] || ASSETS[0];
    const m = metricsFor(asset);
    return FINCEPT_AGENTS[0].evaluate("NVDA", m.last, 32.5, 0.45, 0.042, 1.35);
  });

  // DCF Valuation State (initialized from live market feed)
  const [dcfInputs, setDcfInputs] = useState<DCFModelInputs>(() => ({
    symbol: "NVDA",
    currentPrice: getAssetLastPrice("NVDA"),
    revenueBaseBillion: 115,
    growthRatePct: 40,
    terminalGrowthPct: 3.0,
    operatingMarginPct: 62,
    taxRatePct: 15.0,
    waccPct: 9.2,
    sharesOutstandingMillion: 24500,
    netDebtBillion: -18,
  }));
  const [dcfResult, setDcfResult] = useState<DCFModelResult>(() => computeFinceptDCF(dcfInputs));

  // Options Greeks State (riskFreeRatePct hydrated live from US10Y Treasury yield)
  const [optionsPriceEdited, setOptionsPriceEdited] = useState(false);
  const [optionsInputs, setOptionsInputs] = useState<OptionsPricerInputs>(() => {
    const spot = getAssetLastPrice("NVDA");
    return {
      stockPrice: spot,
      strikePrice: Math.round(spot),
      timeToExpiryDays: 30,
      riskFreeRatePct: 0,
      volatilityPct: 45.0,
    };
  });
  const [optionsResult, setOptionsResult] = useState<OptionsPricerResult>(() =>
    computeBlackScholesGreeks(optionsInputs)
  );

  // Paper Trading State
  const [cashBalance, setCashBalance] = useState(100000.0);
  const [positions, setPositions] = useState<PaperPosition[]>(INITIAL_PAPER_POSITIONS);
  const [orderSymbol, setOrderSymbol] = useState("NVDA");
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [orderShares, setOrderShares] = useState(10);
  const [orderFeedback, setOrderFeedback] = useState<string | null>(null);

  // Node Editor Active Steps State
  const [nodeSteps, setNodeSteps] = useState([
    { id: 1, title: "1. Data Ingestion", desc: "Polygon WebSocket + FRED 10Y Yield", status: "Active", active: true },
    { id: 2, title: "2. Quant Filter", desc: "20-SMA Cross + Realized Vol < 50%", status: "Active", active: true },
    { id: 3, title: "3. AI Agent Gate", desc: "Buffett Moat + Simons Momentum Score > 75", status: "Active", active: true },
    { id: 4, title: "4. Risk & Invalidation", desc: "Position Sized to 1.5% Max Portfolio Risk", status: "Active", active: true },
    { id: 5, title: "5. Execution Venue", desc: "Smart Order Routing via Broker Fix API", status: "Standby", active: false },
  ]);

  const [dcfPriceEdited, setDcfPriceEdited] = useState(false);

  useEffect(() => {
    setDcfResult(computeFinceptDCF(dcfInputs));
  }, [dcfInputs]);

  useEffect(() => {
    setOptionsResult(computeBlackScholesGreeks(optionsInputs));
  }, [optionsInputs]);

  useEffect(() => {
    if (dcfPriceEdited) return;
    const livePx = liveQuotes[dcfInputs.symbol]?.price;
    if (livePx && livePx > 0 && Math.abs(livePx - dcfInputs.currentPrice) > 0.001) {
      setDcfInputs((prev) => ({ ...prev, currentPrice: livePx }));
    }
  }, [liveQuotes, dcfInputs.symbol, dcfInputs.currentPrice, dcfPriceEdited]);

  useEffect(() => {
    if (optionsPriceEdited) return;
    const livePx = liveQuotes["NVDA"]?.price;
    if (livePx && livePx > 0 && Math.abs(livePx - optionsInputs.stockPrice) > 0.001) {
      setOptionsInputs((prev) => ({
        ...prev,
        stockPrice: livePx,
        strikePrice: Math.round(livePx),
      }));
    }
  }, [liveQuotes, optionsInputs.stockPrice, optionsPriceEdited]);

  useEffect(() => {
    let active = true;
    fetch("/api/live-terminal-data?view=macro-perps", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        const curve = Array.isArray(data.yieldCurve)
          ? (data.yieldCurve as Array<{ tenor: string; rate: number }>)
          : [];
        const y10 = curve.find((p) => p.tenor === "10Y")?.rate ?? null;
        const y2 = curve.find((p) => p.tenor === "2Y")?.rate ?? null;
        const spreadBps = y10 != null && y2 != null ? Math.round((y10 - y2) * 100) : null;
        setLiveMacro({
          us10y: y10,
          us2y: y2,
          spreadBps,
          dxy: typeof data.dxy === "number" ? data.dxy : null,
        });
        if (y10 && y10 > 0) {
          setOptionsInputs((prev) => ({ ...prev, riskFreeRatePct: Number(y10.toFixed(2)) }));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const asset = ASSET_BY_SYMBOL[agentTicker] || ASSETS[0];
    const m = metricsFor(asset);
    const liveSpot = liveQuotes[asset.symbol]?.price ?? m.last;
    setAgentEvaluation(selectedAgent.evaluate(asset.symbol, liveSpot, 32.5, m.vol, 0.042, 1.35));
  }, [selectedAgent, agentTicker, liveQuotes]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [cliLogs]);

  const handleRunCommand = (cmdToRun?: string) => {
    const target = cmdToRun !== undefined ? cmdToRun : commandInput;
    if (!target.trim()) return;

    if (target.trim().toLowerCase() === "clear") {
      setCliLogs([]);
      setCommandInput("");
      return;
    }

    const res = executeFinceptCommand(target, liveQuotes, liveMacro);
    setCliLogs((prev) => [...prev, res]);
    setCommandHistory((prev) => [...prev, target]);
    setHistoryIndex(-1);
    setCommandInput("");
  };

  const handleExecutePaperOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const asset = ASSET_BY_SYMBOL[orderSymbol] || ASSETS[0];
    const lastPrice = liveLastPrice(asset.symbol);
    const cost = orderShares * lastPrice;

    if (orderSide === "BUY") {
      if (cost > cashBalance) {
        setOrderFeedback("Insufficient cash balance for this order.");
        return;
      }
      setCashBalance((prev) => prev - cost);
      setPositions((prev) => {
        const existing = prev.find((p) => p.symbol === asset.symbol && p.side === "BUY");
        if (existing) {
          const totalShares = existing.shares + orderShares;
          const avgPrice = (existing.shares * existing.entryPrice + cost) / totalShares;
          return prev.map((p) =>
            p.symbol === asset.symbol && p.side === "BUY"
              ? {
                  ...p,
                  shares: totalShares,
                  entryPrice: avgPrice,
                  currentPrice: lastPrice,
                  unrealizedPnL: (lastPrice - avgPrice) * totalShares,
                  unrealizedPnLPct: ((lastPrice - avgPrice) / avgPrice) * 100,
                }
              : p
          );
        }
        return [
          ...prev,
          {
            symbol: asset.symbol,
            assetName: asset.name,
            side: "BUY",
            shares: orderShares,
            entryPrice: lastPrice,
            currentPrice: lastPrice,
            unrealizedPnL: 0,
            unrealizedPnLPct: 0,
            timestamp: "Just now",
          },
        ];
      });
      setOrderFeedback(`Order Filled: Bought ${orderShares} $${asset.symbol} at ${fmtPrice(lastPrice)}`);
    } else {
      setCashBalance((prev) => prev + cost);
      setPositions((prev) =>
        prev.filter((p) => !(p.symbol === asset.symbol && p.shares <= orderShares))
      );
      setOrderFeedback(`Order Filled: Sold ${orderShares} $${asset.symbol} at ${fmtPrice(lastPrice)}`);
    }
  };

  const totalPositionsValue = positions.reduce(
    (acc, p) => acc + p.shares * liveLastPrice(p.symbol),
    0
  );
  const totalPortfolioValue = cashBalance + totalPositionsValue;
  const totalUnrealizedPnL = positions.reduce(
    (acc, p) => acc + (liveLastPrice(p.symbol) - p.entryPrice) * p.shares,
    0
  );

  return (
    <div className="space-y-8 text-[#f2efe8]">
      {/* Top Quant Valuation & Agents Banner */}
      <div className="rounded-2xl border border-[#d8ab5a]/25 bg-gradient-to-b from-[#0d1017]/95 to-[#06080d]/95 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/[0.08] pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#d8ab5a]/10 border border-[#d8ab5a]/35 px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[#f0c979]">
                <Terminal className="h-3.5 w-3.5 text-[#d8ab5a]" />
                VALUATION &amp; AGENT ENGINE · C++20 / PYTHON 3.11
              </span>
              <span className="rounded-md bg-white/[0.04] border border-white/10 px-2 py-0.5 text-[10px] font-mono text-stone-300">
                DCF · GREEKS · 37 ALLOCATORS
              </span>
              <WhopBadge size="xs" />
            </div>
            <h2 className="mt-2.5 text-2xl sm:text-3xl font-display font-medium text-[#f2efe8] tracking-tight">
              AI Allocator Agents, DCF &amp; Options Greeks Suite
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-stone-400 max-w-3xl leading-relaxed">
              Deterministic multi-agent allocator lab (Buffett, Munger, Soros, Dalio, Simons frameworks), interactive 5-year DCF intrinsic value calculator, Black-Scholes options Greeks, 100+ global macro connectors, paper execution ledger, and visual node strategy builder.
            </p>
          </div>

          {/* Quick Platform Telemetry */}
          <div className="rounded-xl border border-white/[0.08] bg-[#080a0f]/90 p-4 max-w-md w-full shrink-0">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-stone-400">Core Runtime:</span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Low-Latency Quant Core
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-mono border-t border-white/[0.07] pt-2">
              <span className="text-stone-400">AI Agents Suite:</span>
              <span className="text-[#f0c979]">37 Research &amp; Investor Desks</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-mono border-t border-white/[0.07] pt-2">
              <span className="text-stone-400">Data Connectivity:</span>
              <span className="text-emerald-400">100+ Feeds (FRED, IMF, EDGAR, Kraken)</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-mono border-t border-white/[0.07] pt-2 tabular-nums">
              <span className="text-stone-400">Virtual Portfolio:</span>
              <span className="text-[#f2efe8] font-bold">{fmtPrice(totalPortfolioValue)}</span>
            </div>
          </div>
        </div>

        {/* 7 Core Desk Navigation Tabs */}
        <div className="mt-6 flex flex-wrap gap-2 rounded-xl border border-white/[0.07] bg-[#080a0f]/90 p-1.5">
          {[
            { id: "cli", label: "CLI Shell (<GO>)", icon: Terminal },
            { id: "agents", label: "37 AI Agents Lab", icon: Bot },
            { id: "dcf", label: "DCF Valuation Engine", icon: BarChart2 },
            { id: "options", label: "Options & Greeks", icon: Activity },
            { id: "paper", label: "Paper Trading & Execution", icon: DollarSign },
            { id: "connectors", label: "100+ Data Feeds & Chokepoints", icon: Globe },
            { id: "node", label: "Visual Strategy Nodes", icon: Workflow },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeDesk === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveDesk(tab.id as QuantDesk)}
                className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition-all ${
                  active
                    ? "bg-gradient-to-r from-[#d8ab5a] to-[#f0c979] text-[#050609] font-semibold shadow-[0_4px_16px_rgba(216,171,90,0.22)]"
                    : "text-stone-400 hover:bg-white/[0.04] hover:text-[#f2efe8]"
                }`}
              >
                <Icon className={`h-4 w-4 ${active ? "text-[#050609]" : "text-[#d8ab5a]"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* DESK 1: CLI WORKSTATION */}
      {activeDesk === "cli" && (
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/[0.08] bg-[#090c12] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.5)]">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.07] pb-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#d8ab5a]" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
                <span className="ml-2 font-mono text-xs text-[#f0c979] font-semibold">
                  quant@nextwallstreet:~#
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-mono text-stone-400 mr-1">Quick Commands:</span>
                {[
                  "agent buffett NVDA",
                  "agent simons BTC",
                  "dcf AAPL",
                  "options TSLA 250",
                  "macro",
                  "chokepoint",
                  "connectors",
                ].map((cmd) => (
                  <button
                    key={cmd}
                    onClick={() => handleRunCommand(cmd)}
                    className="rounded-md bg-white/[0.04] border border-[#d8ab5a]/25 px-2 py-0.5 text-[10px] font-mono text-[#f0c979] hover:bg-[#d8ab5a] hover:text-[#050609] transition"
                  >
                    {cmd}
                  </button>
                ))}
                <button
                  onClick={() => setCliLogs([])}
                  className="rounded-md border border-white/10 bg-[#050609] px-2 py-0.5 text-[10px] font-mono text-stone-400 hover:text-[#f2efe8]"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Terminal Output Log Area */}
            <div className="mt-4 max-h-[520px] min-h-[380px] overflow-y-auto space-y-4 font-mono text-xs pr-2">
              {cliLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-white/[0.07] bg-[#050609] p-4 transition-all"
                >
                  <div className="flex items-center justify-between text-stone-500 text-[11px] border-b border-white/[0.06] pb-2">
                    <span className="text-[#f0c979] flex items-center gap-1 font-bold">
                      <ChevronRight className="h-3 w-3 text-[#d8ab5a]" />
                      {log.command}
                    </span>
                    <span className="text-stone-400">{log.title}</span>
                  </div>
                  <pre className="mt-3 whitespace-pre-wrap font-mono text-stone-200 leading-relaxed text-xs">
                    {log.output}
                  </pre>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>

            {/* Terminal Input Line */}
            <div className="mt-4 flex items-center gap-2 rounded-xl border border-[#d8ab5a]/35 bg-[#050609] px-4 py-2.5">
              <span className="font-mono text-sm font-bold text-[#f0c979]">$</span>
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleRunCommand();
                  } else if (e.key === "ArrowUp") {
                    if (commandHistory.length > 0) {
                      const next = historyIndex + 1 < commandHistory.length ? historyIndex + 1 : historyIndex;
                      setHistoryIndex(next);
                      setCommandInput(commandHistory[commandHistory.length - 1 - next] || "");
                    }
                  } else if (e.key === "ArrowDown") {
                    if (historyIndex > 0) {
                      const next = historyIndex - 1;
                      setHistoryIndex(next);
                      setCommandInput(commandHistory[commandHistory.length - 1 - next] || "");
                    } else if (historyIndex === 0) {
                      setHistoryIndex(-1);
                      setCommandInput("");
                    }
                  }
                }}
                placeholder="Type command (e.g. 'agent buffett NVDA', 'dcf TSLA', 'options AAPL 250', 'macro', 'help')..."
                className="w-full bg-transparent font-mono text-xs text-[#f2efe8] placeholder-stone-500 focus:outline-none"
              />
              <button
                onClick={() => handleRunCommand()}
                className="shrink-0 rounded-lg bg-gradient-to-r from-[#d8ab5a] to-[#f0c979] px-3.5 py-1.5 font-mono text-xs font-bold text-[#050609] hover:brightness-110 transition"
              >
                Execute &lt;GO&gt;
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESK 2: 37 AI AGENTS LAB */}
      {activeDesk === "agents" && (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1.7fr]">
          {/* Agent Selection Grid */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#090c12] p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
              <div>
                <h3 className="font-display text-base font-medium text-[#f2efe8] flex items-center gap-2">
                  <Bot className="h-4 w-4 text-[#d8ab5a]" />
                  Select Research Agent (37 Frameworks)
                </h3>
                <p className="text-xs text-stone-400">
                  Modeled on institutional capital allocator frameworks
                </p>
              </div>
              <span className="rounded bg-[#d8ab5a]/10 border border-[#d8ab5a]/30 px-2 py-0.5 text-[10px] font-mono text-[#f0c979]">
                Multi-Agent Active
              </span>
            </div>

            <div className="space-y-2 max-h-[580px] overflow-y-auto pr-1">
              {FINCEPT_AGENTS.map((agent) => {
                const isSelected = selectedAgent.id === agent.id;
                return (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent)}
                    className={`w-full text-left rounded-xl p-3.5 transition-all border ${
                      isSelected
                        ? "border-[#d8ab5a]/60 bg-[#d8ab5a]/[0.09] shadow-md"
                        : "border-white/[0.07] bg-[#050609] hover:border-white/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="text-xl">{agent.avatar}</span>
                        <div>
                          <div className="font-mono text-sm font-bold text-[#f2efe8] flex items-center gap-2">
                            <span>{agent.name}</span>
                            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-mono text-[#f0c979]">
                              {agent.archetype}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-400 line-clamp-1">{agent.title}</p>
                        </div>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-[#f0c979] shrink-0" />}
                    </div>
                    <p className="mt-2 text-[11px] text-stone-300 line-clamp-2 leading-relaxed">
                      {agent.framework}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agent Deep Audit & Synthesis */}
          <div className="rounded-2xl border border-[#d8ab5a]/25 bg-[#090c12] p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedAgent.avatar}</span>
                <div>
                  <h3 className="font-display text-xl font-medium text-[#f2efe8] flex items-center gap-2">
                    <span>{selectedAgent.name}</span>
                    <span className="rounded-full bg-[#d8ab5a]/15 border border-[#d8ab5a]/35 px-2.5 py-0.5 text-[10px] text-[#f0c979] font-mono">
                      {selectedAgent.archetype} Desk
                    </span>
                  </h3>
                  <p className="text-xs text-stone-400">{selectedAgent.title}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-stone-400">Target Asset:</span>
                <select
                  value={agentTicker}
                  onChange={(e) => setAgentTicker(e.target.value)}
                  className="rounded-lg border border-[#d8ab5a]/35 bg-[#050609] px-3 py-1.5 font-mono text-xs text-[#f0c979] focus:outline-none"
                >
                  {ASSETS.slice(0, 16).map((a) => (
                    <option key={a.symbol} value={a.symbol}>
                      ${a.symbol} — {a.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Stance & Conviction Dial */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 tabular-nums">
              <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-3.5">
                <span className="text-[10px] font-mono uppercase text-stone-400">Agent Stance</span>
                <p className="mt-1 font-mono text-lg font-bold text-emerald-400">
                  {agentEvaluation.stance}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-3.5">
                <span className="text-[10px] font-mono uppercase text-stone-400">Conviction</span>
                <p className="mt-1 font-mono text-lg font-bold text-[#f0c979]">
                  {agentEvaluation.conviction} / 100
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-3.5">
                <span className="text-[10px] font-mono uppercase text-stone-400">Spot Price</span>
                <p className="mt-1 font-mono text-lg font-bold text-[#f2efe8]">
                  {fmtPrice(liveLastPrice(agentTicker))}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-3.5">
                <span className="text-[10px] font-mono uppercase text-stone-400">Framework Focus</span>
                <p className="mt-1 font-mono text-xs font-bold text-[#f0c979] truncate">
                  {selectedAgent.keyMetrics.slice(0, 2).join(", ")}
                </p>
              </div>
            </div>

            {/* Core Thesis Card */}
            <div className="rounded-xl border border-[#d8ab5a]/25 bg-[#d8ab5a]/[0.04] p-5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#f0c979]">
                Deterministic Allocator Thesis
              </span>
              <p className="mt-2 text-xs sm:text-sm text-stone-200 leading-relaxed">
                {agentEvaluation.thesis}
              </p>
              <div className="mt-4 border-t border-white/[0.08] pt-3 flex items-center justify-between text-[11px] text-stone-400 italic">
                <span>&ldquo;{selectedAgent.quote}&rdquo;</span>
                <span className="text-[#f0c979] font-semibold">— {selectedAgent.name}</span>
              </div>
            </div>

            {/* Catalysts vs Hazards */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/15 p-4">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Identified Catalysts
                </span>
                <ul className="mt-3 space-y-2">
                  {agentEvaluation.catalysts.map((cat, i) => (
                    <li key={i} className="text-xs text-stone-300 flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">•</span>
                      <span>{cat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-rose-500/25 bg-rose-950/15 p-4">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Key Hazards &amp; Invalidation
                </span>
                <ul className="mt-3 space-y-2">
                  {agentEvaluation.risks.map((risk, i) => (
                    <li key={i} className="text-xs text-stone-300 flex items-start gap-2">
                      <span className="text-rose-400 font-bold">!</span>
                      <span>{risk}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <button
                onClick={() => {
                  handleRunCommand(`agent ${selectedAgent.id} ${agentTicker}`);
                  setActiveDesk("cli");
                }}
                className="rounded-lg bg-gradient-to-r from-[#d8ab5a] to-[#f0c979] px-4 py-2 font-mono text-xs font-bold text-[#050609] hover:brightness-110 transition"
              >
                Send to Quant CLI &lt;GO&gt;
              </button>
              <button
                onClick={() => {
                  setOrderSymbol(agentTicker);
                  setActiveDesk("paper");
                }}
                className="rounded-lg border border-[#d8ab5a]/35 bg-[#050609] px-4 py-2 font-mono text-xs text-[#f0c979] hover:bg-white/[0.04]"
              >
                Route to Paper Trading Floor →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DESK 3: DCF VALUATION ENGINE */}
      {activeDesk === "dcf" && (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1.6fr]">
          {/* DCF Parameter Controls */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#090c12] p-6 space-y-5">
            <div className="border-b border-white/[0.07] pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-medium text-[#f2efe8] flex items-center gap-2">
                  <BarChart2 className="h-4 w-4 text-[#d8ab5a]" />
                  Discounted Cash Flow (DCF) Inputs
                </h3>
                <p className="text-xs text-stone-400">
                  Gordon Growth Model &amp; 5-Year Explicit Horizon
                </p>
              </div>
              <select
                value={dcfInputs.symbol}
                onChange={(e) => {
                  const s = e.target.value;
                  setDcfPriceEdited(false);
                  setDcfInputs((prev) => ({
                    ...prev,
                    symbol: s,
                    currentPrice: liveLastPrice(s),
                    revenueBaseBillion: s === "NVDA" ? 115 : s === "AAPL" ? 395 : s === "MSFT" ? 245 : 60,
                    growthRatePct: s === "NVDA" ? 38 : s === "AAPL" ? 10 : 18,
                  }));
                }}
                className="rounded-lg border border-[#d8ab5a]/35 bg-[#050609] px-3 py-1 font-mono text-xs text-[#f0c979]"
              >
                {["NVDA", "AAPL", "MSFT", "AMZN", "GOOGL", "META", "TSLA"].map((sym) => (
                  <option key={sym} value={sym}>
                    ${sym}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-4 tabular-nums">
              <div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-stone-300">Revenue Base ($B):</span>
                  <span className="text-[#f0c979] font-bold">${dcfInputs.revenueBaseBillion}B</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="600"
                  step="5"
                  value={dcfInputs.revenueBaseBillion}
                  onChange={(e) =>
                    setDcfInputs((prev) => ({ ...prev, revenueBaseBillion: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-[#d8ab5a] mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-stone-300">5-Yr Revenue CAGR (%):</span>
                  <span className="text-[#f0c979] font-bold">{dcfInputs.growthRatePct}%</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="70"
                  step="1"
                  value={dcfInputs.growthRatePct}
                  onChange={(e) =>
                    setDcfInputs((prev) => ({ ...prev, growthRatePct: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-[#d8ab5a] mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-stone-300">Operating Margin (%):</span>
                  <span className="text-[#f0c979] font-bold">{dcfInputs.operatingMarginPct}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="75"
                  step="1"
                  value={dcfInputs.operatingMarginPct}
                  onChange={(e) =>
                    setDcfInputs((prev) => ({ ...prev, operatingMarginPct: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-[#d8ab5a] mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-stone-300">Discount Rate (WACC %):</span>
                  <span className="text-[#f0c979] font-bold">{dcfInputs.waccPct}%</span>
                </div>
                <input
                  type="range"
                  min="6"
                  max="16"
                  step="0.1"
                  value={dcfInputs.waccPct}
                  onChange={(e) =>
                    setDcfInputs((prev) => ({ ...prev, waccPct: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-[#d8ab5a] mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-stone-300">Terminal Growth Rate (%):</span>
                  <span className="text-[#f0c979] font-bold">{dcfInputs.terminalGrowthPct}%</span>
                </div>
                <input
                  type="range"
                  min="1.5"
                  max="5.0"
                  step="0.1"
                  value={dcfInputs.terminalGrowthPct}
                  onChange={(e) =>
                    setDcfInputs((prev) => ({ ...prev, terminalGrowthPct: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-[#d8ab5a] mt-1"
                />
              </div>
            </div>
          </div>

          {/* DCF Output Waterfall & Valuation */}
          <div className="rounded-2xl border border-[#d8ab5a]/25 bg-[#090c12] p-6 space-y-6 tabular-nums">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase text-stone-400">
                  Target Valuation Output
                </span>
                <h3 className="font-mono text-2xl font-bold text-[#f2efe8] flex items-center gap-2">
                  <span>${dcfInputs.symbol} Intrinsic Value:</span>
                  <span className="text-[#f0c979] font-extrabold">
                    ${dcfResult.fairValuePerShare.toFixed(2)}
                  </span>
                </h3>
              </div>
              <div className="text-right font-mono">
                <span className="text-[10px] uppercase text-stone-400">Current Market Price</span>
                <p className="text-sm font-bold text-stone-200">${dcfInputs.currentPrice.toFixed(2)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div
                className={`rounded-xl border p-4 font-mono ${
                  dcfResult.upsideDownsidePct >= 0
                    ? "border-emerald-500/35 bg-emerald-950/15"
                    : "border-rose-500/35 bg-rose-950/15"
                }`}
              >
                <span className="text-[10px] uppercase text-stone-400">Valuation Spread</span>
                <p
                  className={`mt-1 text-2xl font-bold ${
                    dcfResult.upsideDownsidePct >= 0 ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {dcfResult.upsideDownsidePct >= 0 ? "+" : ""}
                  {dcfResult.upsideDownsidePct}%
                </p>
                <span className="text-[11px] text-stone-400">
                  {dcfResult.upsideDownsidePct >= 0 ? "Trading at a discount" : "Trading at a premium"}
                </span>
              </div>

              <div className="rounded-xl border border-[#d8ab5a]/30 bg-[#d8ab5a]/[0.07] p-4 font-mono">
                <span className="text-[10px] uppercase text-stone-400">Margin of Safety</span>
                <p className="mt-1 text-2xl font-bold text-[#f0c979]">
                  {dcfResult.marginOfSafetyPct}%
                </p>
                <span className="text-[11px] text-stone-400">Benjamin Graham threshold</span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#f0c979]">
                5-Year Projected Cash Flow Waterfall ($B)
              </span>
              <div className="mt-2 overflow-x-auto rounded-xl border border-white/[0.08]">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#050609] text-stone-400">
                    <tr>
                      <th className="px-3 py-2">Year</th>
                      <th className="px-3 py-2">Revenue</th>
                      <th className="px-3 py-2">Free Cash Flow</th>
                      <th className="px-3 py-2">Discounted PV</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05] bg-[#080a0f]">
                    {dcfResult.projectedFCF.map((fcf) => (
                      <tr key={fcf.year}>
                        <td className="px-3 py-2 text-[#f0c979]">Year {fcf.year}</td>
                        <td className="px-3 py-2 text-[#f2efe8]">${fcf.revenue}B</td>
                        <td className="px-3 py-2 text-emerald-400 font-bold">${fcf.fcf}B</td>
                        <td className="px-3 py-2 text-stone-300">${fcf.pv}B</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="rounded-xl border border-white/[0.08] bg-[#050609] p-4 font-mono text-xs space-y-1.5 text-stone-300">
              <div className="flex justify-between">
                <span>PV of Explicit 5-Year FCF:</span>
                <span className="text-[#f2efe8] font-bold">${dcfResult.pvExplicitFCF}B</span>
              </div>
              <div className="flex justify-between">
                <span>PV of Terminal Value (Gordon Growth):</span>
                <span className="text-[#f2efe8] font-bold">${dcfResult.pvTerminalValue}B</span>
              </div>
              <div className="flex justify-between border-t border-white/[0.08] pt-1.5">
                <span>Implied Enterprise Value (EV):</span>
                <span className="text-[#f0c979] font-bold">${dcfResult.enterpriseValue}B</span>
              </div>
              <div className="flex justify-between">
                <span>Net Debt (Net Cash):</span>
                <span className="text-emerald-400 font-bold">${dcfInputs.netDebtBillion}B</span>
              </div>
              <div className="flex justify-between border-t border-white/[0.08] pt-1.5 text-sm">
                <span className="font-bold text-[#f2efe8]">Implied Equity Value:</span>
                <span className="text-[#f0c979] font-bold">${dcfResult.equityValue}B</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DESK 4: OPTIONS & GREEKS */}
      {activeDesk === "options" && (
        <div className="grid gap-6 lg:grid-cols-[1.3fr_1.7fr]">
          <div className="rounded-2xl border border-white/[0.08] bg-[#090c12] p-6 space-y-5">
            <div className="border-b border-white/[0.07] pb-3">
              <h3 className="font-display text-base font-medium text-[#f2efe8] flex items-center gap-2">
                <Activity className="h-4 w-4 text-[#d8ab5a]" />
                Black-Scholes Options Pricer
              </h3>
              <p className="text-xs text-stone-400">
                Continuous log-normal price diffusion &amp; Greek sensitivities
              </p>
            </div>

            <div className="space-y-4 font-mono text-xs tabular-nums">
              <div>
                <div className="flex justify-between">
                  <span className="text-stone-300">Stock Price ($):</span>
                  <span className="text-[#f0c979] font-bold">${optionsInputs.stockPrice}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="600"
                  step="1"
                  value={optionsInputs.stockPrice}
                  onChange={(e) => {
                    setOptionsPriceEdited(true);
                    setOptionsInputs((prev) => ({ ...prev, stockPrice: parseFloat(e.target.value) }));
                  }}
                  className="w-full accent-[#d8ab5a] mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between">
                  <span className="text-stone-300">Strike Price ($):</span>
                  <span className="text-[#f0c979] font-bold">${optionsInputs.strikePrice}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="600"
                  step="1"
                  value={optionsInputs.strikePrice}
                  onChange={(e) =>
                    setOptionsInputs((prev) => ({ ...prev, strikePrice: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-[#d8ab5a] mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between">
                  <span className="text-stone-300">Days to Expiry (DTE):</span>
                  <span className="text-[#f0c979] font-bold">{optionsInputs.timeToExpiryDays} days</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="365"
                  step="1"
                  value={optionsInputs.timeToExpiryDays}
                  onChange={(e) =>
                    setOptionsInputs((prev) => ({
                      ...prev,
                      timeToExpiryDays: parseInt(e.target.value, 10),
                    }))
                  }
                  className="w-full accent-[#d8ab5a] mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between">
                  <span className="text-stone-300">Implied Volatility (%):</span>
                  <span className="text-[#f0c979] font-bold">{optionsInputs.volatilityPct}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="150"
                  step="1"
                  value={optionsInputs.volatilityPct}
                  onChange={(e) =>
                    setOptionsInputs((prev) => ({ ...prev, volatilityPct: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-[#d8ab5a] mt-1"
                />
              </div>

              <div>
                <div className="flex justify-between">
                  <span className="text-stone-300">Risk-Free Rate (%):</span>
                  <span className="text-[#f0c979] font-bold">{optionsInputs.riskFreeRatePct}%</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="7.0"
                  step="0.1"
                  value={optionsInputs.riskFreeRatePct}
                  onChange={(e) =>
                    setOptionsInputs((prev) => ({
                      ...prev,
                      riskFreeRatePct: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-[#d8ab5a] mt-1"
                />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#d8ab5a]/25 bg-[#090c12] p-6 space-y-6 tabular-nums">
            <div className="border-b border-white/[0.08] pb-4">
              <span className="text-[10px] font-mono uppercase text-stone-400">
                Options Valuation Output
              </span>
              <div className="mt-2 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-emerald-500/35 bg-emerald-950/15 p-4 font-mono">
                  <span className="text-xs text-emerald-400 font-bold uppercase">Call Premium</span>
                  <p className="mt-1 text-3xl font-extrabold text-[#f2efe8]">
                    ${optionsResult.callPrice.toFixed(2)}
                  </p>
                  <span className="text-[11px] text-stone-400">
                    Delta: +{optionsResult.callDelta}
                  </span>
                </div>

                <div className="rounded-xl border border-rose-500/35 bg-rose-950/15 p-4 font-mono">
                  <span className="text-xs text-rose-400 font-bold uppercase">Put Premium</span>
                  <p className="mt-1 text-3xl font-extrabold text-[#f2efe8]">
                    ${optionsResult.putPrice.toFixed(2)}
                  </p>
                  <span className="text-[11px] text-stone-400">
                    Delta: {optionsResult.putDelta}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#f0c979]">
                The Greeks Analytical Sensitivities
              </span>
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-3 font-mono text-xs">
                <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-3">
                  <span className="text-stone-400">Delta (&Delta;)</span>
                  <p className="mt-1 text-sm font-bold text-[#f2efe8]">
                    Call: {optionsResult.callDelta}
                  </p>
                  <span className="text-[10px] text-stone-500">Hedge ratio</span>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-3">
                  <span className="text-stone-400">Gamma (&Gamma;)</span>
                  <p className="mt-1 text-sm font-bold text-[#f0c979]">
                    {optionsResult.gamma}
                  </p>
                  <span className="text-[10px] text-stone-500">Delta curvature</span>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-3">
                  <span className="text-stone-400">Vega (&nu;)</span>
                  <p className="mt-1 text-sm font-bold text-emerald-400">
                    ${optionsResult.vega}
                  </p>
                  <span className="text-[10px] text-stone-500">Per 1% IV shift</span>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-3">
                  <span className="text-stone-400">Theta (&Theta;)</span>
                  <p className="mt-1 text-sm font-bold text-rose-400">
                    -${Math.abs(optionsResult.thetaCall)}/d
                  </p>
                  <span className="text-[10px] text-stone-500">Daily time decay</span>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-3">
                  <span className="text-stone-400">Rho (&rho;)</span>
                  <p className="mt-1 text-sm font-bold text-stone-200">
                    +${optionsResult.rhoCall}
                  </p>
                  <span className="text-[10px] text-stone-500">Per 1% rate shift</span>
                </div>
                <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-3">
                  <span className="text-stone-400">Moneyness</span>
                  <p className="mt-1 text-sm font-bold text-[#f0c979]">
                    {optionsInputs.stockPrice > optionsInputs.strikePrice
                      ? "ITM (In-The-Money)"
                      : optionsInputs.stockPrice === optionsInputs.strikePrice
                      ? "ATM (At-The-Money)"
                      : "OTM (Out-of-Money)"}
                  </p>
                  <span className="text-[10px] text-stone-500">Strike relation</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DESK 5: PAPER TRADING & EXECUTION */}
      {activeDesk === "paper" && (
        <div className="space-y-6 tabular-nums">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="rounded-2xl border border-white/[0.08] bg-[#090c12] p-4 font-mono">
              <span className="text-[10px] uppercase text-stone-400">Total Portfolio Net Worth</span>
              <p className="mt-1 text-2xl font-bold text-[#f2efe8]">{fmtPrice(totalPortfolioValue)}</p>
              <span className="text-[11px] text-stone-500">Initial: $100,000.00</span>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-[#090c12] p-4 font-mono">
              <span className="text-[10px] uppercase text-stone-400">Cash Purchasing Power</span>
              <p className="mt-1 text-2xl font-bold text-[#f0c979]">{fmtPrice(cashBalance)}</p>
              <span className="text-[11px] text-stone-500">Unsettled Cash: $0.00</span>
            </div>
            <div className="rounded-2xl border border-white/[0.08] bg-[#090c12] p-4 font-mono">
              <span className="text-[10px] uppercase text-stone-400">Invested Long Equities</span>
              <p className="mt-1 text-2xl font-bold text-stone-200">{fmtPrice(totalPositionsValue)}</p>
              <span className="text-[11px] text-stone-500">{positions.length} Active Positions</span>
            </div>
            <div className="rounded-2xl border border-emerald-500/35 bg-emerald-950/15 p-4 font-mono">
              <span className="text-[10px] uppercase text-stone-400">Unrealized PnL</span>
              <p className="mt-1 text-2xl font-bold text-emerald-400">
                +{fmtPrice(totalUnrealizedPnL)}
              </p>
              <span className="text-[11px] text-emerald-300">
                +{(totalUnrealizedPnL / Math.max(1, totalPortfolioValue - totalUnrealizedPnL) * 100).toFixed(2)}%
              </span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[1.2fr_1.8fr]">
            <div className="rounded-2xl border border-white/[0.08] bg-[#090c12] p-5 space-y-4">
              <div className="border-b border-white/[0.07] pb-3">
                <h3 className="font-display text-base font-medium text-[#f2efe8] flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-[#d8ab5a]" />
                  Place Paper Trade Order
                </h3>
                <p className="text-xs text-stone-400">
                  Zero commission virtual execution with live quote fill
                </p>
              </div>

              <form onSubmit={handleExecutePaperOrder} className="space-y-4 font-mono text-xs">
                <div>
                  <label className="text-stone-300 block mb-1">Asset Symbol</label>
                  <select
                    value={orderSymbol}
                    onChange={(e) => setOrderSymbol(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-[#050609] px-3 py-2 text-[#f2efe8]"
                  >
                    {ASSETS.slice(0, 18).map((a) => (
                      <option key={a.symbol} value={a.symbol}>
                        ${a.symbol} ({a.name}) — {fmtPrice(liveLastPrice(a.symbol))}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-stone-300 block mb-1">Order Side</label>
                    <div className="grid grid-cols-2 gap-1 rounded-lg border border-white/10 p-1 bg-[#050609]">
                      <button
                        type="button"
                        onClick={() => setOrderSide("BUY")}
                        className={`rounded py-1.5 font-bold transition ${
                          orderSide === "BUY"
                            ? "bg-emerald-500 text-[#050609]"
                            : "text-stone-400 hover:text-white"
                        }`}
                      >
                        BUY
                      </button>
                      <button
                        type="button"
                        onClick={() => setOrderSide("SELL")}
                        className={`rounded py-1.5 font-bold transition ${
                          orderSide === "SELL"
                            ? "bg-rose-500 text-white"
                            : "text-stone-400 hover:text-white"
                        }`}
                      >
                        SELL
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-stone-300 block mb-1">Shares / Units</label>
                    <input
                      type="number"
                      min="1"
                      max="10000"
                      value={orderShares}
                      onChange={(e) => setOrderShares(parseInt(e.target.value, 10) || 1)}
                      className="w-full rounded-lg border border-white/10 bg-[#050609] px-3 py-2 text-[#f2efe8]"
                    />
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.07] bg-[#050609] p-3 space-y-1 text-stone-400">
                  <div className="flex justify-between">
                    <span>Estimated Fill Price:</span>
                    <span className="text-[#f2efe8] font-bold">
                      {fmtPrice(liveLastPrice(orderSymbol))}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Notional Cost:</span>
                    <span className="text-[#f0c979] font-bold">
                      {fmtPrice(liveLastPrice(orderSymbol) * orderShares)}
                    </span>
                  </div>
                </div>

                {orderFeedback && (
                  <div className="rounded-lg bg-[#d8ab5a]/10 border border-[#d8ab5a]/30 p-2.5 text-[#f0c979] text-[11px]">
                    {orderFeedback}
                  </div>
                )}

                <button
                  type="submit"
                  className={`w-full rounded-xl py-3 font-mono text-xs font-bold transition ${
                    orderSide === "BUY"
                      ? "bg-emerald-500 text-[#050609] hover:bg-emerald-400"
                      : "bg-rose-500 text-white hover:bg-rose-400"
                  }`}
                >
                  Confirm &amp; Transmit Paper Order &lt;GO&gt;
                </button>
              </form>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#090c12] p-5 space-y-4">
              <div className="border-b border-white/[0.07] pb-3 flex items-center justify-between">
                <div>
                  <h3 className="font-display text-base font-medium text-[#f2efe8]">Active Positions Ledger</h3>
                  <p className="text-xs text-stone-400">
                    Real-time marked to market with live quote updates
                  </p>
                </div>
                <span className="rounded bg-white/[0.06] px-2.5 py-0.5 text-[10px] font-mono text-[#f0c979]">
                  {positions.length} Open
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead className="bg-[#050609] text-stone-400">
                    <tr>
                      <th className="px-3 py-2">Symbol</th>
                      <th className="px-3 py-2">Side</th>
                      <th className="px-3 py-2">Units</th>
                      <th className="px-3 py-2">Entry</th>
                      <th className="px-3 py-2">Current</th>
                      <th className="px-3 py-2 text-right">PnL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {positions.map((pos) => {
                      const curPrice = liveLastPrice(pos.symbol);
                      const pnl = (curPrice - pos.entryPrice) * pos.shares;
                      const pnlPct = ((curPrice - pos.entryPrice) / pos.entryPrice) * 100;
                      return (
                        <tr key={pos.symbol} className="hover:bg-white/[0.03]">
                          <td className="px-3 py-2 font-bold text-[#f2efe8]">${pos.symbol}</td>
                          <td className="px-3 py-2">
                            <span className="rounded bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 text-[10px]">
                              {pos.side}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-stone-300">{pos.shares}</td>
                          <td className="px-3 py-2 text-stone-400">{fmtPrice(pos.entryPrice)}</td>
                          <td className="px-3 py-2 text-[#f2efe8] font-bold">{fmtPrice(curPrice)}</td>
                          <td
                            className={`px-3 py-2 text-right font-bold ${
                              pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                            }`}
                          >
                            {pnl >= 0 ? "+" : ""}
                            {fmtPrice(pnl)} ({pnlPct.toFixed(1)}%)
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DESK 6: 100+ DATA FEEDS & MARITIME CHOKEPOINTS */}
      {activeDesk === "connectors" && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#d8ab5a]/25 bg-[#090c12] p-6 space-y-4">
            <div className="border-b border-white/[0.08] pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-medium text-[#f2efe8] flex items-center gap-2">
                  <Ship className="h-4 w-4 text-[#d8ab5a]" />
                  Global Maritime Chokepoint &amp; Supply Chain Radar
                </h3>
                <p className="text-xs text-stone-400">
                  Satellite vessel tracking at critical trade bottlenecks
                </p>
              </div>
              <span className="rounded-full bg-rose-500/15 border border-rose-500/30 px-2.5 py-0.5 text-[10px] font-mono text-rose-300">
                Red Sea &amp; Hormuz Active Watch
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 tabular-nums">
              {MARITIME_CHOKEPOINTS.map((choke) => (
                <div
                  key={choke.name}
                  className="rounded-xl border border-white/[0.07] bg-[#050609] p-4 font-mono text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#f2efe8] text-sm">{choke.name}</span>
                    <span
                      className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
                        choke.status === "Normal"
                          ? "bg-emerald-500/15 text-emerald-400"
                          : choke.status === "Elevated Risk"
                          ? "bg-[#d8ab5a]/15 text-[#f0c979]"
                          : "bg-rose-500/15 text-rose-400"
                      }`}
                    >
                      {choke.status}
                    </span>
                  </div>
                  <p className="text-stone-400 text-[11px]">{choke.location}</p>
                  <div className="border-t border-white/[0.07] pt-2 space-y-1 text-stone-300">
                    <div className="flex justify-between">
                      <span>Share of Global Trade:</span>
                      <span className="text-[#f0c979] font-bold">
                        {choke.transitShareWorldTradePct}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Vessels in Queue:</span>
                      <span className="text-[#f2efe8] font-bold">{choke.vesselsWaiting}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Delay:</span>
                      <span className="text-stone-300 font-bold">{choke.avgWaitHours} hrs</span>
                    </div>
                  </div>
                  <div className="text-[10px] text-stone-500 pt-1">
                    Commodities: {choke.keyCommodities.join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#090c12] p-6 space-y-4">
            <div className="border-b border-white/[0.07] pb-3 flex items-center justify-between">
              <div>
                <h3 className="font-display text-base font-medium text-[#f2efe8] flex items-center gap-2">
                  <Database className="h-4 w-4 text-[#d8ab5a]" />
                  Global Data Connectors Telemetry (100+ Feeds)
                </h3>
                <p className="text-xs text-stone-400">
                  Standardized REST, WebSocket &amp; gRPC endpoints across sovereign &amp; market feeds
                </p>
              </div>
              <span className="rounded bg-emerald-500/15 text-emerald-400 px-2 py-0.5 text-[10px] font-mono">
                12 / 12 Core Feeds Operational
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 tabular-nums">
              {FINCEPT_DATA_CONNECTORS.map((conn) => (
                <div
                  key={conn.id}
                  className="rounded-xl border border-white/[0.07] bg-[#050609] p-4 font-mono text-xs space-y-2 hover:border-[#d8ab5a]/35 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-[#f0c979]">{conn.name}</span>
                    <span className="rounded bg-white/[0.05] px-1.5 py-0.5 text-[9px] text-stone-400">
                      {conn.latencyMs}ms
                    </span>
                  </div>
                  <p className="text-stone-400 text-[11px] leading-relaxed line-clamp-2">
                    {conn.description}
                  </p>
                  <div className="flex items-center justify-between border-t border-white/[0.06] pt-2 text-[10px] text-stone-500">
                    <span>{conn.category}</span>
                    <span className="text-[#f0c979]">{conn.endpointCount} Endpoints</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* DESK 7: VISUAL STRATEGY NODE CANVAS */}
      {activeDesk === "node" && (
        <div className="rounded-2xl border border-[#d8ab5a]/25 bg-[#090c12] p-6 space-y-6">
          <div className="border-b border-white/[0.08] pb-4 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#f0c979]">
                Visual Strategy Pipeline Engine
              </span>
              <h3 className="font-display text-xl font-medium text-[#f2efe8] flex items-center gap-2 mt-1">
                <Workflow className="h-4 w-4 text-[#d8ab5a]" />
                Strategy Pipeline &amp; Factor Discovery Graph
              </h3>
              <p className="text-xs text-stone-400">
                Composable pipeline: Ingestion &rarr; Signal Filter &rarr; AI Consensus &rarr; Order Routing
              </p>
            </div>
            <button
              onClick={() => {
                setNodeSteps((prev) =>
                  prev.map((s, idx) => (idx === 4 ? { ...s, status: "Active", active: true } : s))
                );
              }}
              className="rounded-xl bg-gradient-to-r from-[#d8ab5a] to-[#f0c979] px-4 py-2 font-mono text-xs font-bold text-[#050609] hover:brightness-110 transition flex items-center gap-2"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              <span>Run Pipeline Execution</span>
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-5">
            {nodeSteps.map((node, i) => (
              <div
                key={node.id}
                className={`relative rounded-xl border p-4 font-mono text-xs space-y-2 transition-all ${
                  node.active
                    ? "border-[#d8ab5a]/55 bg-[#d8ab5a]/[0.08] shadow-[0_8px_24px_rgba(216,171,90,0.08)]"
                    : "border-white/[0.07] bg-[#050609] text-stone-500"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`font-bold ${
                      node.active ? "text-[#f0c979]" : "text-stone-400"
                    }`}
                  >
                    {node.title}
                  </span>
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold ${
                      node.status === "Active"
                        ? "bg-emerald-500/20 text-emerald-400"
                        : "bg-white/[0.06] text-stone-400"
                    }`}
                  >
                    {node.status}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-stone-300">{node.desc}</p>
                {i < nodeSteps.length - 1 && (
                  <div className="hidden sm:block absolute -right-3 top-1/2 -translate-y-1/2 z-10 text-[#f0c979]">
                    &rarr;
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-white/[0.08] bg-[#050609] p-4 font-mono text-xs">
            <div className="flex items-center justify-between text-stone-400 pb-2 border-b border-white/[0.07]">
              <span className="text-[#f0c979] font-bold">Generated Embedded Python 3.11 Script:</span>
              <span className="text-[10px]">Compiled in C++20 Runtime</span>
            </div>
            <pre className="mt-3 text-stone-300 leading-relaxed text-xs overflow-x-auto">
{`from nextwall.quant import Engine, AgentPool, RiskEngine

# 1. Initialize Pipeline & Data Connectors
engine = Engine.connect(["fred", "polygon", "edgar"])
universe = engine.get_equity_universe(["NVDA", "AAPL", "MSFT", "BTC"])

# 2. Apply Technical & Quant Volatility Filter
candidates = universe.filter(lambda s: s.sma20 > s.sma50 and s.realized_vol < 0.50)

# 3. Solicit Consensus from Buffett & Simons Agents
consensus = AgentPool.evaluate(["buffett", "simons"], candidates)

# 4. Enforce Invalidation Stop & Maximum Notional Cap
orders = RiskEngine.size_positions(consensus, max_risk_pct=1.5, stop_loss="invalidation_level")

# 5. Route to Virtual Execution Venue
print(f"Executing {len(orders)} institutional orders with zero slippage.")`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
