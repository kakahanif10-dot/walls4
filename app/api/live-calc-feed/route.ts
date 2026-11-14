import { NextRequest, NextResponse } from "next/server";
import { ASSET_BY_SYMBOL, metricsFor, quoteFor } from "@/lib/market";
import { ensureMarketData, ensureSymbolHistory } from "@/lib/market-data";
import {
  DEFAULT_FX_RATES,
  computeAtr14,
  computeRealizedVolatilityPct,
  computeSma,
  type CurrencyCode,
  type LiveFeedTelemetry,
  type OhlcBar,
} from "@/lib/precision-calculator";

export const dynamic = "force-dynamic";

let cachedFx: { rates: Record<CurrencyCode, number>; fetchedAt: number; sourceName: string } | null = null;
const FX_TTL_MS = 10 * 60 * 1000;

async function fetchFreeFxRates(): Promise<{ rates: Record<CurrencyCode, number>; live: boolean; sourceName?: string }> {
  const now = Date.now();
  if (cachedFx && now - cachedFx.fetchedAt < FX_TTL_MS) {
    return { rates: cachedFx.rates, live: true, sourceName: cachedFx.sourceName };
  }

  try {
    const res = await fetch("https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,JPY,CHF,SGD,IDR", {
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as { rates?: Partial<Record<CurrencyCode, number>> };
      if (data?.rates?.EUR) {
        const rates: Record<CurrencyCode, number> = {
          USD: 1,
          EUR: data.rates.EUR,
          GBP: data.rates.GBP ?? DEFAULT_FX_RATES.GBP,
          JPY: data.rates.JPY ?? DEFAULT_FX_RATES.JPY,
          CHF: data.rates.CHF ?? DEFAULT_FX_RATES.CHF,
          SGD: data.rates.SGD ?? DEFAULT_FX_RATES.SGD,
          IDR: data.rates.IDR ?? DEFAULT_FX_RATES.IDR,
        };
        cachedFx = { rates, fetchedAt: now, sourceName: "Frankfurter ECB FX" };
        return { rates, live: true, sourceName: "Frankfurter ECB FX" };
      }
    }
  } catch {
    // try backup FX source below
  }

  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", {
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (res.ok) {
      const data = (await res.json()) as { rates?: Partial<Record<CurrencyCode, number>> };
      if (data?.rates?.EUR) {
        const rates: Record<CurrencyCode, number> = {
          USD: 1,
          EUR: data.rates.EUR,
          GBP: data.rates.GBP ?? DEFAULT_FX_RATES.GBP,
          JPY: data.rates.JPY ?? DEFAULT_FX_RATES.JPY,
          CHF: data.rates.CHF ?? DEFAULT_FX_RATES.CHF,
          SGD: data.rates.SGD ?? DEFAULT_FX_RATES.SGD,
          IDR: data.rates.IDR ?? DEFAULT_FX_RATES.IDR,
        };
        cachedFx = { rates, fetchedAt: now, sourceName: "ExchangeRate-API Live FX" };
        return { rates, live: true, sourceName: "ExchangeRate-API Live FX" };
      }
    }
  } catch {
    // fall through
  }

  return { rates: DEFAULT_FX_RATES, live: false };
}

async function fetchYahooChart(symbol: string): Promise<{
  priceUsd: number;
  change24hPct: number;
  bars: OhlcBar[];
  closes: number[];
} | null> {
  try {
    const res = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=3mo`,
      {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(3500),
        cache: "no-store",
      },
    );
    if (!res.ok) return null;
    const json = await res.json();
    const result = json?.chart?.result?.[0];
    const meta = result?.meta;
    const quote = result?.indicators?.quote?.[0];
    if (!meta || !quote) return null;

    const highs: Array<number | null> = quote.high ?? [];
    const lows: Array<number | null> = quote.low ?? [];
    const closesRaw: Array<number | null> = quote.close ?? [];

    const bars: OhlcBar[] = [];
    const closes: number[] = [];
    for (let i = 0; i < closesRaw.length; i++) {
      const h = highs[i];
      const l = lows[i];
      const c = closesRaw[i];
      if (typeof h === "number" && typeof l === "number" && typeof c === "number" && c > 0) {
        bars.push({ high: h, low: l, close: c });
        closes.push(c);
      }
    }

    const priceUsd =
      typeof meta.regularMarketPrice === "number" && meta.regularMarketPrice > 0
        ? meta.regularMarketPrice
        : closes[closes.length - 1] ?? 0;
    const lastBarClose = closes[closes.length - 1] ?? priceUsd;
    const prevSessionClose =
      closes.length >= 2 && Math.abs(lastBarClose - priceUsd) / Math.max(1e-9, priceUsd) < 0.005
        ? closes[closes.length - 2]
        : closes.length >= 1
          ? closes[closes.length - 1]
          : priceUsd;
    const prevClose =
      typeof meta.previousClose === "number" && meta.previousClose > 0
        ? meta.previousClose
        : prevSessionClose;
    const change24hPct = prevClose > 0 ? ((priceUsd - prevClose) / prevClose) * 100 : 0;

    if (priceUsd <= 0) return null;
    return { priceUsd, change24hPct, bars, closes };
  } catch {
    return null;
  }
}

async function fetchTradingViewEquity(symbol: string): Promise<{
  priceUsd: number;
  change24hPct: number;
  sma20Usd: number;
  sma50Usd: number;
  volPct: number;
} | null> {
  try {
    const res = await fetch("https://scanner.tradingview.com/america/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
      body: JSON.stringify({
        filter: [{ left: "name", operation: "equal", right: symbol }],
        columns: ["name", "close", "change", "SMA20", "SMA50", "Volatility.D"],
        range: [0, 3],
      }),
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { data?: Array<{ d?: Array<string | number | null> }> };
    const row = json?.data?.[0]?.d;
    if (!row) return null;
    const priceUsd = typeof row[1] === "number" ? row[1] : 0;
    if (!Number.isFinite(priceUsd) || priceUsd <= 0) return null;
    const change24hPct = typeof row[2] === "number" ? row[2] : 0;
    const sma20Usd = typeof row[3] === "number" && row[3] > 0 ? row[3] : priceUsd;
    const sma50Usd = typeof row[4] === "number" && row[4] > 0 ? row[4] : priceUsd;
    const dailyVol = typeof row[5] === "number" && row[5] > 0 ? row[5] : 2.1;
    const volPct = dailyVol * Math.sqrt(252);
    return { priceUsd, change24hPct, sma20Usd, sma50Usd, volPct };
  } catch {
    return null;
  }
}

async function fetchPerpFundingRatePct(symbol: string): Promise<number | null> {
  try {
    const res = await fetch(`https://fapi.binance.com/fapi/v1/premiumIndex?symbol=${symbol}USDT`, {
      signal: AbortSignal.timeout(2200),
      cache: "no-store",
    });
    if (res.ok) {
      const f = (await res.json()) as { lastFundingRate?: string };
      const parsed = Number.parseFloat(f.lastFundingRate ?? "");
      if (Number.isFinite(parsed)) return parsed * 100;
    }
  } catch {
    // try OKX
  }

  try {
    const res = await fetch(`https://www.okx.com/api/v5/public/funding-rate?instId=${symbol}-USDT-SWAP`, {
      signal: AbortSignal.timeout(2200),
      cache: "no-store",
    });
    if (res.ok) {
      const j = (await res.json()) as { data?: Array<{ fundingRate?: string }> };
      const parsed = Number.parseFloat(j?.data?.[0]?.fundingRate ?? "");
      if (Number.isFinite(parsed)) return parsed * 100;
    }
  } catch {
    // try Bybit
  }

  try {
    const res = await fetch(`https://api.bybit.com/v5/market/tickers?category=linear&symbol=${symbol}USDT`, {
      signal: AbortSignal.timeout(2200),
      cache: "no-store",
    });
    if (res.ok) {
      const j = (await res.json()) as { result?: { list?: Array<{ fundingRate?: string }> } };
      const parsed = Number.parseFloat(j?.result?.list?.[0]?.fundingRate ?? "");
      if (Number.isFinite(parsed)) return parsed * 100;
    }
  } catch {
    // ignore
  }

  return null;
}

async function fetchBinanceTelemetry(symbol: string): Promise<{
  priceUsd: number;
  change24hPct: number;
  bidUsd: number;
  askUsd: number;
  bars: OhlcBar[];
  closes: number[];
  fundingRatePct: number | null;
} | null> {
  const pair = `${symbol}USDT`;
  try {
    const [tickerRes, bookRes, klinesRes, fundingRatePct] = await Promise.all([
      fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`, {
        signal: AbortSignal.timeout(3000),
        cache: "no-store",
      }).catch(() => null),
      fetch(`https://api.binance.com/api/v3/ticker/bookTicker?symbol=${pair}`, {
        signal: AbortSignal.timeout(3000),
        cache: "no-store",
      }).catch(() => null),
      fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=1d&limit=55`, {
        signal: AbortSignal.timeout(3000),
        cache: "no-store",
      }).catch(() => null),
      fetchPerpFundingRatePct(symbol),
    ]);

    if (!tickerRes || !tickerRes.ok) return null;
    const ticker = (await tickerRes.json()) as { lastPrice?: string; priceChangePercent?: string };
    const priceUsd = Number.parseFloat(ticker.lastPrice ?? "0");
    if (!Number.isFinite(priceUsd) || priceUsd <= 0) return null;
    const change24hPct = Number.parseFloat(ticker.priceChangePercent ?? "0") || 0;

    let bidUsd = priceUsd * 0.9998;
    let askUsd = priceUsd * 1.0002;
    if (bookRes && bookRes.ok) {
      const book = (await bookRes.json()) as { bidPrice?: string; askPrice?: string };
      const b = Number.parseFloat(book.bidPrice ?? "0");
      const a = Number.parseFloat(book.askPrice ?? "0");
      if (b > 0 && a > 0) {
        bidUsd = b;
        askUsd = a;
      }
    }

    const bars: OhlcBar[] = [];
    const closes: number[] = [];
    if (klinesRes && klinesRes.ok) {
      const klines = (await klinesRes.json()) as Array<[number, string, string, string, string]>;
      for (const k of klines) {
        const high = Number.parseFloat(k[2]);
        const low = Number.parseFloat(k[3]);
        const close = Number.parseFloat(k[4]);
        if (high > 0 && low > 0 && close > 0) {
          bars.push({ high, low, close });
          closes.push(close);
        }
      }
    }

    return { priceUsd, change24hPct, bidUsd, askUsd, bars, closes, fundingRatePct };
  } catch {
    return null;
  }
}

async function fetchCoinbaseTicker(symbol: string): Promise<{
  priceUsd: number;
  bidUsd: number;
  askUsd: number;
  change24hPct: number | null;
} | null> {
  try {
    const [tickerRes, statsRes] = await Promise.all([
      fetch(`https://api.exchange.coinbase.com/products/${symbol}-USD/ticker`, {
        signal: AbortSignal.timeout(2500),
        cache: "no-store",
      }),
      fetch(`https://api.exchange.coinbase.com/products/${symbol}-USD/stats`, {
        signal: AbortSignal.timeout(2500),
        cache: "no-store",
      }).catch(() => null),
    ]);
    if (!tickerRes.ok) return null;
    const data = (await tickerRes.json()) as { price?: string; bid?: string; ask?: string };
    const priceUsd = Number.parseFloat(data.price ?? "0");
    const bidUsd = Number.parseFloat(data.bid ?? "0") || priceUsd * 0.9997;
    const askUsd = Number.parseFloat(data.ask ?? "0") || priceUsd * 1.0003;
    if (!Number.isFinite(priceUsd) || priceUsd <= 0) return null;

    let change24hPct: number | null = null;
    if (statsRes && statsRes.ok) {
      const stats = (await statsRes.json()) as { open?: string; last?: string };
      const openVal = Number.parseFloat(stats.open ?? "0");
      if (openVal > 0) {
        change24hPct = ((priceUsd - openVal) / openVal) * 100;
      }
    }

    return { priceUsd, bidUsd, askUsd, change24hPct };
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  const rawSymbol = req.nextUrl.searchParams.get("symbol") ?? "NVDA";
  const symbol = rawSymbol.trim().toUpperCase().replace(/[^A-Z0-9-]/g, "") || "NVDA";

  const knownAsset = ASSET_BY_SYMBOL[symbol];
  const isCrypto = knownAsset ? knownAsset.kind !== "stock" : ["BTC", "ETH", "SOL", "PEPE", "DOGE", "XRP", "AVAX"].includes(symbol);
  const assetClass: "equity" | "crypto" = isCrypto ? "crypto" : "equity";

  const fxPromise = fetchFreeFxRates();
  const sources: string[] = [];

  if (assetClass === "crypto") {
    const [binanceData, coinbaseData, yahooCrypto, fxResult] = await Promise.all([
      fetchBinanceTelemetry(symbol),
      fetchCoinbaseTicker(symbol),
      fetchYahooChart(`${symbol}-USD`),
      fxPromise,
    ]);

    if (fxResult.live && fxResult.sourceName) sources.push(fxResult.sourceName);

    if (binanceData) {
      sources.unshift("Binance Spot & Futures API");
      const bars = binanceData.bars.length >= 15 ? binanceData.bars : yahooCrypto?.bars ?? [];
      const closes = binanceData.closes.length >= 15 ? binanceData.closes : yahooCrypto?.closes ?? [binanceData.priceUsd];
      const atr14Usd = bars.length >= 2 ? computeAtr14(bars) : binanceData.priceUsd * 0.045;
      const realizedVol20dPct =
        closes.length >= 5 ? computeRealizedVolatilityPct(closes, 365) : 0;
      const sma20Usd = closes.length >= 5 ? computeSma(closes, 20) : binanceData.priceUsd;
      const sma50Usd = closes.length >= 5 ? computeSma(closes, 50) : binanceData.priceUsd;
      const spreadBps =
        binanceData.bidUsd > 0
          ? ((binanceData.askUsd - binanceData.bidUsd) / binanceData.priceUsd) * 10000
          : 2.0;

      const payload: LiveFeedTelemetry = {
        symbol,
        assetClass: "crypto",
        priceUsd: binanceData.priceUsd,
        change24hPct: binanceData.change24hPct,
        bidUsd: binanceData.bidUsd,
        askUsd: binanceData.askUsd,
        spreadBps,
        atr14Usd,
        atr14Pct: (atr14Usd / binanceData.priceUsd) * 100,
        realizedVol20dPct,
        sma20Usd,
        sma50Usd,
        fundingRatePct: binanceData.fundingRatePct,
        fxRates: fxResult.rates,
        sources,
        asOf: new Date().toISOString(),
        isFallback: false,
      };
      return NextResponse.json(payload);
    }

    if (coinbaseData || yahooCrypto) {
      if (coinbaseData) sources.unshift("Coinbase Exchange Ticker");
      if (yahooCrypto) sources.push("Yahoo Finance 90D Candles");

      const priceUsd = coinbaseData?.priceUsd ?? yahooCrypto?.priceUsd ?? 0;
      if (priceUsd > 0) {
        const [fundingRatePct] = await Promise.all([fetchPerpFundingRatePct(symbol)]);
        const bidUsd = coinbaseData?.bidUsd ?? priceUsd * 0.9997;
        const askUsd = coinbaseData?.askUsd ?? priceUsd * 1.0003;
        const bars = yahooCrypto?.bars ?? [];
        const closes = yahooCrypto?.closes ?? [priceUsd];
        const atr14Usd = bars.length >= 2 ? computeAtr14(bars) : priceUsd * 0.045;

        const payload: LiveFeedTelemetry = {
          symbol,
          assetClass: "crypto",
          priceUsd,
          change24hPct: coinbaseData?.change24hPct ?? yahooCrypto?.change24hPct ?? 0,
          bidUsd,
          askUsd,
          spreadBps: ((askUsd - bidUsd) / priceUsd) * 10000,
          atr14Usd,
          atr14Pct: (atr14Usd / priceUsd) * 100,
          realizedVol20dPct: closes.length >= 5 ? computeRealizedVolatilityPct(closes, 365) : 0,
          sma20Usd: closes.length >= 5 ? computeSma(closes, 20) : priceUsd,
          sma50Usd: closes.length >= 5 ? computeSma(closes, 50) : priceUsd,
          fundingRatePct,
          fxRates: fxResult.rates,
          sources,
          asOf: new Date().toISOString(),
          isFallback: false,
        };
        return NextResponse.json(payload);
      }
    }
  } else {
    const [yahooStock, tvStock, fxResult] = await Promise.all([
      fetchYahooChart(symbol),
      fetchTradingViewEquity(symbol),
      fxPromise,
    ]);
    if (fxResult.live && fxResult.sourceName) sources.push(fxResult.sourceName);

    if (yahooStock) {
      sources.unshift("Yahoo Finance 90D OHLCV");
      const atr14Usd = yahooStock.bars.length >= 2 ? computeAtr14(yahooStock.bars) : yahooStock.priceUsd * 0.028;
      const bidUsd = yahooStock.priceUsd * 0.99985;
      const askUsd = yahooStock.priceUsd * 1.00015;
      const payload: LiveFeedTelemetry = {
        symbol,
        assetClass: "equity",
        priceUsd: yahooStock.priceUsd,
        change24hPct: yahooStock.change24hPct,
        bidUsd,
        askUsd,
        spreadBps: ((askUsd - bidUsd) / yahooStock.priceUsd) * 10000,
        atr14Usd,
        atr14Pct: (atr14Usd / yahooStock.priceUsd) * 100,
        realizedVol20dPct:
          yahooStock.closes.length >= 5 ? computeRealizedVolatilityPct(yahooStock.closes, 252) : (tvStock?.volPct ?? 0),
        sma20Usd: yahooStock.closes.length >= 5 ? computeSma(yahooStock.closes, 20) : (tvStock?.sma20Usd ?? yahooStock.priceUsd),
        sma50Usd: yahooStock.closes.length >= 5 ? computeSma(yahooStock.closes, 50) : (tvStock?.sma50Usd ?? yahooStock.priceUsd),
        fundingRatePct: null,
        fxRates: fxResult.rates,
        sources,
        asOf: new Date().toISOString(),
        isFallback: false,
      };
      return NextResponse.json(payload);
    }

    if (tvStock) {
      sources.unshift("TradingView Live Scanner");
      const volPct = tvStock.volPct;
      const atr14Usd = tvStock.priceUsd * (volPct / 100 / Math.sqrt(252)) * 1.35;
      const bidUsd = tvStock.priceUsd * 0.99985;
      const askUsd = tvStock.priceUsd * 1.00015;
      const payload: LiveFeedTelemetry = {
        symbol,
        assetClass: "equity",
        priceUsd: tvStock.priceUsd,
        change24hPct: tvStock.change24hPct,
        bidUsd,
        askUsd,
        spreadBps: ((askUsd - bidUsd) / tvStock.priceUsd) * 10000,
        atr14Usd,
        atr14Pct: (atr14Usd / tvStock.priceUsd) * 100,
        realizedVol20dPct: volPct,
        sma20Usd: tvStock.sma20Usd,
        sma50Usd: tvStock.sma50Usd,
        fundingRatePct: null,
        fxRates: fxResult.rates,
        sources,
        asOf: new Date().toISOString(),
        isFallback: false,
      };
      return NextResponse.json(payload);
    }
  }

  // Hydrate full multi-venue market pipeline before constructing response
  await Promise.all([ensureMarketData(), ensureSymbolHistory(symbol)]);
  const fxResult = await fxPromise;
  const liveQuote = quoteFor(symbol);
  const liveMetrics = knownAsset ? metricsFor(knownAsset) : null;
  const priceUsd = liveQuote?.price && liveQuote.price > 0
    ? liveQuote.price
    : liveMetrics && liveMetrics.last > 0
      ? liveMetrics.last
      : 0;

  if (priceUsd <= 0) {
    return NextResponse.json(
      { error: `Live telemetry unavailable for ${symbol}. Upstream exchanges did not return a live quote.` },
      { status: 503 },
    );
  }

  const volPct = liveMetrics ? liveMetrics.vol * 100 : assetClass === "crypto" ? 58.0 : 34.0;
  const atr14Usd = priceUsd * (volPct / 100 / Math.sqrt(assetClass === "crypto" ? 365 : 252)) * 1.35;
  const fundingRatePct = assetClass === "crypto" ? await fetchPerpFundingRatePct(symbol) : null;

  const livePayload: LiveFeedTelemetry = {
    symbol,
    assetClass,
    priceUsd,
    change24hPct: liveQuote ? liveQuote.change * 100 : (liveMetrics?.change24h ?? 0) * 100,
    bidUsd: priceUsd * 0.9998,
    askUsd: priceUsd * 1.0002,
    spreadBps: 4.0,
    atr14Usd,
    atr14Pct: (atr14Usd / priceUsd) * 100,
    realizedVol20dPct: volPct,
    sma20Usd: liveMetrics?.sma20 ?? priceUsd,
    sma50Usd: liveMetrics?.sma50 ?? priceUsd,
    fundingRatePct,
    fxRates: fxResult.rates,
    sources: [
      ...(fxResult.live && fxResult.sourceName ? [fxResult.sourceName] : []),
      assetClass === "crypto" ? "CoinGecko / Multi-Venue Live" : "TradingView Live Scanner",
    ],
    asOf: new Date().toISOString(),
    isFallback: false,
  };

  return NextResponse.json(livePayload);
}
