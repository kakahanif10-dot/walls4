export type CalcMode = "atr-sizer" | "kelly" | "dca-ladder";

export type MarginMode = "spot" | "isolated" | "cross";

export type CurrencyCode = "USD" | "EUR" | "GBP" | "JPY" | "CHF" | "SGD" | "IDR";

export type WeightingScheme = "equal" | "scale-down" | "front-loaded";

export interface OhlcBar {
  high: number;
  low: number;
  close: number;
}

export interface LiveFeedTelemetry {
  symbol: string;
  assetClass: "equity" | "crypto";
  priceUsd: number;
  change24hPct: number;
  bidUsd: number;
  askUsd: number;
  spreadBps: number;
  atr14Usd: number;
  atr14Pct: number;
  realizedVol20dPct: number;
  sma20Usd: number;
  sma50Usd: number;
  fundingRatePct: number | null;
  fxRates: Record<CurrencyCode, number>;
  sources: string[];
  asOf: string;
  isFallback: boolean;
}

export const SUPPORTED_CURRENCIES: { code: CurrencyCode; symbol: string; decimals: number }[] = [
  { code: "USD", symbol: "$", decimals: 2 },
  { code: "EUR", symbol: "€", decimals: 2 },
  { code: "GBP", symbol: "£", decimals: 2 },
  { code: "JPY", symbol: "¥", decimals: 0 },
  { code: "CHF", symbol: "CHF ", decimals: 2 },
  { code: "SGD", symbol: "S$", decimals: 2 },
  { code: "IDR", symbol: "Rp", decimals: 0 },
];

export const DEFAULT_FX_RATES: Record<CurrencyCode, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.78,
  JPY: 153.4,
  CHF: 0.88,
  SGD: 1.33,
  IDR: 15850,
};

export const QUICK_TICKERS: { symbol: string; label: string; assetClass: "equity" | "crypto" }[] = [
  { symbol: "NVDA", label: "NVIDIA Corp.", assetClass: "equity" },
  { symbol: "AAPL", label: "Apple Inc.", assetClass: "equity" },
  { symbol: "MSFT", label: "Microsoft", assetClass: "equity" },
  { symbol: "TSLA", label: "Tesla Inc.", assetClass: "equity" },
  { symbol: "BTC", label: "Bitcoin", assetClass: "crypto" },
  { symbol: "ETH", label: "Ethereum", assetClass: "crypto" },
  { symbol: "SOL", label: "Solana", assetClass: "crypto" },
  { symbol: "PEPE", label: "Pepe", assetClass: "crypto" },
];

/** Compute Wilder-style / simple 14-period Average True Range from OHLC bars ordered oldest->newest. */
export function computeAtr14(bars: OhlcBar[]): number {
  if (bars.length < 2) return 0;
  const trs: number[] = [];
  for (let i = 1; i < bars.length; i++) {
    const cur = bars[i];
    const prevClose = bars[i - 1].close;
    const tr = Math.max(
      cur.high - cur.low,
      Math.abs(cur.high - prevClose),
      Math.abs(cur.low - prevClose),
    );
    if (Number.isFinite(tr) && tr >= 0) trs.push(tr);
  }
  if (trs.length === 0) return 0;
  const window = trs.slice(-14);
  return window.reduce((sum, v) => sum + v, 0) / window.length;
}

/** Compute annualized realized volatility (%) from daily closing prices. */
export function computeRealizedVolatilityPct(closes: number[], periodsPerYear = 252): number {
  const clean = closes.filter((c) => Number.isFinite(c) && c > 0);
  if (clean.length < 3) return 0;
  const tail = clean.slice(-21); // 20 daily log returns
  const returns: number[] = [];
  for (let i = 1; i < tail.length; i++) {
    returns.push(Math.log(tail[i] / tail[i - 1]));
  }
  if (returns.length < 2) return 0;
  const mean = returns.reduce((s, r) => s + r, 0) / returns.length;
  const variance =
    returns.reduce((s, r) => s + (r - mean) ** 2, 0) / (returns.length - 1);
  return Math.sqrt(variance * periodsPerYear) * 100;
}

export function computeSma(closes: number[], period: number): number {
  const clean = closes.filter((c) => Number.isFinite(c) && c > 0);
  if (clean.length === 0) return 0;
  const slice = clean.slice(-period);
  return slice.reduce((s, c) => s + c, 0) / slice.length;
}

export interface PrecisionPositionInput {
  accountEquityUsd: number;
  riskPct: number;
  entryPriceUsd: number;
  stopPriceUsd: number;
  targetRMultiple: number;
  leverage: number;
  marginMode: MarginMode;
  feeRateBps: number; // one-way bps (e.g., 5 bps = 0.05%)
  holdingDays: number;
  fundingRate8hPct: number; // e.g. 0.01 means 0.01% per 8h
  direction: "long" | "short";
}

export interface PrecisionPositionResult {
  isValid: boolean;
  error: string | null;
  riskBudgetUsd: number;
  stopDistanceUsd: number;
  stopDistancePct: number;
  quantity: number;
  notionalUsd: number;
  initialMarginUsd: number;
  effectiveLeverage: number;
  liquidationPriceUsd: number | null;
  breakEvenPriceUsd: number;
  roundTripFeesUsd: number;
  estimatedFundingUsd: number;
  targetPriceUsd: number;
  grossProfitAtTargetUsd: number;
  netProfitAtTargetUsd: number;
  netRewardRiskRatio: number;
}

export function calculatePrecisionPosition(input: PrecisionPositionInput): PrecisionPositionResult {
  const equity = Math.max(0, input.accountEquityUsd);
  const riskPct = Math.max(0, input.riskPct);
  const entry = input.entryPriceUsd;
  const stop = input.stopPriceUsd;
  const lev = input.marginMode === "spot" ? 1 : Math.max(1, Math.min(50, input.leverage));
  const feeRate = Math.max(0, input.feeRateBps) / 10000;

  if (equity <= 0 || entry <= 0 || stop <= 0) {
    return {
      isValid: false,
      error: "Account equity, entry price, and stop price must be positive.",
      riskBudgetUsd: 0,
      stopDistanceUsd: 0,
      stopDistancePct: 0,
      quantity: 0,
      notionalUsd: 0,
      initialMarginUsd: 0,
      effectiveLeverage: 0,
      liquidationPriceUsd: null,
      breakEvenPriceUsd: entry,
      roundTripFeesUsd: 0,
      estimatedFundingUsd: 0,
      targetPriceUsd: entry,
      grossProfitAtTargetUsd: 0,
      netProfitAtTargetUsd: 0,
      netRewardRiskRatio: 0,
    };
  }

  if (input.direction === "long" && stop >= entry) {
    return {
      isValid: false,
      error: "For a Long position, Stop Loss must be strictly below Entry Price.",
      riskBudgetUsd: equity * (riskPct / 100),
      stopDistanceUsd: 0,
      stopDistancePct: 0,
      quantity: 0,
      notionalUsd: 0,
      initialMarginUsd: 0,
      effectiveLeverage: 0,
      liquidationPriceUsd: null,
      breakEvenPriceUsd: entry,
      roundTripFeesUsd: 0,
      estimatedFundingUsd: 0,
      targetPriceUsd: entry,
      grossProfitAtTargetUsd: 0,
      netProfitAtTargetUsd: 0,
      netRewardRiskRatio: 0,
    };
  }

  if (input.direction === "short" && stop <= entry) {
    return {
      isValid: false,
      error: "For a Short position, Stop Loss must be strictly above Entry Price.",
      riskBudgetUsd: equity * (riskPct / 100),
      stopDistanceUsd: 0,
      stopDistancePct: 0,
      quantity: 0,
      notionalUsd: 0,
      initialMarginUsd: 0,
      effectiveLeverage: 0,
      liquidationPriceUsd: null,
      breakEvenPriceUsd: entry,
      roundTripFeesUsd: 0,
      estimatedFundingUsd: 0,
      targetPriceUsd: entry,
      grossProfitAtTargetUsd: 0,
      netProfitAtTargetUsd: 0,
      netRewardRiskRatio: 0,
    };
  }

  const riskBudgetUsd = equity * (riskPct / 100);
  const stopDistanceUsd = Math.abs(entry - stop);
  const stopDistancePct = (stopDistanceUsd / entry) * 100;

  // Include 2x fee + funding buffer in effective unit risk so stop-out respects risk budget closely
  const feePerUnit = entry * feeRate * 2;
  const effectiveRiskPerUnit = stopDistanceUsd + feePerUnit;
  const quantity = effectiveRiskPerUnit > 0 ? riskBudgetUsd / effectiveRiskPerUnit : 0;
  const notionalUsd = quantity * entry;
  const initialMarginUsd = notionalUsd / lev;
  const effectiveLeverage = equity > 0 ? notionalUsd / equity : 0;

  const roundTripFeesUsd = notionalUsd * feeRate * 2;
  const fundingPeriods = Math.max(0, input.holdingDays) * 3; // 3x 8h intervals/day
  const fundingSign = input.direction === "long" ? 1 : -1;
  const estimatedFundingUsd =
    input.marginMode === "spot"
      ? 0
      : notionalUsd * (input.fundingRate8hPct / 100) * fundingPeriods * fundingSign;

  // Maintenance margin rate 0.5% standard institutional perp tier
  const mmr = 0.005;
  let liquidationPriceUsd: number | null = null;
  if (input.marginMode === "isolated" && lev > 1) {
    liquidationPriceUsd =
      input.direction === "long"
        ? Math.max(0, entry * (1 - 1 / lev + mmr))
        : entry * (1 + 1 / lev - mmr);
  } else if (input.marginMode === "cross" && notionalUsd > 0) {
    const accountBufferRatio = equity / notionalUsd;
    liquidationPriceUsd =
      input.direction === "long"
        ? Math.max(0, entry * (1 - accountBufferRatio + mmr))
        : entry * (1 + accountBufferRatio - mmr);
  }

  const breakEvenPriceUsd =
    input.direction === "long"
      ? entry * (1 + feeRate * 2) + (quantity > 0 ? Math.max(0, estimatedFundingUsd) / quantity : 0)
      : entry * (1 - feeRate * 2) - (quantity > 0 ? Math.max(0, estimatedFundingUsd) / quantity : 0);

  const rMult = Math.max(0.5, input.targetRMultiple);
  const targetPriceUsd =
    input.direction === "long" ? entry + rMult * stopDistanceUsd : entry - rMult * stopDistanceUsd;
  const grossProfitAtTargetUsd = quantity * stopDistanceUsd * rMult;
  const netProfitAtTargetUsd = grossProfitAtTargetUsd - roundTripFeesUsd - estimatedFundingUsd;
  const netRewardRiskRatio = riskBudgetUsd > 0 ? netProfitAtTargetUsd / riskBudgetUsd : 0;

  return {
    isValid: true,
    error: null,
    riskBudgetUsd,
    stopDistanceUsd,
    stopDistancePct,
    quantity,
    notionalUsd,
    initialMarginUsd,
    effectiveLeverage,
    liquidationPriceUsd,
    breakEvenPriceUsd,
    roundTripFeesUsd,
    estimatedFundingUsd,
    targetPriceUsd,
    grossProfitAtTargetUsd,
    netProfitAtTargetUsd,
    netRewardRiskRatio,
  };
}

export interface KellyInput {
  winRatePct: number; // e.g., 55
  avgWinR: number; // e.g., 2.1
  avgLossR: number; // e.g., 1.0
  fraction: 1 | 0.5 | 0.25;
  accountEquityUsd: number;
}

export interface KellyOutput {
  winProb: number;
  payoffRatio: number;
  fullKellyPct: number;
  recommendedRiskPct: number;
  recommendedRiskUsd: number;
  expectancyR: number;
  profitFactor: number;
  riskOf20PctDrawdownPct: number;
  hasPositiveEdge: boolean;
}

export function calculateKellyMetrics(input: KellyInput): KellyOutput {
  const p = Math.max(0.01, Math.min(0.99, input.winRatePct / 100));
  const q = 1 - p;
  const avgWin = Math.max(0.01, input.avgWinR);
  const avgLoss = Math.max(0.01, input.avgLossR);
  const b = avgWin / avgLoss;

  // Kelly formula: f* = (p * b - q) / b = p - q / b
  const rawKelly = p - q / b;
  const fullKellyPct = Math.max(0, rawKelly * 100);
  const recommendedRiskPct = fullKellyPct * input.fraction;
  const recommendedRiskUsd = Math.max(0, input.accountEquityUsd) * (recommendedRiskPct / 100);

  const expectancyR = p * avgWin - q * avgLoss;
  const profitFactor = (p * avgWin) / (q * avgLoss);

  // Approximate Risk of 20% Drawdown under fractional sizing
  let riskOf20PctDrawdownPct = 100;
  if (expectancyR > 0 && recommendedRiskPct > 0) {
    const unitsTo20Pct = 20 / Math.max(0.1, recommendedRiskPct);
    const edgeFactor = Math.max(0.01, Math.min(0.99, (q / p) * (avgLoss / avgWin)));
    riskOf20PctDrawdownPct = Math.min(99.9, Math.pow(edgeFactor, Math.max(1, unitsTo20Pct * 0.45)) * 100);
  } else if (expectancyR > 0 && recommendedRiskPct === 0) {
    riskOf20PctDrawdownPct = 0;
  }

  return {
    winProb: p,
    payoffRatio: b,
    fullKellyPct,
    recommendedRiskPct,
    recommendedRiskUsd,
    expectancyR,
    profitFactor,
    riskOf20PctDrawdownPct,
    hasPositiveEdge: expectancyR > 0,
  };
}

export interface DcaInput {
  totalBudgetUsd: number;
  topPriceUsd: number;
  bottomPriceUsd: number;
  tranches: number;
  scheme: WeightingScheme;
  targetPriceUsd: number;
  stopPriceUsd: number;
  feeRateBps: number;
}

export interface DcaTrancheRow {
  index: number;
  priceUsd: number;
  weightPct: number;
  allocationUsd: number;
  units: number;
}

export interface DcaOutput {
  isValid: boolean;
  error: string | null;
  rows: DcaTrancheRow[];
  totalUnits: number;
  weightedAvgEntryUsd: number;
  breakEvenUsd: number;
  projectedReturnPct: number;
  projectedNetProfitUsd: number;
  maxLossAtStopUsd: number;
  blendedRr: number;
}

export function calculateDcaLadder(input: DcaInput): DcaOutput {
  const n = Math.max(2, Math.min(6, Math.round(input.tranches)));
  const budget = Math.max(0, input.totalBudgetUsd);
  const top = input.topPriceUsd;
  const bottom = input.bottomPriceUsd;
  const feeRate = Math.max(0, input.feeRateBps) / 10000;

  if (budget <= 0 || top <= 0 || bottom <= 0 || top <= bottom) {
    return {
      isValid: false,
      error: "Top entry must exceed bottom entry, and all prices/budget must be positive.",
      rows: [],
      totalUnits: 0,
      weightedAvgEntryUsd: 0,
      breakEvenUsd: 0,
      projectedReturnPct: 0,
      projectedNetProfitUsd: 0,
      maxLossAtStopUsd: 0,
      blendedRr: 0,
    };
  }

  const rawWeights: number[] = [];
  for (let i = 0; i < n; i++) {
    if (input.scheme === "equal") rawWeights.push(1);
    else if (input.scheme === "scale-down") rawWeights.push(i + 1); // heavier lower down
    else rawWeights.push(n - i); // front-loaded near top
  }
  const weightSum = rawWeights.reduce((s, w) => s + w, 0);

  const step = (top - bottom) / (n - 1);
  const rows: DcaTrancheRow[] = [];
  let totalUnits = 0;

  for (let i = 0; i < n; i++) {
    const priceUsd = top - step * i;
    const weightPct = (rawWeights[i] / weightSum) * 100;
    const allocationUsd = budget * (rawWeights[i] / weightSum);
    const units = allocationUsd / priceUsd;
    totalUnits += units;
    rows.push({
      index: i + 1,
      priceUsd,
      weightPct,
      allocationUsd,
      units,
    });
  }

  const weightedAvgEntryUsd = totalUnits > 0 ? budget / totalUnits : 0;
  const breakEvenUsd = weightedAvgEntryUsd * (1 + feeRate * 2);
  const grossExitUsd = totalUnits * Math.max(0, input.targetPriceUsd);
  const feesUsd = (budget + grossExitUsd) * feeRate;
  const projectedNetProfitUsd = grossExitUsd - budget - feesUsd;
  const projectedReturnPct = budget > 0 ? (projectedNetProfitUsd / budget) * 100 : 0;

  const stopExitUsd = totalUnits * Math.max(0, input.stopPriceUsd);
  const maxLossAtStopUsd = Math.max(0, budget - stopExitUsd + budget * feeRate * 2);
  const blendedRr = maxLossAtStopUsd > 0 ? projectedNetProfitUsd / maxLossAtStopUsd : 0;

  return {
    isValid: true,
    error: null,
    rows,
    totalUnits,
    weightedAvgEntryUsd,
    breakEvenUsd,
    projectedReturnPct,
    projectedNetProfitUsd,
    maxLossAtStopUsd,
    blendedRr,
  };
}

export function formatCurrencyValue(
  usdValue: number,
  currency: CurrencyCode,
  fxRates: Record<CurrencyCode, number>,
): string {
  const rate = fxRates[currency] ?? 1;
  const converted = usdValue * rate;
  const meta = SUPPORTED_CURRENCIES.find((c) => c.code === currency) ?? SUPPORTED_CURRENCIES[0];
  const sign = converted < 0 ? "-" : "";
  const formatted = Math.abs(converted).toLocaleString("en-US", {
    minimumFractionDigits: meta.decimals,
    maximumFractionDigits: meta.decimals,
  });
  return `${sign}${meta.symbol}${formatted}`;
}

export function formatPriceAdaptive(priceUsd: number): string {
  if (!Number.isFinite(priceUsd) || priceUsd <= 0) return "$0.00";
  if (priceUsd < 0.001) return `$${priceUsd.toFixed(7)}`;
  if (priceUsd < 1) return `$${priceUsd.toFixed(4)}`;
  return `$${priceUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
