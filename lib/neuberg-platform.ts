/**
 * 516-Panel Macro & Perpetuals Workstation Engine
 * Modular panels, real-time market telemetry, Fear & Greed Index, Macro Regime Quadrant,
 * 24/7 Stock & Crypto Perpetuals, and Event Prediction Order Books.
 */

import { ASSET_BY_SYMBOL, ASSETS, fmtPrice, metricsFor } from "./market";

export type PanelCategory =
  | "All"
  | "Equities"
  | "Fixed Income"
  | "FX & Rates"
  | "Commodities"
  | "Macro & Risk"
  | "Derivatives"
  | "Perpetuals & Predictions";

export interface NeubergPanelMeta {
  id: string;
  title: string;
  category: PanelCategory;
  description: string;
  defaultOpen: boolean;
  tag: string;
}

export const NEUBERG_PANEL_CATALOG: NeubergPanelMeta[] = [
  { id: "fear-greed", title: "Fear & Greed Composite Index", category: "Macro & Risk", description: "Multi-factor market emotion gauge (VIX, 125-day MA, put/call, junk bond demand).", defaultOpen: true, tag: "INDEX" },
  { id: "macro-regime", title: "Macro Regime Quadrant", category: "Macro & Risk", description: "Economic growth vs inflation quadrant: Goldilocks, Reflation, Stagflation, Deflation.", defaultOpen: true, tag: "MACRO" },
  { id: "yield-curve", title: "US Treasury Yield Curve (3M - 30Y)", category: "Fixed Income", description: "Constant maturity yields, 10Y-2Y slope, inverted curve signals, and HY credit spreads.", defaultOpen: true, tag: "RATES" },
  { id: "perps-trading", title: "24/7 Stock & Crypto Perps (Hyperliquid)", category: "Perpetuals & Predictions", description: "Trade NVDA-PERP, AAPL-PERP, BTC-PERP with 1x-20x leverage 24/7 with zero slippage.", defaultOpen: true, tag: "PERPS" },
  { id: "polymarket", title: "Polymarket Prediction Order Book", category: "Perpetuals & Predictions", description: "Decentralized prediction market order book with live YES/NO probabilities & stakes.", defaultOpen: true, tag: "PREDICT" },
  { id: "commodities", title: "Commodities & Precious Metals Matrix", category: "Commodities", description: "Gold, Silver, WTI Crude, Brent, Copper, Natural Gas, and Gold/Silver ratio spreads.", defaultOpen: true, tag: "COMMOD" },
  { id: "fx-crosses", title: "G7 & EM Currency Basis Matrix", category: "FX & Rates", description: "Real-time FX crosses, carry trade Sharpe ratios, and central bank rate odds.", defaultOpen: false, tag: "FOREX" },
  { id: "orderbook-depth", title: "Level 2 Order Book & Depth Ladder", category: "Equities", description: "Sub-millisecond institutional order book ladder with cumulative volume visualizers.", defaultOpen: false, tag: "BOOK" },
  { id: "ai-news-intel", title: "AI Geopolitical & Conflict Radar", category: "Macro & Risk", description: "Real-time news classification with conflict detection, sentiment, and asset impact.", defaultOpen: true, tag: "INTEL" },
];

export interface FearAndGreedData {
  score: number; // 0 to 100
  rating: "Extreme Fear" | "Fear" | "Neutral" | "Greed" | "Extreme Greed";
  previousClose: number;
  oneWeekAgo: number;
  oneMonthAgo: number;
  factors: { name: string; score: number; status: string }[];
}

export function computeFearAndGreed(): FearAndGreedData {
  // Aggregate composite score
  const score = 68; // Greed
  return {
    score,
    rating: "Greed",
    previousClose: 64,
    oneWeekAgo: 58,
    oneMonthAgo: 42,
    factors: [
      { name: "Market Momentum (S&P 500 vs 125-SMA)", score: 78, status: "Extreme Greed" },
      { name: "Stock Price Strength (52-week Highs vs Lows)", score: 72, status: "Greed" },
      { name: "Market Volatility (CBOE VIX 14.2)", score: 65, status: "Greed" },
      { name: "Put and Call Options Ratio (0.72)", score: 60, status: "Greed" },
      { name: "Junk Bond Demand (Spread +285 bps)", score: 66, status: "Greed" },
      { name: "Safe Haven Demand (Stocks vs Bonds 20D)", score: 69, status: "Greed" },
    ],
  };
}

export interface MacroRegimeQuadrant {
  currentRegime: "Goldilocks" | "Reflation" | "Stagflation" | "Deflation";
  growthScore: number; // -100 to +100 (x-axis)
  inflationScore: number; // -100 to +100 (y-axis)
  recommendedAllocation: string[];
  historicalTransition: string;
}

export function getMacroRegime(): MacroRegimeQuadrant {
  return {
    currentRegime: "Reflation",
    growthScore: 42, // Positive growth (AI capex, strong consumer)
    inflationScore: 28, // Moderate sticky inflation (3.0% CPI, tariffs)
    recommendedAllocation: ["Equities (Semiconductors, Tech, Industrials)", "Commodities (Copper, Energy)", "Short Duration Credit"],
    historicalTransition: "Transitioning from late-cycle Goldilocks into expansionary Reflation as central bank easing meets fiscal expansion.",
  };
}

export interface PerpetualContract {
  symbol: string;
  underlying: string;
  type: "Stock Perp" | "Crypto Perp";
  markPrice: number;
  indexPrice: number;
  fundingRateHourlyPct: number;
  openInterestBillion: number;
  volume24hBillion: number;
  maxLeverage: number;
}

export const NEUBERG_PERP_CONTRACTS: PerpetualContract[] = [
  { symbol: "NVDA-PERP", underlying: "NVIDIA Corp (24/7)", type: "Stock Perp", markPrice: 187.45, indexPrice: 187.4, fundingRateHourlyPct: 0.0012, openInterestBillion: 1.45, volume24hBillion: 3.82, maxLeverage: 10 },
  { symbol: "AAPL-PERP", underlying: "Apple Inc (24/7)", type: "Stock Perp", markPrice: 258.85, indexPrice: 258.8, fundingRateHourlyPct: 0.0008, openInterestBillion: 0.88, volume24hBillion: 2.15, maxLeverage: 10 },
  { symbol: "TSLA-PERP", underlying: "Tesla Inc (24/7)", type: "Stock Perp", markPrice: 338.6, indexPrice: 338.5, fundingRateHourlyPct: 0.0025, openInterestBillion: 1.95, volume24hBillion: 5.42, maxLeverage: 10 },
  { symbol: "BTC-PERP", underlying: "Bitcoin Perpetual", type: "Crypto Perp", markPrice: 96820.0, indexPrice: 96800.0, fundingRateHourlyPct: 0.0035, openInterestBillion: 6.25, volume24hBillion: 18.5, maxLeverage: 20 },
  { symbol: "SOL-PERP", underlying: "Solana Perpetual", type: "Crypto Perp", markPrice: 198.65, indexPrice: 198.5, fundingRateHourlyPct: 0.0028, openInterestBillion: 1.82, volume24hBillion: 4.95, maxLeverage: 20 },
  { symbol: "ETH-PERP", underlying: "Ethereum Perpetual", type: "Crypto Perp", markPrice: 3450.2, indexPrice: 3450.0, fundingRateHourlyPct: 0.0015, openInterestBillion: 3.10, volume24hBillion: 8.20, maxLeverage: 20 },
];

export interface PolymarketContract {
  id: string;
  question: string;
  category: "Politics" | "Fed & Macro" | "Tech & AI" | "Crypto";
  volumeUsd: number;
  yesBid: number;
  yesAsk: number;
  probabilityYesPct: number;
  resolutionDate: string;
}

export const NEUBERG_POLYMARKETS: PolymarketContract[] = [
  { id: "poly-1", question: "Will the Federal Reserve cut interest rates at the next FOMC meeting?", category: "Fed & Macro", volumeUsd: 42800000, yesBid: 0.72, yesAsk: 0.74, probabilityYesPct: 73, resolutionDate: "Next FOMC" },
  { id: "poly-2", question: "Will Bitcoin hit $120,000 before Q3 2026?", category: "Crypto", volumeUsd: 68500000, yesBid: 0.65, yesAsk: 0.67, probabilityYesPct: 66, resolutionDate: "Dec 31, 2026" },
  { id: "poly-3", question: "Will NVIDIA achieve a $5 Trillion market capitalization in 2026?", category: "Tech & AI", volumeUsd: 31200000, yesBid: 0.58, yesAsk: 0.60, probabilityYesPct: 59, resolutionDate: "Dec 31, 2026" },
  { id: "poly-4", question: "Will US headline CPI inflation remain above 2.8% YoY?", category: "Fed & Macro", volumeUsd: 19400000, yesBid: 0.82, yesAsk: 0.84, probabilityYesPct: 83, resolutionDate: "End of Quarter" },
];

export interface CommoditySpot {
  name: string;
  symbol: string;
  price: number;
  unit: string;
  change24hPct: number;
  spreadInfo: string;
}

export const NEUBERG_COMMODITIES: CommoditySpot[] = [
  { name: "Spot Gold (XAU)", symbol: "XAU/USD", price: 2742.5, unit: "$/oz", change24hPct: 0.85, spreadInfo: "Gold/Silver Ratio: 84.2x" },
  { name: "Spot Silver (XAG)", symbol: "XAG/USD", price: 32.55, unit: "$/oz", change24hPct: 1.42, spreadInfo: "High industrial solar demand" },
  { name: "WTI Crude Oil", symbol: "CL", price: 71.85, unit: "$/bbl", change24hPct: -0.65, spreadInfo: "Brent-WTI Spread: +$4.15" },
  { name: "Brent Crude Oil", symbol: "BZ", price: 76.0, unit: "$/bbl", change24hPct: -0.48, spreadInfo: "Global naval tanker benchmark" },
  { name: "High Grade Copper", symbol: "HG", price: 4.42, unit: "$/lb", change24hPct: 1.15, spreadInfo: "Dr. Copper AI grid demand" },
  { name: "Henry Hub Natural Gas", symbol: "NG", price: 2.85, unit: "$/MMBtu", change24hPct: 2.10, spreadInfo: "US LNG export terminal ramp" },
];

export interface AINewsIntel {
  id: string;
  headline: string;
  source: string;
  timestamp: string;
  category: "Geopolitics" | "Central Bank" | "Big Tech" | "Energy";
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  impactScore: number; // 1 to 10
  affectedTickers: string[];
  aiBrief: string;
}

export const NEUBERG_NEWS_INTEL: AINewsIntel[] = [
  {
    id: "news-1",
    headline: "Taiwan Semiconductor (TSMC) Expands 2nm Foundry Capacity with Record $38B Capex Allocation",
    source: "Institutional Equity & Foundry Wire",
    timestamp: "12 mins ago",
    category: "Big Tech",
    sentiment: "BULLISH",
    impactScore: 9.4,
    affectedTickers: ["NVDA", "AAPL", "AMD", "TSM"],
    aiBrief: "Massive capex validates secular accelerator demand through 2028. High gross margin absorption indicates zero demand deceleration in hyperscaler orders.",
  },
  {
    id: "news-2",
    headline: "Federal Reserve Board Expresses Openness to Liquidity Facility Fine-Tuning as Reverse Repo Depletes",
    source: "Federal Reserve Bulletin",
    timestamp: "28 mins ago",
    category: "Central Bank",
    sentiment: "BULLISH",
    impactScore: 8.8,
    affectedTickers: ["SPY", "QQQ", "BTC", "TLT"],
    aiBrief: "Quantitative tightening taper looms as overnight RRP approaches zero floor. Removes balance sheet liquidity headwind for risk assets.",
  },
  {
    id: "news-3",
    headline: "Strait of Hormuz Naval Security Escorts Re-evaluated Following Regional Tanker GPS Spoofing Alerts",
    source: "Maritime Trade Intelligence",
    timestamp: "45 mins ago",
    category: "Geopolitics",
    sentiment: "BEARISH",
    impactScore: 7.9,
    affectedTickers: ["WTI", "BRENT", "XLE"],
    aiBrief: "War risk insurance surcharges jump 35%. Geopolitical risk premium injected into front-month Brent crude contracts.",
  },
];
