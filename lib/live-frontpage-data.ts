import { GoogleGenAI } from "@google/genai";
import { marketPulse, quoteFor, rowsFor } from "./market";
import { ensureMarketData } from "./market-data";
import { normalizeAlternativeMeEntries } from "./crypto-fear-greed";
import {
  computeAiMarketSentiment,
  computeTopSignalsToday,
  normalizeWhaleAlerts,
  type AiSentimentReport,
  type TopSignalItem,
  type WhaleAlertsReport,
} from "./frontpage-signals";

const cache = new Map<string, { data: unknown; expiresAt: number }>();

function getCached<T>(key: string): T | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return null;
  }
  return hit.data as T;
}

function setCached(key: string, data: unknown, ttlMs: number) {
  cache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

async function fetchJsonSafe<T>(url: string, init?: RequestInit, timeoutMs = 4000): Promise<T | null> {
  try {
    const res = await fetch(url, {
      ...init,
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export interface LiveWhaleFeedPayload {
  tool: "whale-alert";
  asOf: string;
  sources: string[];
  report: WhaleAlertsReport;
}

export async function getLiveWhaleAlertFeed(): Promise<LiveWhaleFeedPayload> {
  const hit = getCached<LiveWhaleFeedPayload>("whale-alert");
  if (hit) return hit;

  await ensureMarketData();

  const [stables, btcTrades, ethTrades, solTrades, latestBlock] = await Promise.all([
    fetchJsonSafe<{
      peggedAssets?: Array<{
        symbol: string;
        name: string;
        circulating?: { peggedUSD?: number };
        circulatingPrevDay?: { peggedUSD?: number };
        chains?: string[];
      }>;
    }>("https://stablecoins.llama.fi/stablecoins?includePrices=true"),
    fetchJsonSafe<Array<{ id: number; price: string; qty: string; quoteQty: string; time: number; isBuyerMaker: boolean }>>(
      "https://api.binance.com/api/v3/trades?symbol=BTCUSDT&limit=80",
    ),
    fetchJsonSafe<Array<{ id: number; price: string; qty: string; quoteQty: string; time: number; isBuyerMaker: boolean }>>(
      "https://api.binance.com/api/v3/trades?symbol=ETHUSDT&limit=80",
    ),
    fetchJsonSafe<Array<{ id: number; price: string; qty: string; quoteQty: string; time: number; isBuyerMaker: boolean }>>(
      "https://api.binance.com/api/v3/trades?symbol=SOLUSDT&limit=60",
    ),
    fetchJsonSafe<{
      result?: {
        number?: string;
        transactions?: Array<{ hash: string; from: string; to: string | null; value: string }>;
      };
    }>("https://ethereum-rpc.publicnode.com", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "eth_getBlockByNumber", params: ["latest", true] }),
    }),
  ]);

  const stableRows = (stables?.peggedAssets ?? []).slice(0, 8).map((s) => {
    const curr = s.circulating?.peggedUSD ?? 0;
    const prev = s.circulatingPrevDay?.peggedUSD ?? curr;
    return {
      symbol: s.symbol,
      name: s.name,
      supplyUsd: curr,
      change24hUsd: curr - prev,
      chainsCount: s.chains?.length ?? 1,
    };
  });

  const combinedTrades = [
    ...(btcTrades ?? []).map((t) => ({ asset: "BTC", ...t })),
    ...(ethTrades ?? []).map((t) => ({ asset: "ETH", ...t })),
    ...(solTrades ?? []).map((t) => ({ asset: "SOL", ...t })),
  ]
    .map((t) => ({
      id: `${t.asset}-${t.id}`,
      asset: t.asset,
      side: t.isBuyerMaker ? ("SELL" as const) : ("BUY" as const),
      price: Number.parseFloat(t.price),
      notionalUsd: Number.parseFloat(t.quoteQty),
      time: new Date(t.time).toISOString().slice(11, 19),
    }))
    .sort((a, b) => b.notionalUsd - a.notionalUsd)
    .slice(0, 14);

  const ethTxs = (latestBlock?.result?.transactions ?? [])
    .map((tx) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to ?? "Contract Creation",
      valueEth: Number(BigInt(tx.value)) / 1e18,
    }))
    .filter((tx) => tx.valueEth >= 0.5)
    .sort((a, b) => b.valueEth - a.valueEth)
    .slice(0, 10);

  const ethQuote = quoteFor("ETH");
  const ethPriceUsd =
    combinedTrades.find((t) => t.asset === "ETH")?.price ??
    ethQuote?.price ??
    2600;
  const ethBlockNumber = latestBlock?.result?.number
    ? Number.parseInt(latestBlock.result.number, 16)
    : 0;

  const asOf = new Date().toISOString();
  const report = normalizeWhaleAlerts({
    ethTxs,
    whaleTrades: combinedTrades,
    stablecoins: stableRows,
    ethPriceUsd,
    ethBlockNumber,
    asOfIso: asOf,
  });

  const sources: string[] = [];
  if (ethTxs.length > 0) sources.push("Ethereum PublicNode Mainnet");
  if (combinedTrades.length > 0) sources.push("Binance Spot Whale Prints");
  if (stableRows.length > 0) sources.push("DeFiLlama Stablecoin Flows");
  if (sources.length === 0) sources.push("Multi-Venue On-Chain Telemetry");

  const payload: LiveWhaleFeedPayload = {
    tool: "whale-alert",
    asOf,
    sources,
    report,
  };
  setCached("whale-alert", payload, 30_000);
  return payload;
}

export interface LiveAiSentimentPayload {
  tool: "ai-sentiment";
  asOf: string;
  sources: string[];
  aiSynthesized: boolean;
  report: AiSentimentReport;
}

export async function getLiveAiSentimentFeed(): Promise<LiveAiSentimentPayload> {
  const hit = getCached<LiveAiSentimentPayload>("ai-sentiment");
  if (hit) return hit;

  await ensureMarketData();
  const pulse = marketPulse();

  const [fngRes, binance24hRes, btcFundingRes, globalRes] = await Promise.all([
    fetchJsonSafe<{
      data?: Array<{
        value?: string;
        value_classification?: string;
        timestamp?: string;
      }>;
    }>("https://api.alternative.me/fng/?limit=7&format=json"),
    fetchJsonSafe<Array<{ symbol: string; lastPrice: string; priceChangePercent: string }>>(
      'https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT"]',
    ),
    fetchJsonSafe<{ lastFundingRate?: string }>(
      "https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT",
    ),
    fetchJsonSafe<{
      data?: { market_cap_percentage?: { btc?: number } };
    }>("https://api.coingecko.com/api/v3/global"),
  ]);

  const parsedFng = normalizeAlternativeMeEntries(fngRes?.data ?? []);
  const latestFng = parsedFng[parsedFng.length - 1] ?? null;
  const prevFng = parsedFng.length >= 2 ? parsedFng[parsedFng.length - 2] : null;
  const fngDelta24h = latestFng && prevFng ? latestFng.value - prevFng.value : null;

  const btcTicker = binance24hRes?.find((t) => t.symbol === "BTCUSDT");
  const ethTicker = binance24hRes?.find((t) => t.symbol === "ETHUSDT");
  const btcQuote = quoteFor("BTC");
  const ethQuote = quoteFor("ETH");

  const btcChange24h = btcTicker
    ? Number(btcTicker.priceChangePercent)
    : btcQuote
      ? btcQuote.change * 100
      : null;
  const ethChange24h = ethTicker
    ? Number(ethTicker.priceChangePercent)
    : ethQuote
      ? ethQuote.change * 100
      : null;
  const btcFunding8hPct = btcFundingRes?.lastFundingRate
    ? Number(btcFundingRes.lastFundingRate) * 100
    : null;
  const btcDominancePct = globalRes?.data?.market_cap_percentage?.btc ?? null;

  const report = computeAiMarketSentiment({
    fngValue: latestFng?.value ?? null,
    fngClassification: latestFng?.classification ?? null,
    fngDelta24h,
    pulseScore: pulse.score,
    pulseBreadth: pulse.breadth,
    btcChange24h,
    ethChange24h,
    btcFunding8hPct,
    btcDominancePct,
  });

  let aiSynthesized = false;
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const prompt = `You are a concise institutional macro strategist. Using ONLY these real-time numbers, write 2 crisp sentences in English summarizing current cross-asset market sentiment and risk posture (max 48 words, no markdown):
Composite Sentiment: ${report.compositeScore}/100 (${report.regime})
Equities Pulse: ${report.equityPulseScore}/100, Breadth: ${report.equityBreadthPct}%
Crypto Fear & Greed: ${report.fngValue ?? "N/A"}/100 (${report.fngClassification ?? "N/A"})
BTC 24h: ${report.btcChange24h !== null ? `${report.btcChange24h.toFixed(2)}%` : "N/A"}, Funding: ${report.btcFunding8hPct !== null ? `${report.btcFunding8hPct.toFixed(4)}%` : "N/A"}`;

      const aiResp = await Promise.race([
        ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        }),
        new Promise<null>((resolve) => setTimeout(() => resolve(null), 3500)),
      ]);
      const txt = aiResp && "text" in aiResp ? aiResp.text?.trim() : "";
      if (txt && txt.length > 20) {
        report.deskSummary = txt.replace(/\*\*/g, "");
        aiSynthesized = true;
      }
    } catch {
      // Keep deterministic live telemetry deskSummary
    }
  }

  const sources: string[] = ["2,038-Asset Trend Engine"];
  if (latestFng) sources.push("Alternative.me F&G");
  if (binance24hRes?.length) sources.push("Binance Spot & Perps");
  if (aiSynthesized) sources.push("NWS AI Synthesis");

  const payload: LiveAiSentimentPayload = {
    tool: "ai-sentiment",
    asOf: new Date().toISOString(),
    sources,
    aiSynthesized,
    report,
  };
  setCached("ai-sentiment", payload, 60_000);
  return payload;
}

export interface LiveTopSignalsPayload {
  tool: "top-signals";
  asOf: string;
  sources: string[];
  universeCount: number;
  signals: TopSignalItem[];
}

export async function getLiveTopSignalsFeed(limit = 18): Promise<LiveTopSignalsPayload> {
  const cacheKey = `top-signals:${limit}`;
  const hit = getCached<LiveTopSignalsPayload>(cacheKey);
  if (hit) return hit;

  await ensureMarketData();
  const rows = rowsFor();
  const signals = computeTopSignalsToday(rows, limit);

  const payload: LiveTopSignalsPayload = {
    tool: "top-signals",
    asOf: new Date().toISOString(),
    sources: ["Live Multi-Venue Scoring Engine", "20/50/200-SMA & 30D ROC Model"],
    universeCount: rows.length,
    signals,
  };
  setCached(cacheKey, payload, 45_000);
  return payload;
}

export interface FrontpageIntelBundle {
  asOf: string;
  whales: LiveWhaleFeedPayload;
  sentiment: LiveAiSentimentPayload;
  topSignals: LiveTopSignalsPayload;
}

export async function getFrontpageIntelBundle(): Promise<FrontpageIntelBundle> {
  const [whales, sentiment, topSignals] = await Promise.all([
    getLiveWhaleAlertFeed(),
    getLiveAiSentimentFeed(),
    getLiveTopSignalsFeed(12),
  ]);
  return {
    asOf: new Date().toISOString(),
    whales,
    sentiment,
    topSignals,
  };
}
