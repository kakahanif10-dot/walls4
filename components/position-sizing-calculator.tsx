"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Calculator,
  Sliders,
  ShieldAlert,
  Check,
  Copy,
  TrendingUp,
  AlertTriangle,
  Percent,
  DollarSign,
  Info,
  RefreshCw,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";
import { ASSETS, ASSET_BY_SYMBOL, fmtPrice, fmtPct, metricsFor, type Asset } from "@/lib/market";
import { useQuote } from "@/components/live-prices";
import { useAuth } from "@/lib/auth-context";
import WhopBadge from "@/components/whop-badge";
import { supabase } from "@/lib/supabase";

interface PositionSizingCalculatorProps {
  initialSymbol?: string;
  initialPrice?: number;
  initialVolatility?: number;
  initialInvalidation?: number;
  compact?: boolean;
}

const ACCOUNT_PRESETS = [10_000, 25_000, 50_000, 100_000, 250_000];
const RISK_PRESETS = [0.25, 0.5, 1.0, 1.5, 2.0];

export default function PositionSizingCalculator({
  initialSymbol = "NVDA",
  initialPrice,
  initialVolatility,
  initialInvalidation,
  compact = false,
}: PositionSizingCalculatorProps) {
  const { user } = useAuth();

  // Selected asset
  const [symbol, setSymbol] = useState(initialSymbol);
  const liveQuote = useQuote(symbol);
  const [hasManualPriceEdit, setHasManualPriceEdit] = useState(false);
  const [assetSearch, setAssetSearch] = useState("");
  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false);

  // Derive initial values from asset database if not directly passed
  const currentAsset: Asset | undefined = useMemo(() => {
    return ASSET_BY_SYMBOL[symbol] || ASSETS[0];
  }, [symbol]);

  const assetMetrics = useMemo(() => {
    if (!currentAsset) return null;
    return metricsFor(currentAsset);
  }, [currentAsset]);

  // Pricing & Model defaults
  const defaultPrice = initialPrice ?? liveQuote?.price ?? assetMetrics?.last ?? 100;
  const defaultVol = initialVolatility ?? (assetMetrics?.vol ? assetMetrics.vol * 100 : 35);
  const defaultInvalidation =
    initialInvalidation ??
    (assetMetrics
      ? assetMetrics.score >= 47
        ? Math.min(assetMetrics.sma20, assetMetrics.sma50) * 0.975
        : Math.max(assetMetrics.sma20, assetMetrics.sma50) * 1.02
      : defaultPrice * 0.95);

  // Calculator Inputs
  const [accountSize, setAccountSize] = useState<number>(100_000);
  const [accountRiskPct, setAccountRiskPct] = useState<number>(1.0);
  const [price, setPrice] = useState<number>(defaultPrice);
  const [volatility, setVolatility] = useState<number>(defaultVol);
  const [invalidationLevel, setInvalidationLevel] = useState<number>(defaultInvalidation);
  const [useVolAdjustment, setUseVolAdjustment] = useState<boolean>(true);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [savedPreferenceNotice, setSavedPreferenceNotice] = useState<boolean>(false);

  // Sync inputs when symbol or initial props change
  useEffect(() => {
    if (initialPrice) setPrice(initialPrice);
    else if (!hasManualPriceEdit) {
      if (liveQuote?.price) setPrice(liveQuote.price);
      else if (assetMetrics?.last) setPrice(assetMetrics.last);
    }

    if (initialVolatility) setVolatility(initialVolatility);
    else if (assetMetrics?.vol) setVolatility(Math.round(assetMetrics.vol * 1000) / 10);

    if (initialInvalidation) setInvalidationLevel(initialInvalidation);
    else if (assetMetrics) {
      const inv =
        assetMetrics.score >= 47
          ? Math.min(assetMetrics.sma20, assetMetrics.sma50) * 0.975
          : Math.max(assetMetrics.sma20, assetMetrics.sma50) * 1.02;
      setInvalidationLevel(Math.round(inv * 1000) / 1000);
    }
  }, [symbol, initialPrice, initialVolatility, initialInvalidation, assetMetrics, liveQuote?.price, hasManualPriceEdit]);

  useEffect(() => {
    if (!user) return;
    let active = true;
    const loadPreferences = async () => {
      const { data, error } = await supabase.from("profiles").select("calculator_account_size,calculator_risk_pct").eq("id", user.id).maybeSingle();
      if (!active) return;
      if (error) {
        console.error("[v0] Could not load Supabase calculator preferences:", error);
        return;
      }
      if (data?.calculator_account_size) setAccountSize(Number(data.calculator_account_size));
      if (data?.calculator_risk_pct) setAccountRiskPct(Number(data.calculator_risk_pct));
    };
    void loadPreferences();
    return () => { active = false; };
  }, [user]);

  const savePreferencesToSupabase = async () => {
    if (!user) return;
    const { error } = await supabase.from("profiles").update({
      calculator_account_size: accountSize,
      calculator_risk_pct: accountRiskPct,
      updated_at: new Date().toISOString(),
    }).eq("id", user.id);
    if (error) {
      console.error("[v0] Could not save Supabase calculator preferences:", error);
      return;
    }
    setSavedPreferenceNotice(true);
    setTimeout(() => setSavedPreferenceNotice(false), 3000);
  };

  // Reset to current asset defaults
  const handleResetToModel = useCallback(() => {
    if (!assetMetrics) return;
    setHasManualPriceEdit(false);
    setPrice(liveQuote?.price ?? assetMetrics.last);
    setVolatility(Math.round(assetMetrics.vol * 1000) / 10);
    const inv =
      assetMetrics.score >= 47
        ? Math.min(assetMetrics.sma20, assetMetrics.sma50) * 0.975
        : Math.max(assetMetrics.sma20, assetMetrics.sma50) * 1.02;
    setInvalidationLevel(Math.round(inv * 1000) / 1000);
  }, [assetMetrics, liveQuote?.price]);

  // Calculations
  const calculations = useMemo(() => {
    const safePrice = Math.max(0.000001, price);
    const safeInvalidation = Math.max(0.0000001, invalidationLevel);
    const safeAccount = Math.max(1, accountSize);
    const safeRiskPct = Math.max(0.01, accountRiskPct);
    const safeVol = Math.max(5, volatility);

    // 1. Dollar Risk at Stop
    const maxRiskDollars = (safeAccount * safeRiskPct) / 100;

    // 2. Stop Distance (per unit)
    const perUnitRisk = Math.abs(safePrice - safeInvalidation);
    const stopDistancePct = (perUnitRisk / safePrice) * 100;

    // 3. Raw Capital-at-Risk Position Sizing
    const rawUnits = perUnitRisk > 0 ? maxRiskDollars / perUnitRisk : 0;
    const rawPositionValue = rawUnits * safePrice;

    // 4. Volatility Scaling Factor (Benchmark: 25% annualized equity vol)
    // Higher vol reduces position size to normalize variance
    const benchmarkVol = 25;
    const volDampener = Math.min(1.2, Math.max(0.35, benchmarkVol / safeVol));
    const volAdjustedPositionValue = useVolAdjustment ? rawPositionValue * volDampener : rawPositionValue;
    const volAdjustedUnits = volAdjustedPositionValue / safePrice;

    // 5. Asset Class Regulatory / Desk Allocation Caps
    const assetKind = currentAsset?.kind || "stock";
    let maxAllocationPct = 20; // 20% max for equities
    let capReason = "Standard equity risk cap (20% portfolio max)";

    if (assetKind === "crypto") {
      maxAllocationPct = 8; // 8% max for major digital assets
      capReason = "Crypto liquidity & gap-risk cap (8% portfolio max)";
    } else if (assetKind === "meme") {
      maxAllocationPct = 2; // Hard 2% cap for pump.fun meme coins
      capReason = "Meme coin concentration & zero-liquidity cap (2% hard max)";
    }

    const maxAllowedPositionValue = (safeAccount * maxAllocationPct) / 100;
    const isCapped = volAdjustedPositionValue > maxAllowedPositionValue;
    const finalPositionValue = isCapped ? maxAllowedPositionValue : volAdjustedPositionValue;
    const finalUnits = finalPositionValue / safePrice;
    const portfolioAllocationPct = (finalPositionValue / safeAccount) * 100;

    // 6. Actual Dollar Risk at Invalidation under final size
    const actualDollarRisk = finalUnits * perUnitRisk;
    const actualRiskPct = (actualDollarRisk / safeAccount) * 100;

    // 7. Profit Targets based on Risk Multiple (R:R)
    const isLong = safePrice >= safeInvalidation;
    const target1R = isLong ? safePrice + perUnitRisk : safePrice - perUnitRisk;
    const target2R = isLong ? safePrice + perUnitRisk * 2 : safePrice - perUnitRisk * 2;
    const target3R = isLong ? safePrice + perUnitRisk * 3 : safePrice - perUnitRisk * 3;

    const profitAt2R = actualDollarRisk * 2;
    const profitAt3R = actualDollarRisk * 3;

    return {
      maxRiskDollars,
      perUnitRisk,
      stopDistancePct,
      rawPositionValue,
      volDampener,
      finalPositionValue,
      finalUnits,
      portfolioAllocationPct,
      actualDollarRisk,
      actualRiskPct,
      maxAllocationPct,
      capReason,
      isCapped,
      isLong,
      target1R,
      target2R,
      target3R,
      profitAt2R,
      profitAt3R,
    };
  }, [price, invalidationLevel, accountSize, accountRiskPct, volatility, useVolAdjustment, currentAsset]);

  const copyPositionPlan = () => {
    const text = `NextWallStreet Position Plan:
Asset: $${symbol} (${currentAsset?.name || symbol})
Entry: $${price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })}
Model Invalidation: $${invalidationLevel.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 6 })} (${calculations.stopDistancePct.toFixed(2)}% distance)
Account Risk: $${calculations.actualDollarRisk.toFixed(0)} (${calculations.actualRiskPct.toFixed(2)}% of $${accountSize.toLocaleString()})
Suggested Size: $${calculations.finalPositionValue.toFixed(0)} (${calculations.portfolioAllocationPct.toFixed(1)}% notional)
Suggested Units: ${calculations.finalUnits.toLocaleString("en-US", { maximumFractionDigits: 4 })} shares/tokens
Target 2R: $${calculations.target2R.toFixed(2)} (+$${calculations.profitAt2R.toFixed(0)})
Target 3R: $${calculations.target3R.toFixed(2)} (+$${calculations.profitAt3R.toFixed(0)})
${calculations.isCapped ? `Note: Capped by ${calculations.capReason}` : ""}`;

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  // Filtered asset search
  const filteredAssets = useMemo(() => {
    if (!assetSearch.trim()) return ASSETS.slice(0, 15);
    const q = assetSearch.toLowerCase();
    return ASSETS.filter((a) => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)).slice(0, 15);
  }, [assetSearch]);

  return (
    <div className="rounded-2xl bg-ink-900/55 p-6 sm:p-7 backdrop-blur">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gold/20 text-gold-bright">
              <Calculator className="h-3.5 w-3.5" />
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
              Quantitative Risk Desk
            </span>
          </div>
          <h3 className="mt-1 font-display text-xl sm:text-2xl text-bone flex flex-wrap items-center gap-2">
            <span>Position Sizing &amp; Invalidation Calculator</span>
            <WhopBadge variant="pro" />
          </h3>
          <p className="mt-0.5 text-xs text-muted">
            Sizes capital strictly against the model&apos;s technical invalidation level and 60-day realized volatility.
          </p>
        </div>

        {/* Asset Switcher */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsAssetSelectorOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl bg-ink-950/75 px-3.5 py-2 text-xs text-bone hover:bg-ink-950 transition-colors"
          >
            <span className="font-mono font-bold text-gold-bright">${symbol}</span>
            <span className="text-muted truncate max-w-[100px]">{currentAsset?.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted" />
          </button>

          {isAssetSelectorOpen && (
            <div className="absolute right-0 mt-1.5 w-64 rounded-xl bg-ink-900 shadow-2xl z-50 p-2.5 animate-in fade-in zoom-in-95">
              <input
                type="text"
                placeholder="Search symbol (e.g. BTC, NVDA, SOL)..."
                value={assetSearch}
                onChange={(e) => setAssetSearch(e.target.value)}
                className="w-full rounded-lg bg-ink-950 px-2.5 py-1.5 text-xs text-bone placeholder:text-muted/60 focus:outline-none focus:ring-1 focus:ring-gold/40"
                autoFocus
              />
              <div className="mt-1.5 max-h-48 overflow-y-auto space-y-0.5">
                {filteredAssets.map((a) => (
                  <button
                    key={a.symbol}
                    type="button"
                    onClick={() => {
                      setSymbol(a.symbol);
                      setHasManualPriceEdit(false);
                      setIsAssetSelectorOpen(false);
                      setAssetSearch("");
                    }}
                    className={`flex w-full items-center justify-between rounded px-2 py-1.5 text-xs transition-colors ${
                      a.symbol === symbol ? "bg-gold/15 text-gold-bright" : "text-bone hover:bg-ink-800"
                    }`}
                  >
                    <span className="font-mono font-semibold">{a.symbol}</span>
                    <span className="text-[10px] text-muted truncate max-w-[120px]">{a.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Inputs vs Outputs */}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1.3fr]">
        {/* Left Column: Interactive Inputs */}
        <div className="space-y-5">
          {/* 1. Account Size */}
          <div>
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="account-size-input" className="text-muted font-medium flex items-center gap-1.5">
                <DollarSign className="h-3 w-3 text-gold" />
                Total Portfolio Capital
              </label>
              <span className="font-mono text-bone font-semibold">${accountSize.toLocaleString()}</span>
            </div>
            <div className="mt-2 flex gap-1.5">
              {ACCOUNT_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAccountSize(preset)}
                  className={`flex-1 rounded-lg py-1.5 font-mono text-[11px] transition ${
                    accountSize === preset
                      ? "bg-gold/20 font-bold text-gold-bright"
                      : "bg-ink-950/75 text-muted hover:bg-ink-950 hover:text-bone"
                  }`}
                >
                  ${preset >= 1000 ? `${preset / 1000}k` : preset}
                </button>
              ))}
            </div>
            <input
              id="account-size-input"
              type="number"
              min="100"
              step="1000"
              value={accountSize}
              onChange={(e) => setAccountSize(Math.max(1, Number(e.target.value)))}
              className="mt-2 w-full rounded-xl bg-ink-950/80 px-3.5 py-2 font-mono text-sm text-bone focus:outline-none focus:ring-1 focus:ring-gold/40"
            />
          </div>

          {/* 2. Account Risk Percentage */}
          <div>
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="account-risk-slider" className="text-muted font-medium flex items-center gap-1.5">
                <Percent className="h-3 w-3 text-gold" />
                Account Risk per Trade
              </label>
              <span className="font-mono font-bold text-gold-bright">
                {accountRiskPct.toFixed(2)}% ($
                {((accountSize * accountRiskPct) / 100).toLocaleString(undefined, { maximumFractionDigits: 0 })})
              </span>
            </div>
            <div className="mt-2 flex gap-1.5">
              {RISK_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setAccountRiskPct(preset)}
                  className={`flex-1 rounded-lg py-1.5 font-mono text-[11px] transition ${
                    accountRiskPct === preset
                      ? "bg-gold/20 font-bold text-gold-bright"
                      : "bg-ink-950/75 text-muted hover:bg-ink-950 hover:text-bone"
                  }`}
                >
                  {preset}%
                </button>
              ))}
            </div>
            <input
              id="account-risk-slider"
              type="range"
              min="0.1"
              max="3.0"
              step="0.05"
              value={accountRiskPct}
              onChange={(e) => setAccountRiskPct(Number(e.target.value))}
              className="mt-3 w-full accent-gold cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-muted/70 font-mono">
              <span>0.1% (Low)</span>
              <span>1.0% (Institutional Standard)</span>
              <span>3.0% (High Beta)</span>
            </div>
          </div>

          {/* 3. Market Price, Invalidation, and Volatility Inputs */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <label htmlFor="entry-price-input" className="block text-[11px] text-muted">Current Entry Price ($)</label>
              <input
                id="entry-price-input"
                type="number"
                step="any"
                value={price}
                onChange={(e) => {
                  setHasManualPriceEdit(true);
                  setPrice(Number(e.target.value));
                }}
                className="mt-1 w-full rounded-xl bg-ink-950/80 px-3 py-2 font-mono text-xs text-bone focus:outline-none focus:ring-1 focus:ring-gold/40"
              />
            </div>

            <div>
              <label htmlFor="invalidation-level-input" className="block text-[11px] text-muted">
                Model Invalidation ($)
              </label>
              <input
                id="invalidation-level-input"
                type="number"
                step="any"
                value={invalidationLevel}
                onChange={(e) => setInvalidationLevel(Number(e.target.value))}
                className="mt-1 w-full rounded-xl bg-ink-950/80 px-3 py-2 font-mono text-xs text-bone focus:outline-none focus:ring-1 focus:ring-gold/40"
              />
            </div>
          </div>

          {/* 4. Realized Volatility Slider */}
          <div>
            <div className="flex items-center justify-between text-xs">
              <label htmlFor="volatility-slider" className="text-muted font-medium flex items-center gap-1.5">
                <Sliders className="h-3 w-3 text-gold" />
                60-Day Realized Volatility
              </label>
              <span className="font-mono text-bone font-semibold">{volatility.toFixed(1)}%</span>
            </div>
            <input
              id="volatility-slider"
              type="range"
              min="10"
              max="150"
              step="1"
              value={volatility}
              onChange={(e) => setVolatility(Number(e.target.value))}
              className="mt-2 w-full accent-gold cursor-pointer"
            />
            <div className="flex items-center justify-between text-[10px] text-muted">
              <span>Low (&lt;24%)</span>
              <span>Moderate (24-42%)</span>
              <span>High (&gt;75%)</span>
            </div>
          </div>

          {/* Volatility Dampener Toggle & Reset Button */}
          <div className="flex items-center justify-between pt-2 text-xs">
            <label className="flex items-center gap-2 cursor-pointer text-muted hover:text-bone">
              <input
                type="checkbox"
                checked={useVolAdjustment}
                onChange={(e) => setUseVolAdjustment(e.target.checked)}
                className="rounded bg-ink-950 accent-gold focus:ring-0"
              />
              <span>Apply Volatility Parity Dampener</span>
            </label>

            <button
              type="button"
              onClick={handleResetToModel}
              className="flex items-center gap-1 text-[11px] text-muted hover:text-gold-bright transition-colors"
            >
              <RefreshCw className="h-3 w-3" />
              Reset to Model
            </button>
          </div>

          {/* User Preferences Persistence */}
          {user && (
            <div className="flex items-center justify-between rounded-xl bg-emerald-950/30 px-3.5 py-2.5 text-xs">
              <span className="text-[11px] text-emerald-300">
                {savedPreferenceNotice ? "✓ Risk defaults saved to Supabase!" : "Save these risk defaults to your account"}
              </span>
              <button
                type="button"
                onClick={savePreferencesToSupabase}
                className="rounded-lg bg-emerald-500/20 px-2.5 py-1 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500/30 transition-colors"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Suggested Sizing & Risk Analysis Cards */}
        <div className="space-y-4">
          {/* Main Sizing Result Banner */}
          <div className="rounded-2xl bg-gradient-to-br from-gold/[0.14] via-ink-950/85 to-ink-950 p-5 sm:p-6">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold-bright">
                Suggested Position Size
              </span>
              <span className="rounded-full bg-gold/20 px-2.5 py-0.5 font-mono text-xs font-bold text-gold-bright">
                {calculations.portfolioAllocationPct.toFixed(1)}% of Account
              </span>
            </div>

            <div className="mt-3 flex items-baseline gap-3">
              <span className="font-mono text-3xl sm:text-4xl font-bold text-bone">
                ${calculations.finalPositionValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
              <span className="font-mono text-sm text-muted">
                ≈ {calculations.finalUnits >= 1 ? calculations.finalUnits.toLocaleString(undefined, { maximumFractionDigits: 2 }) : calculations.finalUnits.toFixed(4)} {symbol}
              </span>
            </div>

            {/* Allocation Meter */}
            <div className="mt-4">
              <div className="flex justify-between text-[11px] text-muted font-mono">
                <span>Allocation</span>
                <span>Max Safe Cap: {calculations.maxAllocationPct}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink-900">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    calculations.isCapped ? "bg-amber-400" : "bg-gradient-to-r from-emerald-400 to-gold"
                  }`}
                  style={{ width: `${Math.min(100, (calculations.portfolioAllocationPct / calculations.maxAllocationPct) * 100)}%` }}
                />
              </div>
            </div>

            {/* Cap Warning if hit */}
            {calculations.isCapped && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-500/15 p-3 text-xs text-amber-200">
                <AlertTriangle className="h-4 w-4 shrink-0 text-amber-400 mt-0.5" />
                <p className="leading-snug">
                  <strong className="text-amber-300">Position Capped:</strong> Size was throttled to {calculations.maxAllocationPct}% by the {calculations.capReason} to guard against adverse gap risk.
                </p>
              </div>
            )}
          </div>

          {/* Risk Metrics Breakdown Grid */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-ink-950/75 px-4 py-3">
              <span className="text-[10px] uppercase tracking-wider text-muted">Dollar Risk (1R)</span>
              <p className="mt-1 font-mono text-base font-bold text-down">
                -${calculations.actualDollarRisk.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="text-[10px] text-muted/70">{calculations.actualRiskPct.toFixed(2)}% portfolio</p>
            </div>

            <div className="rounded-xl bg-ink-950/75 px-4 py-3">
              <span className="text-[10px] uppercase tracking-wider text-muted">Stop Distance</span>
              <p className="mt-1 font-mono text-base font-bold text-bone">
                {calculations.stopDistancePct.toFixed(2)}%
              </p>
              <p className="text-[10px] text-muted/70">
                ${calculations.perUnitRisk.toLocaleString(undefined, { maximumFractionDigits: 2 })}/unit
              </p>
            </div>

            <div className="rounded-xl bg-ink-950/75 px-4 py-3 col-span-2 sm:col-span-1">
              <span className="text-[10px] uppercase tracking-wider text-muted">Vol Factor</span>
              <p className="mt-1 font-mono text-base font-bold text-gold-bright">
                {(calculations.volDampener * 100).toFixed(0)}%
              </p>
              <p className="text-[10px] text-muted/70">variance dampener</p>
            </div>
          </div>

          {/* Profit Target Levels (Risk-Reward Multiples) */}
          <div className="rounded-xl bg-ink-950/65 p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-bone flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-up" />
                Risk / Reward Target Framework
              </span>
              <span className="text-[10px] text-muted">Derived from Invalidation Delta</span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2.5 text-center">
              <div className="rounded-xl bg-ink-900/75 p-2.5">
                <span className="text-[10px] uppercase font-mono text-muted">1R Target</span>
                <p className="mt-0.5 font-mono text-xs font-bold text-bone">
                  ${calculations.target1R.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </p>
                <span className="text-[10px] text-emerald-400 font-mono">+${calculations.actualDollarRisk.toFixed(0)}</span>
              </div>

              <div className="rounded-xl bg-gold/[0.12] p-2.5">
                <span className="text-[10px] uppercase font-mono text-gold-bright">2R Target</span>
                <p className="mt-0.5 font-mono text-xs font-bold text-gold-bright">
                  ${calculations.target2R.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </p>
                <span className="text-[10px] text-emerald-400 font-mono">+${calculations.profitAt2R.toFixed(0)}</span>
              </div>

              <div className="rounded-xl bg-ink-900/75 p-2.5">
                <span className="text-[10px] uppercase font-mono text-muted">3R Runner</span>
                <p className="mt-0.5 font-mono text-xs font-bold text-bone">
                  ${calculations.target3R.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                </p>
                <span className="text-[10px] text-emerald-400 font-mono">+${calculations.profitAt3R.toFixed(0)}</span>
              </div>
            </div>
          </div>

          {/* Copy Button & Methodology link */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
            <button
              type="button"
              onClick={copyPositionPlan}
              className="flex w-full sm:w-auto items-center justify-center gap-2 rounded-full bg-gold px-4 py-2 text-xs font-semibold text-ink-950 hover:bg-gold-bright transition shadow-md"
            >
              {isCopied ? <Check className="h-3.5 w-3.5 text-ink-950" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{isCopied ? "Position Plan Copied!" : "Copy Order Sizing Plan"}</span>
            </button>

            <Link
              href="/disclaimer"
              className="text-[11px] text-muted hover:text-gold-bright transition-colors flex items-center gap-1"
            >
              <Info className="h-3 w-3" />
              Sizing rules &amp; methodology
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
