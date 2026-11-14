export type SentimentZone =
  | "Extreme Fear"
  | "Fear"
  | "Neutral"
  | "Greed"
  | "Extreme Greed";

export interface FearGreedPoint {
  timestamp: number; // unix seconds
  date: string; // YYYY-MM-DD
  value: number; // 0..100
  classification: string;
}

export interface SentimentClassificationMeta {
  zone: SentimentZone;
  rangeLabel: string;
  accentHex: string;
  badgeClassDark: string;
  badgeClassLight: string;
  contrarianBias: string;
  sizingMultiplier: string;
  guidance: string;
}

export interface SentimentStats {
  current: FearGreedPoint;
  meta: SentimentClassificationMeta;
  delta24h: number;
  delta7d: number;
  delta30d: number;
  avg7d: number;
  avg30d: number;
  avg90d: number;
  min30d: number;
  max30d: number;
  min90d: number;
  max90d: number;
  zScore30d: number;
  extremeFearDays30d: number;
  extremeGreedDays30d: number;
  streakDays: number;
  streakZone: SentimentZone;
}

export interface SentimentBandSpec {
  zone: SentimentZone;
  min: number;
  max: number;
  rangeLabel: string;
  accentHex: string;
  marketPsychology: string;
  deskAction: string;
}

export const SENTIMENT_BANDS: SentimentBandSpec[] = [
  {
    zone: "Extreme Fear",
    min: 0,
    max: 24,
    rangeLabel: "0 – 24",
    accentHex: "#ef4444",
    marketPsychology: "Forced liquidations, capitulation headlines, and deeply negative funding.",
    deskAction: "Contrarian accumulation window; scale slowly above structural invalidation.",
  },
  {
    zone: "Fear",
    min: 25,
    max: 45,
    rangeLabel: "25 – 45",
    accentHex: "#f59e0b",
    marketPsychology: "Defensive hedging, rising stablecoin dominance, and muted retail flow.",
    deskAction: "Selective deployment into high-liquidity majors (BTC/ETH) with defined stops.",
  },
  {
    zone: "Neutral",
    min: 46,
    max: 54,
    rangeLabel: "46 – 54",
    accentHex: "#94a3b8",
    marketPsychology: "Balanced positioning with two-way order flow and low directional conviction.",
    deskAction: "Normal risk budget; trade range pivots and wait for trend confirmation.",
  },
  {
    zone: "Greed",
    min: 55,
    max: 74,
    rangeLabel: "55 – 74",
    accentHex: "#34d399",
    marketPsychology: "Momentum expansion, rising open interest, and constructive spot inflows.",
    deskAction: "Ride active trend; trail invalidation stops higher and watch funding drift.",
  },
  {
    zone: "Extreme Greed",
    min: 75,
    max: 100,
    rangeLabel: "75 – 100",
    accentHex: "#10b981",
    marketPsychology: "Crowded leverage, aggressive FOMO chase, and elevated liquidation cascade risk.",
    deskAction: "Trim winners, tighten trailing stops, and reduce speculative altcoin leverage.",
  },
];

export function clampScore(value: number): number {
  if (!Number.isFinite(value)) return 50;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function classifySentiment(rawValue: number): SentimentClassificationMeta {
  const score = clampScore(rawValue);

  if (score <= 24) {
    return {
      zone: "Extreme Fear",
      rangeLabel: "0–24",
      accentHex: "#ef4444",
      badgeClassDark: "border-rose-500/40 bg-rose-500/15 text-rose-300",
      badgeClassLight: "border-rose-300 bg-rose-50 text-rose-700",
      contrarianBias: "Contrarian Opportunity (Capitulation)",
      sizingMultiplier: "0.75x Staggered DCA",
      guidance:
        "Sentiment is in statistical capitulation. Historically marks high-reward accumulation zones, provided entries respect technical invalidation levels.",
    };
  }
  if (score <= 45) {
    return {
      zone: "Fear",
      rangeLabel: "25–45",
      accentHex: "#f59e0b",
      badgeClassDark: "border-amber-500/40 bg-amber-500/15 text-amber-300",
      badgeClassLight: "border-amber-300 bg-amber-50 text-amber-700",
      contrarianBias: "Cautious Accumulation",
      sizingMultiplier: "0.85x Standard Risk",
      guidance:
        "Participants are under-allocated and defensive. Favor Tier-1 spot liquidity over leveraged altcoins until breadth stabilizes.",
    };
  }
  if (score <= 54) {
    return {
      zone: "Neutral",
      rangeLabel: "46–54",
      accentHex: "#94a3b8",
      badgeClassDark: "border-zinc-600/60 bg-zinc-800/70 text-zinc-300",
      badgeClassLight: "border-slate-300 bg-slate-100 text-slate-700",
      contrarianBias: "Balanced / Regime Neutral",
      sizingMultiplier: "1.00x Normal Sizing",
      guidance:
        "Positioning is balanced without extreme crowding. Rely on trend score and order-book depth rather than sentiment fades.",
    };
  }
  if (score <= 74) {
    return {
      zone: "Greed",
      rangeLabel: "55–74",
      accentHex: "#34d399",
      badgeClassDark: "border-emerald-500/40 bg-emerald-500/15 text-emerald-300",
      badgeClassLight: "border-emerald-300 bg-emerald-50 text-emerald-700",
      contrarianBias: "Constructive Momentum",
      sizingMultiplier: "0.90x Trail Stops",
      guidance:
        "Risk appetite is expanding with healthy momentum. Maintain core exposure while ratcheting invalidation levels upward.",
    };
  }
  return {
    zone: "Extreme Greed",
    rangeLabel: "75–100",
    accentHex: "#10b981",
    badgeClassDark: "border-emerald-400/50 bg-emerald-500/20 text-emerald-200",
    badgeClassLight: "border-emerald-400 bg-emerald-100 text-emerald-800",
    contrarianBias: "Contrarian Caution (Crowded Euphoria)",
    sizingMultiplier: "0.50x De-Risk & Hedge",
    guidance:
      "Market is priced for perfection with elevated perpetual funding risk. Prioritize profit-taking, tighter stops, and delta protection.",
  };
}

export function normalizeAlternativeMeEntries(
  rawData: Array<{ value?: string | number; value_classification?: string; timestamp?: string | number }>,
): FearGreedPoint[] {
  const parsed: FearGreedPoint[] = [];

  for (const item of rawData) {
    const valNum = clampScore(Number(item.value));
    const tsNum = Number(item.timestamp);
    if (!Number.isFinite(tsNum) || tsNum <= 0) continue;
    const date = new Date(tsNum * 1000).toISOString().slice(0, 10);
    const meta = classifySentiment(valNum);
    parsed.push({
      timestamp: tsNum,
      date,
      value: valNum,
      classification: item.value_classification || meta.zone,
    });
  }

  // Sort chronologically (oldest -> newest) and deduplicate by date
  parsed.sort((a, b) => a.timestamp - b.timestamp);
  const byDate = new Map<string, FearGreedPoint>();
  for (const pt of parsed) {
    byDate.set(pt.date, pt);
  }
  return Array.from(byDate.values());
}

export function computeSentimentStats(chronological: FearGreedPoint[]): SentimentStats {
  const series = chronological.length > 0 ? chronological : buildFallbackHistory(30);
  const n = series.length;
  const current = series[n - 1];
  const prev1 = series[Math.max(0, n - 2)];
  const prev7 = series[Math.max(0, n - 8)];
  const prev30 = series[Math.max(0, n - 31)];

  const slice7 = series.slice(-7);
  const slice30 = series.slice(-30);
  const slice90 = series.slice(-90);

  const mean = (arr: FearGreedPoint[]) =>
    arr.length === 0 ? current.value : arr.reduce((s, p) => s + p.value, 0) / arr.length;

  const avg7d = mean(slice7);
  const avg30d = mean(slice30);
  const avg90d = mean(slice90);

  const vals30 = slice30.map((p) => p.value);
  const vals90 = slice90.map((p) => p.value);
  const min30d = Math.min(...vals30);
  const max30d = Math.max(...vals30);
  const min90d = Math.min(...vals90);
  const max90d = Math.max(...vals90);

  const variance30 =
    slice30.reduce((s, p) => s + Math.pow(p.value - avg30d, 2), 0) / Math.max(1, slice30.length);
  const std30 = Math.sqrt(variance30);
  const zScore30d = std30 > 0.01 ? (current.value - avg30d) / std30 : 0;

  const extremeFearDays30d = slice30.filter((p) => p.value <= 24).length;
  const extremeGreedDays30d = slice30.filter((p) => p.value >= 75).length;

  const currentZone = classifySentiment(current.value).zone;
  let streakDays = 0;
  for (let i = n - 1; i >= 0; i--) {
    if (classifySentiment(series[i].value).zone === currentZone) {
      streakDays += 1;
    } else {
      break;
    }
  }

  return {
    current,
    meta: classifySentiment(current.value),
    delta24h: current.value - prev1.value,
    delta7d: current.value - prev7.value,
    delta30d: current.value - prev30.value,
    avg7d,
    avg30d,
    avg90d,
    min30d,
    max30d,
    min90d,
    max90d,
    zScore30d,
    extremeFearDays30d,
    extremeGreedDays30d,
    streakDays,
    streakZone: currentZone,
  };
}

export function buildFallbackHistory(days = 90): FearGreedPoint[] {
  const nowSec = Math.floor(Date.now() / 1000);
  const daySec = 86400;
  const out: FearGreedPoint[] = [];

  for (let i = days - 1; i >= 0; i--) {
    const ts = nowSec - i * daySec;
    const wave = Math.sin((days - i) * 0.16) * 22 + Math.cos((days - i) * 0.07) * 14;
    const value = clampScore(46 + wave);
    const meta = classifySentiment(value);
    out.push({
      timestamp: ts,
      date: new Date(ts * 1000).toISOString().slice(0, 10),
      value,
      classification: meta.zone,
    });
  }
  return out;
}
