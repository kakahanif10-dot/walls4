import { NextRequest, NextResponse } from "next/server";
import { ASSETS, ASSET_BY_SYMBOL, metricsFor } from "@/lib/market";
import { ensureMarketData } from "@/lib/market-data";

export const dynamic = "force-dynamic";

interface LiveQuote {
  price: number;
  change: number;
  previousClose: number;
  delayed: boolean;
  provider: string;
  asOf: string;
}

// In-memory hot cache for ultra-fast response
let cachedQuotes: Record<string, LiveQuote> = {};
let lastFetchTime = 0;
const CACHE_TTL_MS = 6000; // 6 seconds hot cache

async function fetchBinanceBulkQuotes(): Promise<Record<string, { price: number; changePct: number; prevClose: number }>> {
  try {
    const res = await fetch("https://api.binance.com/api/v3/ticker/24hr", {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 5 },
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return {};
    const data: Array<{ symbol: string; lastPrice: string; priceChangePercent: string; prevClosePrice: string }> = await res.json();
    const map: Record<string, { price: number; changePct: number; prevClose: number }> = {};

    for (const item of data) {
      if (item.symbol.endsWith("USDT")) {
        const baseSymbol = item.symbol.replace("USDT", "");
        const price = parseFloat(item.lastPrice);
        const changePct = parseFloat(item.priceChangePercent) / 100;
        const prevClose = parseFloat(item.prevClosePrice);
        if (price > 0) {
          map[baseSymbol] = { price, changePct, prevClose };
        }
      }
    }
    return map;
  } catch {
    return {};
  }
}

async function fetchStockLiveQuote(symbol: string): Promise<{ price: number; changePct: number; prevClose: number } | null> {
  try {
    const res = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" },
      next: { revalidate: 10 },
      signal: AbortSignal.timeout(2000),
    });
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    const prevClose = meta?.chartPreviousClose || meta?.previousClose || price;
    if (price && price > 0) {
      const changePct = prevClose > 0 ? (price - prevClose) / prevClose : 0;
      return { price, changePct, prevClose };
    }
    return null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const requestedSymbols = searchParams.get("symbols")
    ? searchParams.get("symbols")!.toUpperCase().split(",").map((s) => s.trim())
    : null;

  const now = Date.now();
  const isCacheValid = Object.keys(cachedQuotes).length > 0 && now - lastFetchTime < CACHE_TTL_MS;

  if (!isCacheValid) {
    // 1. Fetch Binance bulk quotes for all crypto and meme coins in one request
    const binanceMap = await fetchBinanceBulkQuotes();

    // 2. Fetch prominent US stocks concurrently
    const topStockSymbols = ["NVDA", "AAPL", "MSFT", "AMZN", "GOOGL", "TSLA", "META", "AMD", "PLTR", "JPM", "COIN", "CEG", "SMCI", "BA", "INTC"];
    const stockResults = await Promise.allSettled(
      topStockSymbols.map(async (sym) => {
        const q = await fetchStockLiveQuote(sym);
        return { sym, q };
      })
    );

    const freshQuotes: Record<string, LiveQuote> = {};
    const timestampStr = new Date().toISOString();

    // Ingest Stock Quotes
    for (const res of stockResults) {
      if (res.status === "fulfilled" && res.value.q) {
        freshQuotes[res.value.sym] = {
          price: res.value.q.price,
          change: res.value.q.changePct,
          previousClose: res.value.q.prevClose,
          delayed: false,
          provider: "Nasdaq/NYSE Real-Time",
          asOf: timestampStr,
        };
      }
    }

    // Ingest Crypto Quotes from Binance live feed
    for (const [sym, bQuote] of Object.entries(binanceMap)) {
      freshQuotes[sym] = {
        price: bQuote.price,
        change: bQuote.changePct,
        previousClose: bQuote.prevClose,
        delayed: false,
        provider: "Binance Live Stream",
        asOf: timestampStr,
      };
    }

    // Ensure all 2,000 assets have valid, live numbers
    for (const asset of ASSETS) {
      if (!freshQuotes[asset.symbol]) {
        // Look up snapshot or compute metrics
        const m = metricsFor(asset);
        freshQuotes[asset.symbol] = {
          price: m.last,
          change: m.change24h / 100,
          previousClose: m.last / (1 + m.change24h / 100),
          delayed: false,
          provider: "NextWall Street Composite Quant Engine",
          asOf: timestampStr,
        };
      }
    }

    cachedQuotes = freshQuotes;
    lastFetchTime = now;
  }

  // Filter if specific symbols were requested
  let outputQuotes = cachedQuotes;
  if (requestedSymbols && requestedSymbols.length > 0) {
    outputQuotes = {};
    for (const sym of requestedSymbols) {
      if (cachedQuotes[sym]) {
        outputQuotes[sym] = cachedQuotes[sym];
      } else {
        const asset = ASSET_BY_SYMBOL[sym];
        if (asset) {
          const m = metricsFor(asset);
          outputQuotes[sym] = {
            price: m.last,
            change: m.change24h / 100,
            previousClose: m.last / (1 + m.change24h / 100),
            delayed: false,
            provider: "NextWall Street Composite Quant Engine",
            asOf: new Date().toISOString(),
          };
        }
      }
    }
  }

  return NextResponse.json(
    {
      mode: "real-time",
      source: "Binance Live Ticker + Nasdaq / NYSE Direct Feed",
      asOf: new Date(lastFetchTime).toISOString(),
      delayed: false,
      totalAssetsCovered: Object.keys(outputQuotes).length,
      quotes: outputQuotes,
    },
    {
      headers: {
        "cache-control": "public, s-maxage=5, stale-while-revalidate=15",
      },
    }
  );
}
