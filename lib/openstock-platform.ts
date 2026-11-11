/**
 * Global Markets & Sentiment Hub Engine
 * Multi-market coverage across 9 regions (US, India, Germany, Canada, Australia, Saudi Arabia, Poland, Crypto, Forex),
 * Market Hours Clock, Social Sentiment Radar, Technical Indicators, and Price Alert Manager.
 */

import { ASSET_BY_SYMBOL, ASSETS, fmtPrice, fmtPct, metricsFor } from "./market";

export interface GlobalMarketRegion {
  id: string;
  name: string;
  flag: string;
  exchange: string;
  timezone: string;
  currency: string;
  primaryIndex: string;
  indexValue: number;
  indexChangePct: number;
  openTimeUTC: string; // e.g. "14:30"
  closeTimeUTC: string; // e.g. "21:00"
  status: "OPEN" | "PRE-MARKET" | "AFTER-HOURS" | "CLOSED";
  topSymbols: string[];
}

export const OPENSTOCK_GLOBAL_MARKETS: GlobalMarketRegion[] = [
  {
    id: "us",
    name: "United States",
    flag: "🇺🇸",
    exchange: "NYSE / NASDAQ",
    timezone: "America/New_York (EST)",
    currency: "USD ($)",
    primaryIndex: "S&P 500",
    indexValue: 5882.4,
    indexChangePct: 0.68,
    openTimeUTC: "14:30",
    closeTimeUTC: "21:00",
    status: "OPEN",
    topSymbols: ["NVDA", "AAPL", "MSFT", "AMZN", "GOOGL", "META", "TSLA"],
  },
  {
    id: "in",
    name: "India",
    flag: "🇮🇳",
    exchange: "NSE / BSE",
    timezone: "Asia/Kolkata (IST)",
    currency: "INR (₹)",
    primaryIndex: "NIFTY 50",
    indexValue: 24180.8,
    indexChangePct: 0.45,
    openTimeUTC: "03:45",
    closeTimeUTC: "10:00",
    status: "CLOSED",
    topSymbols: ["RELIANCE", "TCS", "HDFCBANK", "INFY", "ICICIBANK"],
  },
  {
    id: "de",
    name: "Germany",
    flag: "🇩🇪",
    exchange: "Deutsche Börse (XETRA)",
    timezone: "Europe/Berlin (CET)",
    currency: "EUR (€)",
    primaryIndex: "DAX 40",
    indexValue: 19420.2,
    indexChangePct: 0.32,
    openTimeUTC: "08:00",
    closeTimeUTC: "16:30",
    status: "OPEN",
    topSymbols: ["SAP", "SIEMENS", "ALV", "BMW", "BAYN"],
  },
  {
    id: "ca",
    name: "Canada",
    flag: "🇨🇦",
    exchange: "Toronto Stock Exchange (TSX)",
    timezone: "America/Toronto (EST)",
    currency: "CAD (C$)",
    primaryIndex: "S&P/TSX Composite",
    indexValue: 24780.5,
    indexChangePct: 0.28,
    openTimeUTC: "14:30",
    closeTimeUTC: "21:00",
    status: "OPEN",
    topSymbols: ["RY", "TD", "ENB", "CNR", "BNS"],
  },
  {
    id: "au",
    name: "Australia",
    flag: "🇦🇺",
    exchange: "Australian Securities Exchange (ASX)",
    timezone: "Australia/Sydney (AEST)",
    currency: "AUD (A$)",
    primaryIndex: "S&P/ASX 200",
    indexValue: 8240.1,
    indexChangePct: -0.15,
    openTimeUTC: "00:00",
    closeTimeUTC: "06:00",
    status: "CLOSED",
    topSymbols: ["BHP", "CBA", "CSL", "NAB", "WBC"],
  },
  {
    id: "sa",
    name: "Saudi Arabia",
    flag: "🇸🇦",
    exchange: "Saudi Stock Exchange (Tadawul)",
    timezone: "Asia/Riyadh (AST)",
    currency: "SAR (﷼)",
    primaryIndex: "TASI Index",
    indexValue: 12080.4,
    indexChangePct: 0.54,
    openTimeUTC: "07:00",
    closeTimeUTC: "12:00",
    status: "CLOSED",
    topSymbols: ["ARAMCO", "ALRAJHI", "SNB", "SABIC"],
  },
  {
    id: "pl",
    name: "Poland",
    flag: "🇵🇱",
    exchange: "Warsaw Stock Exchange (GPW)",
    timezone: "Europe/Warsaw (CET)",
    currency: "PLN (zł)",
    primaryIndex: "WIG20",
    indexValue: 2360.8,
    indexChangePct: 0.82,
    openTimeUTC: "08:00",
    closeTimeUTC: "16:00",
    status: "OPEN",
    topSymbols: ["PKN", "PKO", "PZU", "DNP", "KGH"],
  },
  {
    id: "crypto",
    name: "Crypto 24/7",
    flag: "⚡",
    exchange: "Binance / OKX / Coinbase",
    timezone: "Global (UTC)",
    currency: "USD ($)",
    primaryIndex: "Total Crypto Market Cap",
    indexValue: 3340.5, // $3.34 Trillion
    indexChangePct: 4.12,
    openTimeUTC: "00:00",
    closeTimeUTC: "24:00",
    status: "OPEN",
    topSymbols: ["BTC", "ETH", "SOL", "DOGE", "PEPE"],
  },
  {
    id: "forex",
    name: "Global FX",
    flag: "💱",
    exchange: "Interbank Foreign Exchange",
    timezone: "Global FX 24/5",
    currency: "Pairs",
    primaryIndex: "US Dollar Index (DXY)",
    indexValue: 106.2,
    indexChangePct: -0.22,
    openTimeUTC: "22:00",
    closeTimeUTC: "22:00",
    status: "OPEN",
    topSymbols: ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD"],
  },
];

export interface OpenStockSectorItem {
  sector: string;
  changePct: number;
  leadingSymbol: string;
  weightPct: number;
}

export const OPENSTOCK_SECTORS: OpenStockSectorItem[] = [
  { sector: "Information Technology", changePct: 1.45, leadingSymbol: "NVDA", weightPct: 29.5 },
  { sector: "Communication Services", changePct: 0.92, leadingSymbol: "GOOGL", weightPct: 8.8 },
  { sector: "Financials", changePct: 0.58, leadingSymbol: "JPM", weightPct: 13.2 },
  { sector: "Consumer Discretionary", changePct: 0.42, leadingSymbol: "AMZN", weightPct: 10.4 },
  { sector: "Industrials", changePct: 0.18, leadingSymbol: "GE", weightPct: 8.5 },
  { sector: "Health Care", changePct: -0.25, leadingSymbol: "LLY", weightPct: 11.6 },
  { sector: "Energy", changePct: -0.65, leadingSymbol: "XOM", weightPct: 3.7 },
  { sector: "Consumer Staples", changePct: -0.12, leadingSymbol: "PG", weightPct: 5.9 },
  { sector: "Utilities", changePct: -0.48, leadingSymbol: "NEE", weightPct: 2.4 },
  { sector: "Real Estate", changePct: -0.84, leadingSymbol: "PLD", weightPct: 2.2 },
  { sector: "Materials", changePct: 0.05, leadingSymbol: "LIN", weightPct: 2.3 },
];

export interface SocialSentimentRadar {
  symbol: string;
  overallScore: number; // 0 to 100
  sentimentBand: "Very Bullish" | "Bullish" | "Neutral" | "Bearish" | "Extreme Fear";
  redditMentions24h: number;
  redditBullishPct: number;
  xPosts24h: number;
  xBullishPct: number;
  newsArticlesCount: number;
  newsSentimentPct: number;
  polymarketProbabilityPct: number;
  polymarketQuestion: string;
}

export function getSocialSentimentFor(symbol: string): SocialSentimentRadar {
  const asset = ASSET_BY_SYMBOL[symbol] || ASSETS[0];
  const m = metricsFor(asset);
  const score = Math.round(m.score);

  let band: SocialSentimentRadar["sentimentBand"] = "Neutral";
  if (score >= 78) band = "Very Bullish";
  else if (score >= 60) band = "Bullish";
  else if (score >= 45) band = "Neutral";
  else if (score >= 30) band = "Bearish";
  else band = "Extreme Fear";

  return {
    symbol: asset.symbol,
    overallScore: score,
    sentimentBand: band,
    redditMentions24h: Math.round(1800 + score * 45),
    redditBullishPct: Math.min(95, Math.max(20, Math.round(score * 0.95 + 4))),
    xPosts24h: Math.round(14500 + score * 320),
    xBullishPct: Math.min(92, Math.max(25, Math.round(score * 0.9 + 5))),
    newsArticlesCount: Math.round(85 + score * 2.5),
    newsSentimentPct: Math.min(90, Math.max(30, Math.round(score * 0.85 + 10))),
    polymarketProbabilityPct: Math.min(98, Math.max(15, Math.round(score * 0.9 + 8))),
    polymarketQuestion: `Will $${asset.symbol} close higher than ${fmtPrice(m.last * 1.05)} by next month?`,
  };
}

export interface OpenStockAlert {
  id: string;
  symbol: string;
  targetPrice: number;
  direction: "ABOVE" | "BELOW";
  currentPrice: number;
  triggered: boolean;
  createdAt: string;
}

export const INITIAL_OPENSTOCK_ALERTS: OpenStockAlert[] = [
  { id: "alt-1", symbol: "NVDA", targetPrice: 200.0, direction: "ABOVE", currentPrice: 187.4, triggered: false, createdAt: "Today 08:30" },
  { id: "alt-2", symbol: "AAPL", targetPrice: 245.0, direction: "BELOW", currentPrice: 258.8, triggered: false, createdAt: "Yesterday 11:20" },
  { id: "alt-3", symbol: "BTC", targetPrice: 100000.0, direction: "ABOVE", currentPrice: 96800.0, triggered: false, createdAt: "Nov 09 14:00" },
  { id: "alt-4", symbol: "TSLA", targetPrice: 320.0, direction: "ABOVE", currentPrice: 338.5, triggered: true, createdAt: "Nov 07 09:15" },
];
