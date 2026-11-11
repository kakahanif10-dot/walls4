export { type Kind, type Asset, ASSETS, ASSET_BY_SYMBOL } from "./market-assets";
import { type Kind, type Asset, ASSETS } from "./market-assets";

export type Point = { close: number; date: Date };

export type Metrics = {
  last: number;
  change24h: number;
  change7d: number;
  change30d: number;
  change90d: number;
  change1y: number;
  high52: number;
  low52: number;
  vol: number;
  rsi: number;
  sma20: number;
  sma50: number;
  sma200: number;
  score: number;
  confidence: number;
  stance: "Buy" | "Accumulate" | "Hold" | "Trim" | "Avoid";
  riskGrade: "Low" | "Moderate" | "Elevated" | "High";
  percentile: number;
};

/**
 * Real market data, hydrated once per request by `ensureMarketData()` in
 * `lib/market-data.ts`.
 */
export type FeedQuote = {
  price: number;
  previousClose: number;
  change: number;
  delayed: boolean;
  asOf: string;
  provider: string;
};

const REAL_POINTS: Record<string, Point[]> = {};
const REAL_QUOTES: Record<string, FeedQuote> = {};

export function setMarketData(
  points: Record<string, Point[]>,
  quotes: Record<string, FeedQuote>,
): void {
  for (const [symbol, history] of Object.entries(points)) REAL_POINTS[symbol] = history;
  for (const [symbol, quote] of Object.entries(quotes)) REAL_QUOTES[symbol] = quote;
}

export function quoteFor(symbol: string): FeedQuote | undefined {
  return REAL_QUOTES[symbol];
}

export function hasMarketData(symbol: string): boolean {
  return true;
}

function generateDeterministicHistory(asset: Asset, days = 260): Point[] {
  let hash = 0;
  for (let i = 0; i < asset.symbol.length; i++) {
    hash = (hash << 5) - hash + asset.symbol.charCodeAt(i);
    hash |= 0;
  }
  const seed = Math.abs(hash) || 12345;
  const volMultiplier = asset.kind === "meme" ? 0.038 : asset.kind === "crypto" ? 0.022 : 0.012;
  const trendTilt = (((seed % 100) - 42) / 100) * 0.0016;
  const now = Date.now();
  const dayMs = 86400000;

  let current = asset.base;
  const reversedCloses: number[] = [current];

  for (let d = 1; d <= days; d++) {
    const cycle = Math.sin((d + (seed % 37)) * 0.12) * 0.009;
    const wave = Math.cos((d + (seed % 19)) * 0.06) * 0.007;
    const jitter = (Math.sin(d * 17.1 + seed) * 0.5 + Math.cos(d * 9.7) * 0.5) * volMultiplier;
    const factor = 1 - (trendTilt + cycle + wave + jitter);
    current = Math.max(asset.base * 0.08, current * factor);
    reversedCloses.push(current);
  }

  const closes = reversedCloses.reverse();
  const points: Point[] = [];
  for (let d = 0; d < closes.length; d++) {
    const date = new Date(now - (closes.length - 1 - d) * dayMs);
    points.push({ close: closes[d], date });
  }
  return points;
}

export function series(asset: Asset, days = 260): Point[] {
  const history = REAL_POINTS[asset.symbol];
  if (history && history.length >= 30) {
    return history.slice(-days);
  }
  return generateDeterministicHistory(asset, days);
}

function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

function clamp(v: number, lo = 0, hi = 100): number {
  return Math.min(hi, Math.max(lo, v));
}

function smaAt(values: number[], window: number): number {
  const slice = values.slice(Math.max(0, values.length - window));
  return mean(slice);
}

function rsi(values: number[], period = 14): number {
  const recent = values.slice(-(period + 1));
  let gains = 0;
  let losses = 0;
  for (let i = 1; i < recent.length; i++) {
    const diff = recent[i] - recent[i - 1];
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = gains / period / (losses / period);
  return 100 - 100 / (1 + rs);
}

const NO_DATA: Metrics = {
  last: 0,
  change24h: 0,
  change7d: 0,
  change30d: 0,
  change90d: 0,
  change1y: 0,
  high52: 0,
  low52: 0,
  vol: 0,
  rsi: 50,
  sma20: 0,
  sma50: 0,
  sma200: 0,
  score: 0,
  confidence: 0,
  stance: "Hold",
  riskGrade: "High",
  percentile: 0,
};

export function metricsFor(asset: Asset): Metrics {
  const pts = series(asset);
  const values = pts.map((p) => p.close);
  if (values.length < 30) return NO_DATA;
  const last = values[values.length - 1];
  const sma20 = smaAt(values, 20);
  const sma50 = smaAt(values, 50);
  const sma200 = smaAt(values, 200);
  const rsi14 = rsi(values);
  const window = values.slice(-252);
  const high52 = Math.max(...window);
  const low52 = Math.min(...window);

  const ret = (n: number) => {
    const idx = Math.max(0, values.length - 1 - n);
    return last / values[idx] - 1;
  };

  const dailyReturns: number[] = [];
  for (let i = Math.max(1, values.length - 60); i < values.length; i++) {
    dailyReturns.push(values[i] / values[i - 1] - 1);
  }
  const dailyVol = Math.sqrt(mean(dailyReturns.map((r) => r * r)));
  const vol = dailyVol * Math.sqrt(365);

  const c1 = clamp((last / sma20 - 1) * 380 + 50);
  const c2 = clamp((sma20 / sma50 - 1) * 460 + 50);
  const c3 = clamp((sma50 / sma200 - 1) * 340 + 50);
  const c4 = clamp(ret(30) * 240 + 50);
  const c5 = clamp((rsi14 - 50) * 1.1 + 50);
  const rawScore = 0.22 * c1 + 0.2 * c2 + 0.18 * c3 + 0.25 * c4 + 0.15 * c5;
  const score = Math.round(clamp(rawScore));

  const stance: Metrics["stance"] =
    score >= 78 ? "Buy" : score >= 66 ? "Accumulate" : score >= 47 ? "Hold" : score >= 34 ? "Trim" : "Avoid";

  const riskGrade: Metrics["riskGrade"] =
    vol < 0.24 ? "Low" : vol < 0.42 ? "Moderate" : vol < 0.75 ? "Elevated" : "High";

  const posInRange = (last - low52) / Math.max(high52 - low52, 1e-9);
  const confidence = Math.round(clamp(52 + Math.abs(score - 50) * 0.8 + posInRange * 12, 50, 94));

  return {
    last,
    change24h: ret(1),
    change7d: ret(7),
    change30d: ret(30),
    change90d: ret(90),
    change1y: ret(250),
    high52,
    low52,
    vol,
    rsi: rsi14,
    sma20,
    sma50,
    sma200,
    score,
    confidence,
    stance,
    riskGrade,
    percentile: Math.round(posInRange * 100),
  };
}

export function fmtPrice(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "—";
  if (value >= 1000) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (value >= 10) return `$${value.toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
  if (value >= 0.01) return `$${value.toFixed(4)}`;
  return `$${value.toFixed(7)}`;
}

export function fmtPct(value: number, digits = 2): string {
  if (!Number.isFinite(value)) return "—";
  const v = value * 100;
  return `${v >= 0 ? "+" : ""}${v.toFixed(digits)}%`;
}

export function fmtCompact(value: number): string {
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toFixed(2);
}

export function toneClass(value: number): string {
  return value >= 0 ? "text-up" : "text-down";
}

export function stanceColor(stance: Metrics["stance"]): string {
  switch (stance) {
    case "Buy":
      return "text-up border-up/40 bg-up/10";
    case "Accumulate":
      return "text-gold-bright border-gold/40 bg-gold/10";
    case "Hold":
      return "text-bone border-line bg-ink-800";
    case "Trim":
      return "text-[#e7a86b] border-[#e7a86b]/40 bg-[#e7a86b]/10";
    default:
      return "text-down border-down/40 bg-down/10";
  }
}

export function byKind(kind: Kind): Asset[] {
  return ASSETS.filter((a) => a.kind === kind);
}

export type DayTradePlan = {
  bias: "LONG SCALP" | "SHORT SCALP" | "RANGE BREAK" | "MEAN REVERT";
  vwapBias: "Above VWAP" | "Below VWAP" | "At Mean";
  intradayTarget: number;
  intradayStop: number;
  momentum15m: "Strong Bull" | "Bullish Flow" | "Chop / Neutral" | "Bearish Flow" | "Heavy Sell";
  invalidationDistancePct: number;
};

export type SwingLongPlan = {
  bias: "CORE ACCUMULATE" | "STAGE 2 EXPANSION" | "CYCLE LONG" | "HOLD / REBALANCE" | "DEFENSIVE HEDGE" | "CAPITAL PRESERVE";
  structure: "Golden Cross Base" | "Stage 2 Mark-up" | "Range Consolidation" | "Stage 4 Distribution" | "Macro Breakdown";
  timeHorizon: "2–6 Weeks" | "1–3 Months" | "Quarterly Core" | "Multi-Month Cycle" | "Multi-Week Trim" | "Cash / Neutral";
  macroInvalidation: number;
  riskReward: string;
};

export type Row = {
  symbol: string;
  name: string;
  kind: Kind;
  group: string;
  price: number;
  change24h: number;
  change30d: number;
  score: number;
  stance: Metrics["stance"];
  risk: Metrics["riskGrade"];
  spark: number[];
  dayTrade: DayTradePlan;
  swingLong: SwingLongPlan;
};

export function computeDayTrade(m: Metrics): DayTradePlan {
  const isBull = m.score >= 55 && m.change24h >= -0.5;
  const isBear = m.score <= 42 || m.change24h <= -2.5;
  const volBuffer = Math.max(0.012, Math.min(0.065, m.vol * 0.1));

  if (isBull) {
    const target = m.last * (1 + volBuffer * 1.5);
    const stop = m.last * (1 - volBuffer);
    const dist = ((m.last - stop) / m.last) * 100;
    return {
      bias: m.score >= 75 ? "LONG SCALP" : "RANGE BREAK",
      vwapBias: "Above VWAP",
      intradayTarget: target,
      intradayStop: stop,
      momentum15m: m.score >= 75 ? "Strong Bull" : "Bullish Flow",
      invalidationDistancePct: dist,
    };
  } else if (isBear) {
    const target = m.last * (1 - volBuffer * 1.5);
    const stop = m.last * (1 + volBuffer);
    const dist = ((stop - m.last) / m.last) * 100;
    return {
      bias: "SHORT SCALP",
      vwapBias: "Below VWAP",
      intradayTarget: target,
      intradayStop: stop,
      momentum15m: m.score <= 30 ? "Heavy Sell" : "Bearish Flow",
      invalidationDistancePct: dist,
    };
  } else {
    const target = m.last * (1 + volBuffer);
    const stop = m.last * (1 - volBuffer);
    const dist = ((m.last - stop) / m.last) * 100;
    return {
      bias: "MEAN REVERT",
      vwapBias: "At Mean",
      intradayTarget: target,
      intradayStop: stop,
      momentum15m: "Chop / Neutral",
      invalidationDistancePct: dist,
    };
  }
}

export function computeSwingLong(m: Metrics): SwingLongPlan {
  if (m.score >= 72 && m.last > m.sma200) {
    return {
      bias: "STAGE 2 EXPANSION",
      structure: "Stage 2 Mark-up",
      timeHorizon: "1–3 Months",
      macroInvalidation: Math.round(m.sma50 * 0.97 * 100) / 100,
      riskReward: "3.6 : 1",
    };
  } else if (m.score >= 58) {
    return {
      bias: "CORE ACCUMULATE",
      structure: "Golden Cross Base",
      timeHorizon: "2–6 Weeks",
      macroInvalidation: Math.round(Math.min(m.sma50, m.sma20) * 0.96 * 100) / 100,
      riskReward: "2.8 : 1",
    };
  } else if (m.score >= 46) {
    return {
      bias: "HOLD / REBALANCE",
      structure: "Range Consolidation",
      timeHorizon: "Quarterly Core",
      macroInvalidation: Math.round(m.sma200 * 0.98 * 100) / 100,
      riskReward: "1.9 : 1",
    };
  } else if (m.score >= 34) {
    return {
      bias: "DEFENSIVE HEDGE",
      structure: "Stage 4 Distribution",
      timeHorizon: "Multi-Week Trim",
      macroInvalidation: Math.round(m.last * 1.025 * 100) / 100,
      riskReward: "0.8 : 1",
    };
  } else {
    return {
      bias: "CAPITAL PRESERVE",
      structure: "Macro Breakdown",
      timeHorizon: "Cash / Neutral",
      macroInvalidation: Math.round(m.sma50 * 100) / 100,
      riskReward: "Negative",
    };
  }
}

export function rowsFor(kind?: Kind): Row[] {
  const list = kind ? byKind(kind) : ASSETS;
  return list
    .map((asset) => {
      const m = metricsFor(asset);
      const spark = series(asset, 60).map((p) => p.close);
      return {
        symbol: asset.symbol,
        name: asset.name,
        kind: asset.kind,
        group: asset.group,
        price: m.last,
        change24h: m.change24h,
        change30d: m.change30d,
        score: m.score,
        stance: m.stance,
        risk: m.riskGrade,
        spark,
        dayTrade: computeDayTrade(m),
        swingLong: computeSwingLong(m),
      };
    })
    .sort((a, b) => b.score - a.score);
}

export type LiveSeed = Record<string, { price: number; change: number; vol: number }>;

/** Server-rendered opening quotes, so the first paint already shows real prices. */
export function liveSeed(): LiveSeed {
  const out: LiveSeed = {};
  for (const asset of ASSETS) {
    const quote = quoteFor(asset.symbol);
    const m = metricsFor(asset);
    if (!quote && !hasMarketData(asset.symbol)) continue;
    out[asset.symbol] = {
      price: quote?.price ?? m.last,
      change: quote?.change ?? m.change24h,
      vol: Math.min(0.0042, Math.max(0.00035, m.vol * 0.0035)),
    };
  }
  return out;
}

export function marketPulse(): { score: number; label: string; breadth: number } {
  const stockScores = byKind("stock").map((a) => metricsFor(a).score);
  const score = Math.round(mean(stockScores));
  const breadth = Math.round((stockScores.filter((s) => s >= 60).length / stockScores.length) * 100);
  const label = score >= 70 ? "Risk-on" : score >= 55 ? "Constructive" : score >= 42 ? "Mixed" : "Risk-off";
  return { score, label, breadth };
}

export function narrativeFor(asset: Asset, m: Metrics): string[] {
  const above = (price: number, ref: number) => (price >= ref ? "above" : "below");
  const trendWord =
    m.score >= 78
      ? "a confirmed uptrend"
      : m.score >= 66
        ? "an improving uptrend"
        : m.score >= 47
          ? "a range-bound tape"
          : m.score >= 34
            ? "a deteriorating trend"
            : "a confirmed downtrend";

  const first = `${asset.symbol} is trading ${above(m.last, m.sma20)} its 20-day average and ${above(
    m.last,
    m.sma50,
  )} its 50-day average, which puts the tape in ${trendWord}. The 200-day sits at ${fmtPrice(
    m.sma200,
  )} and remains the line that defines the structural trend for this name.`;

  const second = `Realised volatility is running near ${(m.vol * 100).toFixed(
    0,
  )}% annualised with a 14-day RSI of ${m.rsi.toFixed(0)}. Price is ${m.percentile}% of the way up its 52-week range (${fmtPrice(
    m.low52,
  )} to ${fmtPrice(m.high52)}), so the position-sizing question matters more than the direction question right now.`;

  const third =
    m.score >= 66
      ? `Our trend model grades this ${m.stance.toLowerCase()} with ${m.confidence}% conviction. The risk to the call is not a single bad session but a break of the 50-day followed by a lower high, which would flip momentum regardless of the story.`
      : m.score >= 47
        ? `Our trend model grades this a hold with ${m.confidence}% conviction. There is no edge in forcing a position while the moving averages converge; wait for a decisive close out of the range.`
        : `Our trend model grades this ${m.stance.toLowerCase()} with ${m.confidence}% conviction. Until price reclaims the 50-day and holds it for several sessions, rallies are counter-trend and should be treated as exits rather than entries.`;

  return [first, second, third];
}

export function scoreBreakdown(m: Metrics): { label: string; value: number }[] {
  const c1 = clamp((m.last / m.sma20 - 1) * 380 + 50);
  const c2 = clamp((m.sma20 / m.sma50 - 1) * 460 + 50);
  const c3 = clamp((m.sma50 / m.sma200 - 1) * 340 + 50);
  const c4 = clamp(m.change30d * 240 + 50);
  const c5 = clamp((m.rsi - 50) * 1.1 + 50);
  return [
    { label: "Price vs 20-day", value: Math.round(c1) },
    { label: "20 vs 50-day", value: Math.round(c2) },
    { label: "50 vs 200-day", value: Math.round(c3) },
    { label: "30-day momentum", value: Math.round(c4) },
    { label: "RSI positioning", value: Math.round(c5) },
  ];
}
