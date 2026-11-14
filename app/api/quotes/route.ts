import { NextRequest, NextResponse } from "next/server";
import { ASSETS, type RealTelemetry } from "@/lib/market";
import { ensureMarketData, type FeedQuote } from "@/lib/market-data";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const requestedSymbols = searchParams.get("symbols")
    ? searchParams
        .get("symbols")!
        .toUpperCase()
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : null;
  const force = searchParams.get("force") === "true";

  const snap = await ensureMarketData(force);
  const timestampStr = new Date(snap.fetchedAt || Date.now()).toISOString();

  const outputQuotes: Record<string, FeedQuote> = {};
  const outputTelemetry: Record<string, RealTelemetry> = {};

  const targetSymbols =
    requestedSymbols && requestedSymbols.length > 0
      ? requestedSymbols
      : ASSETS.map((a) => a.symbol);

  for (const sym of targetSymbols) {
    const live = snap.quotes[sym];
    if (live) {
      outputQuotes[sym] = { ...live, delayed: false };
    }
    const tel = snap.telemetry[sym];
    if (tel) {
      outputTelemetry[sym] = tel;
    }
  }

  return NextResponse.json(
    {
      mode: "real-time",
      source: snap.sources.length
        ? snap.sources.join(" · ")
        : "NYSE/Nasdaq Live · Binance · OKX · CoinGecko · DexScreener",
      asOf: timestampStr,
      delayed: false,
      totalAssetsCovered: Object.keys(outputQuotes).length,
      liveCovered: Object.keys(snap.quotes).length,
      missingCount: snap.missing.length,
      quotes: outputQuotes,
      telemetry: outputTelemetry,
    },
    {
      headers: {
        "cache-control": "public, s-maxage=5, stale-while-revalidate=10",
      },
    },
  );
}
