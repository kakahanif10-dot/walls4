"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Terminal,
  Activity,
  ShieldAlert,
  PieChart,
  Layers,
  Code2,
  Copy,
  Check,
  ChevronRight,
  Database,
} from "lucide-react";
import {
  OPENBB_DARKPOOL_ITEMS,
  calculateOpenBBVaR,
  generateMonteCarloPaths,
  computeOpenBBEfficientFrontier,
  executeOpenBBCommand,
  type OpenBBCommandResult,
  type OpenBBMacroIndicator,
  type OpenBBYieldPoint,
} from "@/lib/openbb-platform";
import { useQuotes } from "@/components/live-prices";
import WhopBadge from "@/components/whop-badge";

type WorkspaceTab = "cli" | "quant-var" | "macro-yield" | "portfolio" | "darkpool";

export default function OpenBBTerminal() {
  const [activeTab, setActiveTab] = useState<WorkspaceTab>("cli");

  // CLI State
  const [commandInput, setCommandInput] = useState("");
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [terminalLogs, setTerminalLogs] = useState<OpenBBCommandResult[]>([
    {
      command: "welcome",
      type: "text",
      title: "NextWall Quantitative Risk & CLI Engine v4.3",
      content:
        "Connected to NextWallStreet high-frequency quantitative engine.\nConsolidates 2,000+ asset real-time feeds, US Treasury constant-maturity yields, and portfolio risk models.\nType 'help' or click any command preset below to inspect.",
      pythonCodeSnippet:
        'from nextwall.quant import cli\n# Query multi-asset universe\noutput = cli.equity.price.historical("NVDA")\nprint(output.to_dataframe())',
    },
  ]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  const liveQuotes = useQuotes();

  // Live Treasury Yield Curve & Macro State
  const [yieldCurve, setYieldCurve] = useState<OpenBBYieldPoint[]>([]);
  const [macroIndicators, setMacroIndicators] = useState<OpenBBMacroIndicator[]>([]);
  const [macroLoading, setMacroLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const loadMacro = async () => {
      try {
        const res = await fetch("/api/live-terminal-data?view=macro-perps", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as {
          yieldCurve?: OpenBBYieldPoint[];
          macroIndicators?: OpenBBMacroIndicator[];
        };
        if (cancelled) return;
        if (Array.isArray(data.yieldCurve) && data.yieldCurve.length >= 6) {
          setYieldCurve(data.yieldCurve);
        }
        if (Array.isArray(data.macroIndicators) && data.macroIndicators.length >= 3) {
          setMacroIndicators(data.macroIndicators);
        }
      } catch {
        // retain existing live Treasury rates
      } finally {
        if (!cancelled) setMacroLoading(false);
      }
    };
    loadMacro();
    const id = setInterval(loadMacro, 30_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Quant VaR State
  const [selectedSymbol, setSelectedSymbol] = useState("NVDA");
  const [confidence, setConfidence] = useState<0.95 | 0.99>(0.95);
  const [horizonDays, setHorizonDays] = useState(1);
  const liveSelectedPrice = liveQuotes[selectedSymbol]?.price;
  const [varResult, setVarResult] = useState(() =>
    calculateOpenBBVaR("NVDA", 0.95, 1, liveQuotes["NVDA"]?.price),
  );
  const [monteCarloPaths, setMonteCarloPaths] = useState(() =>
    generateMonteCarloPaths("NVDA", liveQuotes["NVDA"]?.price ?? calculateOpenBBVaR("NVDA", 0.95, 1).price, 30),
  );

  // Portfolio Optimizer State
  const [basketSymbols] = useState<string[]>(["NVDA", "AAPL", "MSFT", "BTC", "SOL"]);
  const livePriceMap = React.useMemo(() => {
    const out: Record<string, number> = {};
    for (const [sym, q] of Object.entries(liveQuotes)) {
      if (q && q.price > 0) out[sym] = q.price;
    }
    return out;
  }, [liveQuotes]);

  const frontierData = React.useMemo(
    () => computeOpenBBEfficientFrontier(basketSymbols, livePriceMap),
    [basketSymbols, livePriceMap],
  );

  useEffect(() => {
    const res = calculateOpenBBVaR(selectedSymbol, confidence, horizonDays, liveSelectedPrice);
    setVarResult(res);
    setMonteCarloPaths(generateMonteCarloPaths(selectedSymbol, res.price, 30));
  }, [selectedSymbol, confidence, horizonDays, liveSelectedPrice]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [terminalLogs]);

  const handleRunCommand = (cmdToRun?: string) => {
    const target = cmdToRun !== undefined ? cmdToRun : commandInput;
    if (!target.trim()) return;

    if (target.trim().toLowerCase() === "clear" || target.trim().toLowerCase() === "/clear") {
      setTerminalLogs([]);
      setCommandInput("");
      return;
    }

    const result = executeOpenBBCommand(target, liveQuotes, yieldCurve, macroIndicators);
    setTerminalLogs((prev) => [...prev, result]);
    setCommandHistory((prev) => [...prev, target]);
    setHistoryIndex(-1);
    setCommandInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRunCommand();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIdx = historyIndex + 1 < commandHistory.length ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIdx);
        setCommandInput(commandHistory[commandHistory.length - 1 - nextIdx] || "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setCommandInput(commandHistory[commandHistory.length - 1 - nextIdx] || "");
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCommandInput("");
      }
    }
  };

  const copyCode = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-8 text-[#f2efe8]">
      {/* Top Quantitative Header Bar */}
      <div className="rounded-2xl border border-[#d8ab5a]/25 bg-gradient-to-b from-[#0d1017]/95 to-[#06080d]/95 p-6 shadow-[0_24px_60px_rgba(0,0,0,0.65)] backdrop-blur-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 border-b border-white/[0.08] pb-6">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#d8ab5a]/10 border border-[#d8ab5a]/35 px-2.5 py-1 text-[10px] font-mono font-semibold uppercase tracking-[0.14em] text-[#f0c979]">
                <Database className="h-3.5 w-3.5 text-[#d8ab5a]" />
                QUANTITATIVE DATA WORKBENCH
              </span>
              <span className="text-xs text-stone-400 font-mono">
                Python SDK &amp; Command-Line Risk Engine
              </span>
              <WhopBadge size="xs" />
            </div>
            <h2 className="mt-2.5 text-2xl sm:text-3xl font-display font-medium text-[#f2efe8] tracking-tight">
              Quantitative Risk, VaR &amp; Portfolio CLI
            </h2>
            <p className="mt-1.5 text-xs sm:text-sm text-stone-400 max-w-3xl leading-relaxed">
              Full command-line terminal, parametric &amp; fat-tailed Value at Risk (VaR), 30-day Monte Carlo diffusion model, Markowitz Efficient Frontier optimizer, US Treasury yield curve analytics, and institutional dark pool flow.
            </p>
          </div>

          {/* Quick Platform Status */}
          <div className="rounded-xl border border-white/[0.08] bg-[#080a0f]/90 p-4 max-w-md w-full shrink-0">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-stone-400">Quant Engine:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live Core v4.3
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-mono border-t border-white/[0.07] pt-2">
              <span className="text-stone-400">Universe Stream:</span>
              <span className="text-sky-300">2,038 Tickers (Equities, Crypto, Memes)</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs font-mono border-t border-white/[0.07] pt-2">
              <span className="text-stone-400">Risk Model:</span>
              <span className="text-[#f0c979]">Fat-Tailed Student-t + Monte Carlo</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mt-6 rounded-xl border border-white/[0.07] bg-[#080a0f]/90 p-1.5">
          {[
            { id: "cli", label: "CLI Console (<GO>)", icon: Terminal },
            { id: "quant-var", label: "Quantitative Risk & VaR", icon: ShieldAlert },
            { id: "macro-yield", label: "Macro & Yield Curve", icon: Activity },
            { id: "portfolio", label: "Markowitz Portfolio Optimizer", icon: PieChart },
            { id: "darkpool", label: "Dark Pool & Flow Radar", icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as WorkspaceTab)}
                className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-medium transition ${
                  active
                    ? "bg-gradient-to-r from-[#d8ab5a] to-[#f0c979] text-[#050609] font-semibold shadow-[0_4px_16px_rgba(216,171,90,0.22)]"
                    : "text-stone-400 hover:text-[#f2efe8] hover:bg-white/[0.04]"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${active ? "text-[#050609]" : "text-[#d8ab5a]"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: CLI WORKSTATION */}
      {activeTab === "cli" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="text-stone-400">Quick Commands:</span>
            {[
              "/equity/price NVDA",
              "/equity/darkpool AAPL",
              "/economy/yieldcurve",
              "/economy/macro",
              "/quant/var TSLA",
              "/portfolio/optimize",
              "cli.equity.price('NVDA')",
              "/help",
            ].map((cmd) => (
              <button
                key={cmd}
                onClick={() => handleRunCommand(cmd)}
                className="rounded-md border border-[#d8ab5a]/25 bg-[#090c12] px-2.5 py-1 text-[11px] text-[#f0c979] hover:border-[#d8ab5a] hover:bg-[#d8ab5a]/15 transition"
              >
                {cmd}
              </button>
            ))}
            <button
              onClick={() => handleRunCommand("clear")}
              className="rounded-md border border-white/10 bg-[#050609] px-2 py-1 text-[11px] text-stone-400 hover:text-[#f2efe8]"
            >
              Clear
            </button>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#080a0f] p-5 shadow-[0_24px_60px_rgba(0,0,0,0.55)] font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/[0.07] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#d8ab5a] inline-block" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 inline-block" />
                <span className="ml-2 text-stone-400 text-[11px]">
                  quant@nextwallstreet:~ (python 3.11 · cli 4.3)
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-stone-500">
                <span>UTF-8</span>
                <span>bash / quant-cli</span>
              </div>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {terminalLogs.map((log, idx) => (
                <div key={idx} className="space-y-2 border-b border-white/[0.06] pb-4">
                  {log.command !== "welcome" && (
                    <div className="flex items-center gap-2 text-[#f0c979]">
                      <span className="text-stone-500">NWS-CLI&gt;</span>
                      <span className="font-bold">{log.command}</span>
                    </div>
                  )}

                  {log.title && (
                    <div className="text-[#f0c979] font-bold tracking-wide">{log.title}</div>
                  )}

                  <div className="text-stone-300 whitespace-pre-wrap leading-relaxed">
                    {log.content}
                  </div>

                  {log.tableData && log.tableData.length > 0 && (
                    <div className="overflow-x-auto rounded-lg border border-white/[0.08] bg-[#050609] mt-2">
                      <table className="w-full text-left text-[11px] tabular-nums">
                        <thead>
                          <tr className="border-b border-white/[0.08] bg-white/[0.03] text-[#f0c979]">
                            {Object.keys(log.tableData[0]).map((col) => (
                              <th key={col} className="p-2 font-semibold">
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/[0.05]">
                          {log.tableData.map((row, rIdx) => (
                            <tr key={rIdx} className="hover:bg-white/[0.02]">
                              {Object.values(row).map((val, cIdx) => (
                                <td key={cIdx} className="p-2 text-stone-200">
                                  {String(val)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {log.pythonCodeSnippet && (
                    <div className="relative mt-2 rounded-lg border border-white/[0.07] bg-[#050609] p-3">
                      <div className="flex items-center justify-between text-[10px] text-stone-400 mb-1">
                        <span className="flex items-center gap-1 text-[#f0c979]">
                          <Code2 className="h-3 w-3" /> Python SDK Snippet
                        </span>
                        <button
                          onClick={() => copyCode(log.pythonCodeSnippet!, idx)}
                          className="hover:text-stone-200 flex items-center gap-1"
                        >
                          {copiedIndex === idx ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>{copiedIndex === idx ? "Copied" : "Copy"}</span>
                        </button>
                      </div>
                      <pre className="text-emerald-400/90 text-[11px] overflow-x-auto">
                        {log.pythonCodeSnippet}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
              <div ref={logEndRef} />
            </div>

            <div className="mt-4 flex items-center gap-2 border-t border-white/[0.07] pt-3">
              <span className="text-[#f0c979] font-bold shrink-0">NWS-CLI&gt;</span>
              <input
                type="text"
                value={commandInput}
                onChange={(e) => setCommandInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type command (e.g. /equity/price NVDA, /quant/var BTC, /economy/yieldcurve, help)..."
                className="flex-1 bg-transparent text-[#f2efe8] placeholder-stone-600 focus:outline-none text-xs font-mono"
              />
              <button
                onClick={() => handleRunCommand()}
                className="rounded-lg bg-gradient-to-r from-[#d8ab5a] to-[#f0c979] hover:brightness-110 text-[#050609] font-bold px-3.5 py-1.5 text-xs shrink-0 flex items-center gap-1"
              >
                <span>RUN</span>
                <ChevronRight className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: QUANTITATIVE RISK & VAR */}
      {activeTab === "quant-var" && (
        <div className="space-y-6 tabular-nums">
          <div className="rounded-xl border border-white/[0.08] bg-[#090c12] p-4 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
            <div className="flex items-center gap-3">
              <span className="text-stone-400">Select Asset:</span>
              <select
                value={selectedSymbol}
                onChange={(e) => setSelectedSymbol(e.target.value)}
                className="rounded-lg border border-[#d8ab5a]/35 bg-[#050609] px-3 py-1.5 text-[#f2efe8] font-bold focus:outline-none focus:border-[#d8ab5a]"
              >
                <optgroup label="S&P 500 / Large Tech">
                  {[
                    { sym: "NVDA", name: "NVIDIA Corp" },
                    { sym: "AAPL", name: "Apple Inc" },
                    { sym: "MSFT", name: "Microsoft Corp" },
                    { sym: "TSLA", name: "Tesla Inc" },
                    { sym: "PLTR", name: "Palantir Tech" },
                    { sym: "AMD", name: "Advanced Micro Devices" },
                  ].map((item) => (
                    <option key={item.sym} value={item.sym}>
                      {item.sym} - {item.name} ({liveQuotes[item.sym]?.price ? `$${liveQuotes[item.sym].price.toFixed(2)}` : "Live"})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Crypto Assets">
                  {[
                    { sym: "BTC", name: "Bitcoin" },
                    { sym: "ETH", name: "Ethereum" },
                    { sym: "SOL", name: "Solana" },
                  ].map((item) => (
                    <option key={item.sym} value={item.sym}>
                      {item.sym} - {item.name} ({liveQuotes[item.sym]?.price ? `$${liveQuotes[item.sym].price.toLocaleString("en-US", { maximumFractionDigits: 2 })}` : "Live"})
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-stone-400">Confidence:</span>
                <div className="inline-flex rounded-lg border border-white/10 bg-[#050609] p-0.5">
                  <button
                    onClick={() => setConfidence(0.95)}
                    className={`rounded px-2.5 py-1 ${
                      confidence === 0.95 ? "bg-[#d8ab5a]/20 text-[#f0c979] font-bold" : "text-stone-400"
                    }`}
                  >
                    95%
                  </button>
                  <button
                    onClick={() => setConfidence(0.99)}
                    className={`rounded px-2.5 py-1 ${
                      confidence === 0.99 ? "bg-[#d8ab5a]/20 text-[#f0c979] font-bold" : "text-stone-400"
                    }`}
                  >
                    99% (Extreme)
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-stone-400">Horizon:</span>
                <div className="inline-flex rounded-lg border border-white/10 bg-[#050609] p-0.5">
                  {[1, 5, 10].map((d) => (
                    <button
                      key={d}
                      onClick={() => setHorizonDays(d)}
                      className={`rounded px-2 py-1 ${
                        horizonDays === d ? "bg-[#d8ab5a]/20 text-[#f0c979] font-bold" : "text-stone-400"
                      }`}
                    >
                      {d}D
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 font-mono">
            <div className="rounded-xl border border-sky-500/25 bg-[#090c12] p-4">
              <span className="text-[11px] text-sky-300 uppercase tracking-wider">
                Parametric Gaussian VaR
              </span>
              <p className="mt-2 text-2xl font-bold text-rose-400">
                -{varResult.parametricVaRPercent}%
              </p>
              <p className="mt-1 text-xs text-stone-400">
                -${varResult.parametricVaRDollar} per 1 share
              </p>
              <p className="mt-2 text-[10px] text-stone-500">Normal distribution assumption</p>
            </div>

            <div className="rounded-xl border border-[#d8ab5a]/30 bg-[#090c12] p-4">
              <span className="text-[11px] text-[#f0c979] uppercase tracking-wider">
                Historical (Fat-Tailed) VaR
              </span>
              <p className="mt-2 text-2xl font-bold text-[#f0c979]">
                -{varResult.historicalVaRPercent}%
              </p>
              <p className="mt-1 text-xs text-stone-400">
                -${varResult.historicalVaRDollar} per 1 share
              </p>
              <p className="mt-2 text-[10px] text-stone-500">Student-t kurtosis adjusted</p>
            </div>

            <div className="rounded-xl border border-rose-500/25 bg-[#090c12] p-4">
              <span className="text-[11px] text-rose-400 uppercase tracking-wider">
                Expected Shortfall (CVaR)
              </span>
              <p className="mt-2 text-2xl font-bold text-rose-300">
                -{varResult.expectedShortfallPercent}%
              </p>
              <p className="mt-1 text-xs text-stone-400">
                -${varResult.expectedShortfallDollar} tail loss
              </p>
              <p className="mt-2 text-[10px] text-stone-500">Average loss beyond VaR threshold</p>
            </div>

            <div className="rounded-xl border border-emerald-500/25 bg-[#090c12] p-4">
              <span className="text-[11px] text-emerald-400 uppercase tracking-wider">
                Risk-Adjusted Ratios
              </span>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xs text-stone-400">Sharpe:</span>
                <span className="text-xl font-bold text-emerald-400">{varResult.sharpeRatio}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between text-xs">
                <span className="text-stone-400">Sortino:</span>
                <span className="text-[#f2efe8]">{varResult.sortinoRatio}</span>
              </div>
              <div className="mt-1 flex items-baseline justify-between text-xs">
                <span className="text-stone-400">Beta to SPY:</span>
                <span className="text-sky-300">{varResult.betaToSPY}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#090c12] p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
              <div>
                <h3 className="text-lg font-display font-medium text-[#f2efe8]">
                  Monte Carlo 30-Day Geometric Brownian Motion Envelope
                </h3>
                <p className="text-xs text-stone-400 mt-1">
                  1,000 Monte Carlo diffusion price paths across 5th (tail stop), 25th, 50th (median), 75th, and 95th percentiles.
                </p>
              </div>
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> 95th Percentile
                </span>
                <span className="flex items-center gap-1.5 text-[#f0c979]">
                  <span className="h-2 w-2 rounded-full bg-[#f0c979]" /> 50th Median
                </span>
                <span className="flex items-center gap-1.5 text-rose-400">
                  <span className="h-2 w-2 rounded-full bg-rose-400" /> 5th Tail Risk
                </span>
              </div>
            </div>

            <div className="mt-6 h-64 w-full">
              <svg className="h-full w-full overflow-visible" viewBox="0 0 800 240">
                <line x1="50" y1="20" x2="780" y2="20" stroke="#1e2433" strokeDasharray="3 3" />
                <line x1="50" y1="70" x2="780" y2="70" stroke="#1e2433" strokeDasharray="3 3" />
                <line x1="50" y1="120" x2="780" y2="120" stroke="#1e2433" strokeDasharray="3 3" />
                <line x1="50" y1="170" x2="780" y2="170" stroke="#1e2433" strokeDasharray="3 3" />
                <line x1="50" y1="220" x2="780" y2="220" stroke="#1e2433" />

                <polygon
                  fill="rgba(216, 171, 90, 0.08)"
                  points={`
                    ${monteCarloPaths.map((p, i) => `${50 + (i * 730) / 30},${220 - ((p.p95 - monteCarloPaths[30].p05 * 0.9) / (monteCarloPaths[30].p95 * 1.1 - monteCarloPaths[30].p05 * 0.9)) * 200}`).join(" ")}
                    ${[...monteCarloPaths].reverse().map((p, i) => `${50 + ((30 - i) * 730) / 30},${220 - ((p.p05 - monteCarloPaths[30].p05 * 0.9) / (monteCarloPaths[30].p95 * 1.1 - monteCarloPaths[30].p05 * 0.9)) * 200}`).join(" ")}
                  `}
                />

                <polyline
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="2"
                  points={monteCarloPaths
                    .map(
                      (p, i) =>
                        `${50 + (i * 730) / 30},${
                          220 -
                          ((p.p95 - monteCarloPaths[30].p05 * 0.9) /
                            (monteCarloPaths[30].p95 * 1.1 - monteCarloPaths[30].p05 * 0.9)) *
                            200
                        }`
                    )
                    .join(" ")}
                />

                <polyline
                  fill="none"
                  stroke="#f0c979"
                  strokeWidth="2.5"
                  points={monteCarloPaths
                    .map(
                      (p, i) =>
                        `${50 + (i * 730) / 30},${
                          220 -
                          ((p.p50 - monteCarloPaths[30].p05 * 0.9) /
                            (monteCarloPaths[30].p95 * 1.1 - monteCarloPaths[30].p05 * 0.9)) *
                            200
                        }`
                    )
                    .join(" ")}
                />

                <polyline
                  fill="none"
                  stroke="#fb7185"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  points={monteCarloPaths
                    .map(
                      (p, i) =>
                        `${50 + (i * 730) / 30},${
                          220 -
                          ((p.p05 - monteCarloPaths[30].p05 * 0.9) /
                            (monteCarloPaths[30].p95 * 1.1 - monteCarloPaths[30].p05 * 0.9)) *
                            200
                        }`
                    )
                    .join(" ")}
                />
              </svg>
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-5 gap-3 border-t border-white/[0.07] pt-4 text-xs font-mono">
              <div>
                <span className="text-stone-500">Day 0 (Initial):</span>
                <p className="text-[#f2efe8] font-bold">${varResult.price.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-rose-400">Day 30 (p05):</span>
                <p className="text-rose-400 font-bold">${monteCarloPaths[30].p05.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-[#f0c979]">Day 30 (Median):</span>
                <p className="text-[#f0c979] font-bold">${monteCarloPaths[30].p50.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-emerald-400">Day 30 (p95):</span>
                <p className="text-emerald-400 font-bold">${monteCarloPaths[30].p95.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-sky-300">Annual Vol:</span>
                <p className="text-sky-300 font-bold">{varResult.annualizedVol}%</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: MACRO & YIELD CURVE */}
      {activeTab === "macro-yield" && (
        <div className="space-y-6 tabular-nums">
          <div className="rounded-2xl border border-white/[0.08] bg-[#090c12] p-6 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
              <div>
                <span className="text-[11px] font-mono text-[#f0c979] uppercase tracking-widest">
                  FIXED INCOME &amp; TREASURY BENCHMARK
                </span>
                <h3 className="text-xl font-display font-medium text-[#f2efe8] mt-1">
                  US Treasury Constant Maturity Yield Curve (1M - 30Y)
                </h3>
              </div>
              <div className="flex items-center gap-3 font-mono text-xs">
                {(() => {
                  const y10 = yieldCurve.find((p) => p.tenor === "10Y")?.rate;
                  const y2 = yieldCurve.find((p) => p.tenor === "2Y")?.rate;
                  if (y10 === undefined || y2 === undefined) {
                    return (
                      <div className="rounded-lg border border-white/10 bg-[#050609] px-3 py-1.5 text-stone-400">
                        {macroLoading ? "Syncing live 10Y - 2Y spread..." : "Live 10Y - 2Y spread unavailable"}
                      </div>
                    );
                  }
                  const spreadBps = Math.round((y10 - y2) * 100);
                  return (
                    <div className="rounded-lg border border-emerald-500/35 bg-emerald-950/20 px-3 py-1.5 text-emerald-400">
                      10Y - 2Y Spread:{" "}
                      <span className="font-bold">
                        {spreadBps >= 0 ? "+" : ""}
                        {spreadBps} bps
                      </span>{" "}
                      ({spreadBps >= 0 ? "Positive Slope" : "Inverted"})
                    </div>
                  );
                })()}
              </div>
            </div>

            <div className="mt-6 h-64 w-full">
              {yieldCurve.length === 0 ? (
                <div className="flex h-full items-center justify-center rounded-xl border border-white/[0.06] bg-[#050609] text-xs font-mono text-stone-400">
                  {macroLoading ? "Syncing live US Treasury yield curve..." : "Live US Treasury yield feed unavailable"}
                </div>
              ) : (
              <svg className="h-full w-full overflow-visible" viewBox="0 0 800 240">
                {[5.5, 5.0, 4.5, 4.0, 3.5].map((level, i) => (
                  <g key={level}>
                    <line x1="40" y1={30 + i * 45} x2="780" y2={30 + i * 45} stroke="#1e2433" strokeDasharray="3 3" />
                    <text x="5" y={34 + i * 45} fill="#64748b" fontSize="10" fontFamily="monospace">
                      {level.toFixed(1)}%
                    </text>
                  </g>
                ))}

                <polyline
                  fill="none"
                  stroke="#475569"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                  points={yieldCurve.map(
                    (pt, idx) =>
                      `${60 + (idx * 700) / Math.max(1, yieldCurve.length - 1)},${
                        210 - ((pt.previousRate - 3.5) / 2.0) * 180
                      }`
                  ).join(" ")}
                />

                <polyline
                  fill="none"
                  stroke="#f0c979"
                  strokeWidth="3"
                  points={yieldCurve.map(
                    (pt, idx) =>
                      `${60 + (idx * 700) / Math.max(1, yieldCurve.length - 1)},${
                        210 - ((pt.rate - 3.5) / 2.0) * 180
                      }`
                  ).join(" ")}
                />

                {yieldCurve.map((pt, idx) => {
                  const x = 60 + (idx * 700) / Math.max(1, yieldCurve.length - 1);
                  const y = 210 - ((pt.rate - 3.5) / 2.0) * 180;
                  return (
                    <g key={pt.tenor}>
                      <circle cx={x} cy={y} r="5" fill="#f0c979" stroke="#050609" strokeWidth="2" />
                      <text x={x} y="235" textAnchor="middle" fill="#94a3b8" fontSize="11" fontFamily="monospace">
                        {pt.tenor}
                      </text>
                      <text x={x} y={y - 10} textAnchor="middle" fill="#f0c979" fontSize="11" fontFamily="monospace" fontWeight="bold">
                        {pt.rate.toFixed(2)}%
                      </text>
                    </g>
                  );
                })}
              </svg>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-white/[0.08] bg-[#090c12] p-6 shadow-2xl">
            <h3 className="text-lg font-display font-medium text-[#f2efe8] mb-4">
              Core Macroeconomic &amp; Liquidity Dashboard
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-white/[0.08] bg-[#050609] text-[#f0c979]">
                    <th className="p-3 font-semibold">Macro Indicator</th>
                    <th className="p-3 font-semibold">Current Reading</th>
                    <th className="p-3 font-semibold">Previous</th>
                    <th className="p-3 font-semibold">Change</th>
                    <th className="p-3 font-semibold">Desk Bias</th>
                    <th className="p-3 font-semibold">Source</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.05]">
                  {macroIndicators.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-stone-400">
                        {macroLoading ? "Syncing live macroeconomic indicators..." : "Live macroeconomic feed unavailable"}
                      </td>
                    </tr>
                  ) : (
                    macroIndicators.map((m, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.02]">
                        <td className="p-3 text-[#f2efe8] font-bold">{m.metric}</td>
                        <td className="p-3 text-[#f0c979] font-bold">{m.current}</td>
                        <td className="p-3 text-stone-400">{m.previous}</td>
                        <td className="p-3 text-stone-300">{m.change}</td>
                        <td className="p-3">
                          <span
                            className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                              m.impact === "Bullish"
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/35"
                                : m.impact === "Bearish"
                                ? "bg-rose-500/15 text-rose-400 border border-rose-500/35"
                                : "bg-white/[0.06] text-stone-300"
                            }`}
                          >
                            {m.impact}
                          </span>
                        </td>
                        <td className="p-3 text-stone-500">{m.updated}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: MARKOWITZ PORTFOLIO OPTIMIZER */}
      {activeTab === "portfolio" && (
        <div className="space-y-6 tabular-nums">
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-white/[0.08] bg-[#090c12] p-6 shadow-2xl">
              <div className="flex items-center justify-between border-b border-white/[0.07] pb-3 mb-4">
                <h3 className="font-display font-medium text-[#f2efe8] text-base">
                  Markowitz Mean-Variance Efficient Frontier
                </h3>
                <span className="text-[11px] font-mono text-[#f0c979]">
                  Max Sharpe: {frontierData.maxSharpePoint.sharpe}
                </span>
              </div>
              <p className="text-xs text-stone-400 mb-4">
                Quadratic optimization across selected universe ({basketSymbols.join(", ")}).
              </p>

              <div className="h-60 w-full">
                <svg className="h-full w-full overflow-visible" viewBox="0 0 400 200">
                  <line x1="40" y1="20" x2="380" y2="20" stroke="#1e2433" strokeDasharray="3 3" />
                  <line x1="40" y1="100" x2="380" y2="100" stroke="#1e2433" strokeDasharray="3 3" />
                  <line x1="40" y1="180" x2="380" y2="180" stroke="#1e2433" />
                  <text x="5" y="105" fill="#64748b" fontSize="9" fontFamily="monospace">
                    Return
                  </text>
                  <text x="200" y="195" fill="#64748b" fontSize="9" fontFamily="monospace">
                    Risk (Volatility)
                  </text>

                  <polyline
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="3"
                    points={frontierData.frontier
                      .map((p) => {
                        const x = 50 + ((p.volatility - 10) / 32) * 320;
                        const y = 180 - ((p.expectedReturn - 8) / 26) * 160;
                        return `${x},${y}`;
                      })
                      .join(" ")}
                  />

                  <circle
                    cx={50 + ((frontierData.minVariancePoint.volatility - 10) / 32) * 320}
                    cy={180 - ((frontierData.minVariancePoint.expectedReturn - 8) / 26) * 160}
                    r="5"
                    fill="#34d399"
                  />

                  <circle
                    cx={50 + ((frontierData.maxSharpePoint.volatility - 10) / 32) * 320}
                    cy={180 - ((frontierData.maxSharpePoint.expectedReturn - 8) / 26) * 160}
                    r="6"
                    fill="#f0c979"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                </svg>
              </div>

              <div className="mt-4 flex items-center justify-between text-xs font-mono border-t border-white/[0.07] pt-3">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" /> Min Volatility:{" "}
                  {frontierData.minVariancePoint.volatility}%
                </span>
                <span className="flex items-center gap-1.5 text-[#f0c979]">
                  <span className="h-2 w-2 rounded-full bg-[#f0c979]" /> Max Sharpe Return:{" "}
                  {frontierData.maxSharpePoint.expectedReturn}%
                </span>
              </div>
            </div>

            <div className="rounded-2xl border border-white/[0.08] bg-[#090c12] p-6 shadow-2xl">
              <h3 className="font-display font-medium text-[#f2efe8] text-base mb-4">
                Optimal Weights by Optimization Strategy
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-mono text-xs">
                  <thead>
                    <tr className="border-b border-white/[0.08] bg-[#050609] text-stone-300">
                      <th className="p-2.5">Asset</th>
                      <th className="p-2.5 text-[#f0c979]">Max Sharpe</th>
                      <th className="p-2.5 text-emerald-400">Min Variance</th>
                      <th className="p-2.5 text-stone-400">Equal Weight</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.05]">
                    {frontierData.allocations.map((a) => (
                      <tr key={a.symbol} className="hover:bg-white/[0.02]">
                        <td className="p-2.5 font-bold text-[#f2efe8]">
                          {a.symbol} <span className="text-[10px] text-stone-500 font-normal">(${a.currentPrice.toFixed(2)})</span>
                        </td>
                        <td className="p-2.5 font-bold text-[#f0c979]">{a.maxSharpeWeight}%</td>
                        <td className="p-2.5 font-bold text-emerald-400">{a.minVarianceWeight}%</td>
                        <td className="p-2.5 text-stone-400">{a.equalWeight}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 rounded-lg border border-white/[0.07] bg-[#050609] p-3 text-[11px] font-mono">
                <span className="text-[#f0c979] font-semibold block mb-1">
                  Export to NextWall Python SDK:
                </span>
                <pre className="text-stone-300 overflow-x-auto">
                  {`from nextwall.quant import cli
opt = cli.portfolio.optimize(
    symbols=${JSON.stringify(basketSymbols)},
    method="max_sharpe"
)
print(opt.weights)`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DARKPOOL & INSTITUTIONAL FLOW */}
      {activeTab === "darkpool" && (
        <div className="rounded-2xl border border-white/[0.08] bg-[#090c12] p-6 shadow-2xl tabular-nums">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-4 mb-6">
            <div>
              <span className="text-[11px] font-mono text-[#f0c979] uppercase tracking-widest">
                FINRA OTC &amp; OFF-EXCHANGE ORDER FLOW
              </span>
              <h3 className="text-xl font-display font-medium text-[#f2efe8] mt-1">
                Institutional Dark Pool Volume &amp; Block Trade Delta
              </h3>
            </div>
            <span className="text-xs font-mono text-stone-400">Updated from SEC/FINRA ATS Reports</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-white/[0.08] bg-[#050609] text-[#f0c979]">
                  <th className="p-3">Symbol</th>
                  <th className="p-3">Company Name</th>
                  <th className="p-3">Last Price</th>
                  <th className="p-3">Off-Exchange %</th>
                  <th className="p-3">FINRA Short Ratio</th>
                  <th className="p-3">Net Block Order Delta</th>
                  <th className="p-3">Institutional Flow Bias</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {OPENBB_DARKPOOL_ITEMS.map((item) => {
                  const liveP = liveQuotes[item.symbol]?.price ?? null;
                  return (
                  <tr key={item.symbol} className="hover:bg-white/[0.02]">
                    <td className="p-3 font-bold text-[#f2efe8]">{item.symbol}</td>
                    <td className="p-3 text-stone-400">{item.name}</td>
                    <td className="p-3 font-bold text-stone-200">{liveP !== null ? `$${liveP.toFixed(2)}` : "Syncing..."}</td>
                    <td className="p-3 font-bold text-sky-300">{item.darkpoolVolumePct}%</td>
                    <td className="p-3 text-stone-300">{item.shortVolumePct}%</td>
                    <td className="p-3">
                      <span
                        className={`font-bold ${
                          item.netBlockDeltaDollar >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {item.netBlockDeltaDollar >= 0 ? "+" : ""}$
                        {(item.netBlockDeltaDollar / 1e6).toFixed(1)}M
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`rounded px-2.5 py-1 text-[10px] font-bold ${
                          item.sentiment === "Bullish Dark Flow"
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/35"
                            : item.sentiment === "Institutional Distribution"
                            ? "bg-rose-500/15 text-rose-400 border border-rose-500/35"
                            : "bg-white/[0.06] text-stone-300"
                        }`}
                      >
                        {item.sentiment}
                      </span>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
