import { NextRequest, NextResponse } from "next/server";
import { ASSET_BY_SYMBOL, quoteFor } from "@/lib/market";
import { ensureMarketData } from "@/lib/market-data";
import type {
  WSJEarningsEvent,
  WSJInsiderTrade,
  WSJMarketLeader,
  WSJSectorPerformance,
} from "@/lib/wsj-data";
import type {
  AINewsIntel,
  CommoditySpot,
  FearAndGreedData,
  MacroRegimeQuadrant,
  PerpetualContract,
  PolymarketContract,
} from "@/lib/neuberg-platform";
import type { OpenBBMacroIndicator, OpenBBYieldPoint } from "@/lib/openbb-platform";
import type { BISTAsset } from "@/lib/oraclex-platform";

export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const SEC_HEADERS = {
  "User-Agent": "NextWallStreet InstitutionalResearch/1.0 research@nextwallstreet.com",
  Accept: "application/atom+xml, application/xml, text/xml, */*",
};

const responseCache = new Map<string, { data: unknown; expiresAt: number }>();

function getCached<T>(key: string): T | null {
  const hit = responseCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    responseCache.delete(key);
    return null;
  }
  return hit.data as T;
}

function setCached(key: string, data: unknown, ttlMs: number) {
  responseCache.set(key, { data, expiresAt: Date.now() + ttlMs });
}

function formatCompactMoney(val: number): string {
  if (!Number.isFinite(val) || val <= 0) return "—";
  if (val >= 1e12) return `$${(val / 1e12).toFixed(2)}T`;
  if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
  return `$${val.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function formatCompactShares(val: number): string {
  if (!Number.isFinite(val) || val <= 0) return "—";
  if (val >= 1e9) return `${(val / 1e9).toFixed(2)}B`;
  if (val >= 1e6) return `${(val / 1e6).toFixed(1)}M`;
  if (val >= 1e3) return `${(val / 1e3).toFixed(1)}K`;
  return `${Math.round(val)}`;
}

function toNum(v: unknown, fallback = 0): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v.replace(/[$,%\s]/g, ""));
    if (Number.isFinite(n)) return n;
  }
  return fallback;
}

async function fetchJsonSafe<T>(url: string, init?: RequestInit, timeoutMs = 4000): Promise<T | null> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "User-Agent": UA, ...(init?.headers ?? {}) },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function fetchTextSafe(url: string, init?: RequestInit, timeoutMs = 4000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "User-Agent": UA, ...(init?.headers ?? {}) },
      signal: AbortSignal.timeout(timeoutMs),
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

type TvRow = { s: string; d: (string | number | null)[] };

async function scanTradingView(
  market: "america" | "global" | "cfd" | "turkey",
  body: Record<string, unknown>,
): Promise<TvRow[]> {
  const json = await fetchJsonSafe<{ data?: TvRow[] }>(
    `https://scanner.tradingview.com/${market}/scan`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
    4500,
  );
  return json?.data ?? [];
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTag(block: string, tag: string): string {
  const re = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = block.match(re);
  return m ? decodeXmlEntities(m[1]) : "";
}

async function fetchSecForm4Trades(): Promise<WSJInsiderTrade[]> {
  const xml = await fetchTextSafe(
    "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=4&count=20&output=atom",
    { headers: SEC_HEADERS },
    4500,
  );
  if (!xml) return [];

  const entries = xml.match(/<entry>[\s\S]*?<\/entry>/gi) ?? [];
  const out: WSJInsiderTrade[] = [];

  for (let i = 0; i < entries.length && out.length < 10; i++) {
    const entry = entries[i];
    const title = extractTag(entry, "title"); // e.g. "4 - NVIDIA CORP (0001045810) (Issuer)" or "(Reporting)"
    const updated = extractTag(entry, "updated");
    const summary = extractTag(entry, "summary");

    // Extract clean issuer name
    const cleanTitle = title.replace(/^4\s*-\s*/i, "").replace(/\s*\(\d{10}\).*$/, "").trim();
    if (!cleanTitle) continue;

    // Match against known tickers by word prefix / name
    let matchedSym = "SEC";
    const upperTitle = cleanTitle.toUpperCase();
    for (const [sym, asset] of Object.entries(ASSET_BY_SYMBOL)) {
      if (asset.kind !== "stock") continue;
      const rootName = asset.name.toUpperCase().replace(/\s+(INC\.?|CORP\.?|CORPORATION|LTD\.?|CO\.?|PLC)$/i, "").trim();
      if (rootName.length >= 4 && upperTitle.includes(rootName)) {
        matchedSym = sym;
        break;
      }
    }

    const q = matchedSym !== "SEC" ? quoteFor(matchedSym) : undefined;
    const isIssuer = /\(Issuer\)/i.test(title);
    const filingTime = updated ? new Date(updated).toLocaleTimeString("en-US", { timeZone: "America/New_York", hour12: false, hour: "2-digit", minute: "2-digit" }) + " EST" : "Today EST";

    out.push({
      id: `sec-f4-${i}-${updated}`,
      symbol: matchedSym,
      company: cleanTitle,
      insiderName: isIssuer ? "Reporting Officer / Director" : cleanTitle,
      title: isIssuer ? "Section 16 Officer / Director" : "10% Beneficial Owner / Insider",
      type: summary.toLowerCase().includes("acquisition") ? "BUY" : "OPTION_EXERCISE",
      shares: "Form 4 Filing",
      price: q?.price ?? 0,
      totalValue: "EDGAR Verified",
      filingDate: filingTime,
      significance: isIssuer ? "High - Cluster Buying" : "Routine Diversification",
    });
  }

  return out;
}

const SECTOR_ETFS = [
  { symbol: "XLK", name: "Information Technology", leader: "NVDA / AAPL", laggard: "INTC" },
  { symbol: "XLF", name: "Financials & Banking", leader: "JPM / GS", laggard: "USB" },
  { symbol: "XLC", name: "Communication Services", leader: "META / GOOGL", laggard: "PARA" },
  { symbol: "XLV", name: "Healthcare & Biotech", leader: "LLY / AMGN", laggard: "MRNA" },
  { symbol: "XLY", name: "Consumer Discretionary", leader: "AMZN / TSLA", laggard: "NKE" },
  { symbol: "XLI", name: "Industrial & Defense", leader: "GE / CARR", laggard: "BA" },
  { symbol: "XLE", name: "Energy & Petrochemical", leader: "XOM / SLB", laggard: "OXY" },
  { symbol: "XLP", name: "Consumer Staples", leader: "COST / WMT", laggard: "KHC" },
  { symbol: "XLB", name: "Materials & Mining", leader: "LIN / FCX", laggard: "NEM" },
  { symbol: "XLU", name: "Utilities & Power Grid", leader: "CEG / VST", laggard: "PCG" },
  { symbol: "XLRE", name: "Real Estate (REITs)", leader: "PLD / AMT", laggard: "CCI" },
];

function rowToMarketLeader(row: TvRow): WSJMarketLeader {
  const [name, desc, close, changePct, changeAbs, vol, valTraded, pe, mcap, sector, hi52, lo52] = row.d;
  const price = toNum(close);
  return {
    symbol: String(name ?? ""),
    name: String(desc ?? name ?? ""),
    price,
    change: toNum(changeAbs),
    changePct: toNum(changePct),
    volume: formatCompactShares(toNum(vol)),
    notional: formatCompactMoney(toNum(valTraded) || price * toNum(vol)),
    peRatio: Number(toNum(pe).toFixed(1)),
    marketCap: formatCompactMoney(toNum(mcap)),
    sector: String(sector ?? "US Equities"),
    week52High: toNum(hi52, price),
    week52Low: toNum(lo52, price),
  };
}

async function fetchNasdaqEarningsEvents(): Promise<WSJEarningsEvent[]> {
  const now = new Date();
  const day = now.getUTCDay();
  const offsetDays = day === 6 ? 2 : day === 0 ? 1 : 0;
  const target = new Date(now.getTime() + offsetDays * 86_400_000);
  const dateStr = target.toISOString().slice(0, 10);

  const json = await fetchJsonSafe<{
    data?: {
      rows?: Array<{
        symbol?: string;
        name?: string;
        time?: string;
        epsForecast?: string;
        lastYearEPS?: string;
        surprise?: string;
      }>;
    };
  }>(`https://api.nasdaq.com/api/calendar/earnings?date=${dateStr}`, {
    headers: { Accept: "application/json", "User-Agent": UA },
  }, 4000);

  const rows = json?.data?.rows ?? [];
  return rows
    .filter((r) => Boolean(r.symbol && r.name))
    .slice(0, 12)
    .map((r, i) => {
      const sym = String(r.symbol ?? "").trim().toUpperCase();
      const timeRaw = String(r.time ?? "").toLowerCase();
      const timing: WSJEarningsEvent["timing"] =
        timeRaw.includes("pre") || timeRaw.includes("before")
          ? "Before Market Open (BMO)"
          : "After Market Close (AMC)";
      const surpriseRaw = String(r.surprise ?? "").trim();
      const surpriseNum = toNum(surpriseRaw, 0);
      const sentiment: WSJEarningsEvent["sentiment"] =
        surpriseNum > 2 ? "Bullish Skew" : surpriseNum < -2 ? "Bearish Skew" : "Neutral Straddle";
      return {
        id: `nasdaq-ee-${dateStr}-${sym}-${i}`,
        symbol: sym,
        company: String(r.name ?? sym).trim(),
        reportDate: dateStr,
        timing,
        consensusEPS: r.epsForecast && r.epsForecast !== "N/A" ? r.epsForecast : "—",
        whisperEPS: r.lastYearEPS && r.lastYearEPS !== "N/A" ? `Prev ${r.lastYearEPS}` : "—",
        impliedMove: "Live Session",
        sentiment,
        lastQuarterSurprise: surpriseRaw && surpriseRaw !== "N/A" ? `${surpriseRaw}%` : "—",
      };
    });
}

async function handleMarketCenter() {
  const cached = getCached<Record<string, unknown>>("market-center");
  if (cached) return NextResponse.json(cached);

  await ensureMarketData();

  const cols = [
    "name",
    "description",
    "close",
    "change",
    "change_abs",
    "volume",
    "Value.Traded",
    "price_earnings_ttm",
    "market_cap_basic",
    "sector",
    "price_52_week_high",
    "price_52_week_low",
  ];

  const [activeRows, gainerRows, loserRows, sectorRows, secTrades, earningsEvents] = await Promise.all([
    scanTradingView("america", {
      filter: [
        { left: "exchange", operation: "in_range", right: ["NYSE", "NASDAQ"] },
        { left: "type", operation: "equal", right: "stock" },
        { left: "market_cap_basic", operation: "greater", right: 2e9 },
      ],
      columns: cols,
      sort: { sortBy: "Value.Traded", sortOrder: "desc" },
      range: [0, 10],
    }),
    scanTradingView("america", {
      filter: [
        { left: "exchange", operation: "in_range", right: ["NYSE", "NASDAQ"] },
        { left: "type", operation: "equal", right: "stock" },
        { left: "market_cap_basic", operation: "greater", right: 5e9 },
      ],
      columns: cols,
      sort: { sortBy: "change", sortOrder: "desc" },
      range: [0, 8],
    }),
    scanTradingView("america", {
      filter: [
        { left: "exchange", operation: "in_range", right: ["NYSE", "NASDAQ"] },
        { left: "type", operation: "equal", right: "stock" },
        { left: "market_cap_basic", operation: "greater", right: 5e9 },
      ],
      columns: cols,
      sort: { sortBy: "change", sortOrder: "asc" },
      range: [0, 8],
    }),
    scanTradingView("america", {
      symbols: {
        tickers: SECTOR_ETFS.map((s) => `AMEX:${s.symbol}`),
        query: { types: [] },
      },
      columns: ["name", "close", "change", "Perf.W", "Perf.1M", "Perf.YTD", "price_earnings_ttm"],
    }),
    fetchSecForm4Trades(),
    fetchNasdaqEarningsEvents(),
  ]);

  const sectorMap = new Map<string, (string | number | null)[]>();
  for (const r of sectorRows) {
    const sym = String(r.d?.[0] ?? "").toUpperCase();
    if (sym) sectorMap.set(sym, r.d);
  }

  const sectors: WSJSectorPerformance[] = SECTOR_ETFS.map((meta) => {
    const d = sectorMap.get(meta.symbol);
    return {
      name: meta.name,
      change1d: Number(toNum(d?.[2]).toFixed(2)),
      change1w: Number(toNum(d?.[3]).toFixed(2)),
      change1m: Number(toNum(d?.[4]).toFixed(2)),
      changeYTD: Number(toNum(d?.[5]).toFixed(2)),
      leader: meta.leader,
      laggard: meta.laggard,
      peAverage: Number(toNum(d?.[6], 0).toFixed(1)),
    };
  });

  const payload = {
    view: "market-center",
    asOf: new Date().toISOString(),
    sources: ["NYSE/NASDAQ Real-Time Scanner", "SPDR Sector ETFs", "SEC EDGAR Form 4 Wire", "Nasdaq Earnings Calendar"],
    mostActive: activeRows.map(rowToMarketLeader),
    topGainers: gainerRows.map(rowToMarketLeader),
    topLosers: loserRows.map(rowToMarketLeader),
    sectors,
    insiderTrades: secTrades,
    earningsEvents,
  };

  setCached("market-center", payload, 15_000);
  return NextResponse.json(payload);
}

async function fetchTreasuryYieldCurve(): Promise<{
  curve: OpenBBYieldPoint[];
  source: string;
}> {
  const year = new Date().getUTCFullYear();
  const csv = await fetchTextSafe(
    `https://home.treasury.gov/resource-center/data-chart-center/interest-rates/daily-treasury-rates.csv/${year}/all?type=daily_treasury_yield_curve&field_tdr_date_value=${year}&page&_format=csv`,
    undefined,
    4500,
  );

  if (csv) {
    const lines = csv
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (lines.length >= 2) {
      const headers = lines[0].split(",").map((h) => h.replace(/"/g, "").trim());
      // Most recent rows can be at index 1 (Treasury CSV returns newest first)
      const latestCols = lines[1].split(",").map((c) => c.replace(/"/g, "").trim());
      const prevCols = (lines[2] ?? lines[1]).split(",").map((c) => c.replace(/"/g, "").trim());

      const tenorSpecs = [
        { header: "1 Mo", tenor: "1M", months: 1 },
        { header: "3 Mo", tenor: "3M", months: 3 },
        { header: "6 Mo", tenor: "6M", months: 6 },
        { header: "1 Yr", tenor: "1Y", months: 12 },
        { header: "2 Yr", tenor: "2Y", months: 24 },
        { header: "3 Yr", tenor: "3Y", months: 36 },
        { header: "5 Yr", tenor: "5Y", months: 60 },
        { header: "7 Yr", tenor: "7Y", months: 84 },
        { header: "10 Yr", tenor: "10Y", months: 120 },
        { header: "20 Yr", tenor: "20Y", months: 240 },
        { header: "30 Yr", tenor: "30Y", months: 360 },
      ];

      const curve: OpenBBYieldPoint[] = [];
      for (const spec of tenorSpecs) {
        const idx = headers.findIndex((h) => h.toLowerCase() === spec.header.toLowerCase());
        if (idx === -1) continue;
        const rate = toNum(latestCols[idx], -1);
        const previousRate = toNum(prevCols[idx], rate);
        if (rate >= 0) {
          curve.push({
            tenor: spec.tenor,
            months: spec.months,
            rate: Number(rate.toFixed(2)),
            previousRate: Number(previousRate.toFixed(2)),
          });
        }
      }
      if (curve.length >= 6) {
        return { curve, source: "US Treasury Daily Par Yield Curve" };
      }
    }
  }

  // Fallback to TradingView sovereign Treasury yields
  const tvYields = await scanTradingView("global", {
    symbols: {
      tickers: ["TVC:US01MY", "TVC:US03MY", "TVC:US06MY", "TVC:US01Y", "TVC:US02Y", "TVC:US05Y", "TVC:US10Y", "TVC:US30Y"],
      query: { types: [] },
    },
    columns: ["name", "close", "change_abs"],
  });

  const map = new Map<string, { close: number; abs: number }>();
  for (const r of tvYields) {
    map.set(r.s, { close: toNum(r.d?.[1]), abs: toNum(r.d?.[2]) });
  }

  const tvSpecs = [
    { s: "TVC:US01MY", tenor: "1M", months: 1 },
    { s: "TVC:US03MY", tenor: "3M", months: 3 },
    { s: "TVC:US06MY", tenor: "6M", months: 6 },
    { s: "TVC:US01Y", tenor: "1Y", months: 12 },
    { s: "TVC:US02Y", tenor: "2Y", months: 24 },
    { s: "TVC:US05Y", tenor: "5Y", months: 60 },
    { s: "TVC:US10Y", tenor: "10Y", months: 120 },
    { s: "TVC:US30Y", tenor: "30Y", months: 360 },
  ];

  const curve: OpenBBYieldPoint[] = tvSpecs
    .map((spec) => {
      const hit = map.get(spec.s);
      if (!hit || hit.close <= 0) return null;
      return {
        tenor: spec.tenor,
        months: spec.months,
        rate: Number(hit.close.toFixed(2)),
        previousRate: Number((hit.close - hit.abs).toFixed(2)),
      };
    })
    .filter((p): p is OpenBBYieldPoint => p !== null);

  return { curve, source: "TradingView Sovereign Yield Feed" };
}

async function fetchLiveMacroNews(): Promise<AINewsIntel[]> {
  const feeds = [
    { url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114", source: "CNBC Top Wire", category: "Geopolitics" as const },
    { url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664", source: "CNBC Markets", category: "Central Bank" as const },
    { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", source: "CoinDesk Wire", category: "Big Tech" as const },
  ];

  const xmls = await Promise.all(feeds.map((f) => fetchTextSafe(f.url, undefined, 3500)));
  const items: AINewsIntel[] = [];

  feeds.forEach((feed, fIdx) => {
    const xml = xmls[fIdx];
    if (!xml) return;
    const rawItems = xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];
    for (let i = 0; i < Math.min(4, rawItems.length); i++) {
      const block = rawItems[i];
      const title = extractTag(block, "title");
      const desc = extractTag(block, "description");
      const pubDate = extractTag(block, "pubDate");
      if (!title) continue;

      const textLower = `${title} ${desc}`.toLowerCase();
      const sentiment: AINewsIntel["sentiment"] =
        /(surge|rally|beat|gain|cut|approval|record|expand|bull|growth)/.test(textLower)
          ? "BULLISH"
          : /(drop|slump|tariff|war|conflict|miss|hike|selloff|warning|probe|risk)/.test(textLower)
            ? "BEARISH"
            : "NEUTRAL";

      const tickers: string[] = [];
      for (const candidate of ["NVDA", "AAPL", "MSFT", "TSLA", "AMZN", "META", "BTC", "ETH", "SOL", "SPY", "QQQ"]) {
        if (title.toUpperCase().includes(candidate) || desc.toUpperCase().includes(candidate)) {
          tickers.push(candidate);
        }
      }
      if (tickers.length === 0) tickers.push(feed.source.includes("CoinDesk") ? "BTC" : "SPY");

      items.push({
        id: `live-news-${fIdx}-${i}`,
        headline: title,
        source: feed.source,
        timestamp: pubDate ? new Date(pubDate).toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" }) + " UTC" : "Live",
        category: feed.category,
        sentiment,
        impactScore: sentiment === "NEUTRAL" ? 7.4 : 8.6,
        affectedTickers: tickers.slice(0, 4),
        aiBrief: desc.slice(0, 220) || title,
      });
    }
  });

  return items;
}

async function handleMacroPerps() {
  const cached = getCached<Record<string, unknown>>("macro-perps");
  if (cached) return NextResponse.json(cached);

  await ensureMarketData();

  const [
    fngRes,
    tvGlobal,
    tvPerpStocks,
    yieldResult,
    binancePrem,
    binance24h,
    btcOiRes,
    ethOiRes,
    solOiRes,
    hyperliquidMeta,
    polymarketRaw,
    liveNews,
    fxRes,
  ] = await Promise.all([
    fetchJsonSafe<{ data?: Array<{ value: string; value_classification: string }> }>(
      "https://api.alternative.me/fng/?limit=35&format=json",
    ),
    scanTradingView("global", {
      symbols: {
        tickers: [
          "SP:SPX",
          "NASDAQ:IXIC",
          "TVC:VIX",
          "TVC:DXY",
          "TVC:GOLD",
          "TVC:SILVER",
          "NYMEX:CL1!",
          "ICEEUR:BRN1!",
          "COMEX:HG1!",
          "NYMEX:NG1!",
          "FX:EURUSD",
          "TVC:US02Y",
          "TVC:US10Y",
        ],
        query: { types: [] },
      },
      columns: ["name", "close", "change", "change_abs", "SMA50", "SMA200"],
    }),
    scanTradingView("america", {
      symbols: {
        tickers: ["NASDAQ:NVDA", "NASDAQ:AAPL", "NASDAQ:TSLA"],
        query: { types: [] },
      },
      columns: ["name", "close", "Value.Traded", "volume"],
    }),
    fetchTreasuryYieldCurve(),
    fetchJsonSafe<Array<{ symbol: string; markPrice: string; indexPrice: string; lastFundingRate: string }>>(
      "https://fapi.binance.com/fapi/v1/premiumIndex",
    ),
    fetchJsonSafe<Array<{ symbol: string; quoteVolume: string }>>(
      "https://fapi.binance.com/fapi/v1/ticker/24hr",
    ),
    fetchJsonSafe<{ openInterest: string }>("https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT"),
    fetchJsonSafe<{ openInterest: string }>("https://fapi.binance.com/fapi/v1/openInterest?symbol=ETHUSDT"),
    fetchJsonSafe<{ openInterest: string }>("https://fapi.binance.com/fapi/v1/openInterest?symbol=SOLUSDT"),
    fetchJsonSafe<
      [
        { universe?: Array<{ name: string }> },
        Array<{ funding?: string; openInterest?: string; markPx?: string; oraclePx?: string; dayNtlVlm?: string }>,
      ]
    >("https://api.hyperliquid.xyz/info", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "metaAndAssetCtxs" }),
    }),
    fetchJsonSafe<
      Array<{
        id: string;
        question: string;
        volume24hr?: number;
        volumeNum?: number;
        outcomePrices?: string;
        endDate?: string;
      }>
    >("https://gamma-api.polymarket.com/markets?closed=false&limit=10&order=volume24hr&ascending=false"),
    fetchLiveMacroNews(),
    fetchJsonSafe<{ rates?: Record<string, number> }>("https://api.frankfurter.app/latest?from=USD&to=EUR"),
  ]);

  const tvMap = new Map<string, { close: number; change: number; abs: number; sma50: number; sma200: number }>();
  for (const r of tvGlobal) {
    tvMap.set(r.s, {
      close: toNum(r.d?.[1]),
      change: toNum(r.d?.[2]),
      abs: toNum(r.d?.[3]),
      sma50: toNum(r.d?.[4]),
      sma200: toNum(r.d?.[5]),
    });
  }

  const spx = tvMap.get("SP:SPX");
  const ixic = tvMap.get("NASDAQ:IXIC");
  const vix = tvMap.get("TVC:VIX");
  const dxy = tvMap.get("TVC:DXY");
  const gold = tvMap.get("TVC:GOLD");
  const silver = tvMap.get("TVC:SILVER");
  const wti = tvMap.get("NYMEX:CL1!");
  const brent = tvMap.get("ICEEUR:BRN1!");
  const copper = tvMap.get("COMEX:HG1!");
  const natgas = tvMap.get("NYMEX:NG1!");
  const eurUsd = tvMap.get("FX:EURUSD");
  const us02yTv = tvMap.get("TVC:US02Y");
  const us10yTv = tvMap.get("TVC:US10Y");

  const y2 = yieldResult.curve.find((p) => p.tenor === "2Y")?.rate ?? us02yTv?.close ?? null;
  const y10 = yieldResult.curve.find((p) => p.tenor === "10Y")?.rate ?? us10yTv?.close ?? null;
  const y10Prev =
    yieldResult.curve.find((p) => p.tenor === "10Y")?.previousRate ??
    (y10 !== null && us10yTv ? y10 - us10yTv.abs : y10);
  const spread10y2yBps = y10 !== null && y2 !== null ? Math.round((y10 - y2) * 100) : null;

  const vixVal = vix && vix.close > 0 ? vix.close : null;
  const vixScore = vixVal !== null ? Math.max(5, Math.min(95, Math.round(100 - (vixVal - 11) * 3.1))) : null;
  const spxMomScore =
    spx && spx.sma200 > 0
      ? Math.max(10, Math.min(95, Math.round(50 + ((spx.close - spx.sma200) / spx.sma200) * 350)))
      : null;

  const fngEntries = fngRes?.data ?? [];
  const hasLiveFng = fngEntries.length > 0 && Number.isFinite(Number(fngEntries[0]?.value));
  const fngNow = hasLiveFng
    ? Number(fngEntries[0].value)
    : Math.round(((vixScore ?? 50) + (spxMomScore ?? 50)) / 2);
  const fngPrev = fngEntries[1] ? Number(fngEntries[1].value) : fngNow;
  const fngWeek = fngEntries[7] ? Number(fngEntries[7].value) : fngNow;
  const fngMonth = fngEntries[30] ? Number(fngEntries[30].value) : fngNow;

  const effectiveVixScore = vixScore ?? fngNow;
  const effectiveSpxScore = spxMomScore ?? fngNow;
  const compositeScore = Math.round(fngNow * 0.4 + effectiveVixScore * 0.3 + effectiveSpxScore * 0.3);
  const rating: FearAndGreedData["rating"] =
    compositeScore <= 24
      ? "Extreme Fear"
      : compositeScore <= 45
        ? "Fear"
        : compositeScore <= 55
          ? "Neutral"
          : compositeScore <= 75
            ? "Greed"
            : "Extreme Greed";

  const fearGreed: FearAndGreedData = {
    score: compositeScore,
    rating,
    previousClose: Math.round(fngPrev * 0.4 + effectiveVixScore * 0.3 + effectiveSpxScore * 0.3),
    oneWeekAgo: Math.round(fngWeek * 0.4 + effectiveVixScore * 0.3 + effectiveSpxScore * 0.3),
    oneMonthAgo: Math.round(fngMonth * 0.4 + effectiveVixScore * 0.3 + effectiveSpxScore * 0.3),
    factors: [
      {
        name: hasLiveFng
          ? `Crypto Sentiment (Alternative.me: ${fngNow}/100)`
          : "Live VIX & S&P Breadth Sentiment",
        score: fngNow,
        status: fngEntries[0]?.value_classification ?? rating,
      },
      {
        name: `Market Volatility (CBOE VIX ${vixVal !== null ? vixVal.toFixed(2) : "—"})`,
        score: effectiveVixScore,
        status: effectiveVixScore >= 55 ? "Greed" : effectiveVixScore >= 45 ? "Neutral" : "Fear",
      },
      {
        name: `S&P 500 vs 200-SMA (${spx?.close ? spx.close.toFixed(0) : "—"})`,
        score: effectiveSpxScore,
        status: effectiveSpxScore >= 55 ? "Greed" : effectiveSpxScore >= 45 ? "Neutral" : "Fear",
      },
      {
        name: `10Y-2Y Curve Slope (${spread10y2yBps !== null ? `${spread10y2yBps >= 0 ? "+" : ""}${spread10y2yBps} bps` : "—"})`,
        score:
          spread10y2yBps !== null
            ? Math.max(15, Math.min(90, 50 + Math.round(spread10y2yBps * 0.4)))
            : 50,
        status: spread10y2yBps === null ? "Pending" : spread10y2yBps >= 0 ? "Normalizing" : "Inverted",
      },
    ],
  };

  const growthScore = spx && spx.sma50 > 0 ? Math.max(-80, Math.min(80, Math.round(((spx.close - spx.sma50) / spx.sma50) * 600))) : 0;
  const inflationScore = y10 !== null ? Math.max(-50, Math.min(80, Math.round((y10 - 3.6) * 35))) : 0;
  const currentRegime: MacroRegimeQuadrant["currentRegime"] =
    growthScore >= 0 && inflationScore >= 0
      ? "Reflation"
      : growthScore >= 0
        ? "Goldilocks"
        : inflationScore >= 0
          ? "Stagflation"
          : "Deflation";

  const macroRegime: MacroRegimeQuadrant = {
    currentRegime,
    growthScore,
    inflationScore,
    recommendedAllocation:
      currentRegime === "Reflation"
        ? ["Equities (Semiconductors, Tech, Industrials)", "Commodities (Gold, Copper, Energy)", "Short Duration Credit"]
        : currentRegime === "Goldilocks"
          ? ["Growth Equities & AI Leaders", "High-Beta Digital Assets", "Investment Grade Duration"]
          : ["Short-Term Treasuries (T-Bills)", "Physical Gold & Hard Assets", "Defensive Staples & Healthcare"],
    historicalTransition: `Derived live from S&P 500 50-SMA trend (${growthScore >= 0 ? "+" : ""}${growthScore}), US 10Y Treasury yield (${y10 !== null ? `${y10.toFixed(2)}%` : "—"}), and VIX volatility (${vixVal !== null ? vixVal.toFixed(2) : "—"}).`,
  };

  const premMap = new Map((binancePrem ?? []).map((p) => [p.symbol, p]));
  const volMap = new Map((binance24h ?? []).map((p) => [p.symbol, toNum(p.quoteVolume)]));
  const oiUnitsMap = new Map<string, number>([
    ["BTC", toNum(btcOiRes?.openInterest)],
    ["ETH", toNum(ethOiRes?.openInterest)],
    ["SOL", toNum(solOiRes?.openInterest)],
  ]);

  // Index Hyperliquid live perp contexts
  const hlMap = new Map<string, { fundingHourlyPct: number; oiUsd: number; volUsd: number; markPx: number; oraclePx: number }>();
  if (Array.isArray(hyperliquidMeta) && hyperliquidMeta.length >= 2) {
    const universe = hyperliquidMeta[0]?.universe ?? [];
    const ctxs = hyperliquidMeta[1] ?? [];
    for (let i = 0; i < Math.min(universe.length, ctxs.length); i++) {
      const sym = universe[i]?.name?.toUpperCase();
      const ctx = ctxs[i];
      if (!sym || !ctx) continue;
      const markPx = toNum(ctx.markPx);
      const oraclePx = toNum(ctx.oraclePx, markPx);
      const oiContracts = toNum(ctx.openInterest);
      const volUsd = toNum(ctx.dayNtlVlm);
      const fundingHourlyPct = toNum(ctx.funding) * 100;
      hlMap.set(sym, {
        fundingHourlyPct,
        oiUsd: oiContracts * markPx,
        volUsd,
        markPx,
        oraclePx,
      });
    }
  }

  const stockTvVolMap = new Map<string, { close: number; valTraded: number }>();
  for (const r of tvPerpStocks) {
    const sym = String(r.d?.[0] ?? "").toUpperCase();
    const close = toNum(r.d?.[1]);
    const valTraded = toNum(r.d?.[2]) || close * toNum(r.d?.[3]);
    if (sym) stockTvVolMap.set(sym, { close, valTraded });
  }

  const stockPerps: PerpetualContract[] = (["NVDA", "AAPL", "TSLA"] as const).map((sym) => {
    const q = quoteFor(sym);
    const tvInfo = stockTvVolMap.get(sym);
    const hl = hlMap.get(sym);
    const price = hl?.markPx && hl.markPx > 0 ? hl.markPx : (q?.price && q.price > 0 ? q.price : (tvInfo?.close ?? 0));
    const volUsdB = hl?.volUsd
      ? Number((hl.volUsd / 1e9).toFixed(2))
      : tvInfo && tvInfo.valTraded > 0
        ? Number((tvInfo.valTraded / 1e9).toFixed(2))
        : null;
    return {
      symbol: `${sym}-PERP`,
      underlying: `${ASSET_BY_SYMBOL[sym]?.name ?? sym} (Live Spot)`,
      type: "Stock Perp",
      markPrice: price,
      indexPrice: hl?.oraclePx && hl.oraclePx > 0 ? hl.oraclePx : price,
      fundingRateHourlyPct: hl ? Number(hl.fundingHourlyPct.toFixed(5)) : null,
      openInterestBillion: hl && hl.oiUsd > 0 ? Number((hl.oiUsd / 1e9).toFixed(2)) : null,
      volume24hBillion: volUsdB,
      maxLeverage: 10,
    };
  });

  const cryptoPerps: PerpetualContract[] = (["BTC", "SOL", "ETH"] as const).map((sym) => {
    const prem = premMap.get(`${sym}USDT`);
    const hl = hlMap.get(sym);
    const q = quoteFor(sym);
    const mark = prem ? toNum(prem.markPrice, q?.price ?? 0) : (hl?.markPx || q?.price || 0);
    const index = prem ? toNum(prem.indexPrice, mark) : (hl?.oraclePx || mark);
    const hourlyPct = prem
      ? Number(((toNum(prem.lastFundingRate) / 8) * 100).toFixed(5))
      : hl
        ? Number(hl.fundingHourlyPct.toFixed(5))
        : null;
    const binanceVolUsd = volMap.get(`${sym}USDT`) ?? 0;
    const volUsdB = binanceVolUsd > 0 ? binanceVolUsd / 1e9 : hl ? hl.volUsd / 1e9 : 0;
    const binanceOiUnits = oiUnitsMap.get(sym) ?? 0;
    const oiUsdB =
      binanceOiUnits > 0 && mark > 0
        ? Number(((binanceOiUnits * mark) / 1e9).toFixed(2))
        : hl && hl.oiUsd > 0
          ? Number((hl.oiUsd / 1e9).toFixed(2))
          : null;
    return {
      symbol: `${sym}-PERP`,
      underlying: `${ASSET_BY_SYMBOL[sym]?.name ?? sym} Perpetual`,
      type: "Crypto Perp",
      markPrice: mark,
      indexPrice: index,
      fundingRateHourlyPct: hourlyPct,
      openInterestBillion: oiUsdB,
      volume24hBillion: volUsdB > 0 ? Number(volUsdB.toFixed(2)) : null,
      maxLeverage: 20,
    };
  });

  const perps: PerpetualContract[] = [...stockPerps, ...cryptoPerps].filter((p) => p.markPrice > 0);

  const polymarkets: PolymarketContract[] = (polymarketRaw ?? [])
    .slice(0, 6)
    .map((m) => {
      let yesProb = 50;
      try {
        const prices = m.outcomePrices ? (JSON.parse(m.outcomePrices) as string[]) : [];
        if (prices[0]) yesProb = Math.round(toNum(prices[0], 0.5) * 100);
      } catch {
        // ignore parse fallback
      }
      const clamped = Math.max(1, Math.min(99, yesProb));
      const mid = clamped / 100;
      const lowerQ = m.question.toLowerCase();
      const category: PolymarketContract["category"] =
        /(fed|fomc|cpi|inflation|rate|gdp|recession)/.test(lowerQ)
          ? "Fed & Macro"
          : /(bitcoin|btc|eth|crypto|solana)/.test(lowerQ)
            ? "Crypto"
            : /(ai|nvidia|apple|tech|openai)/.test(lowerQ)
              ? "Tech & AI"
              : "Politics";
      return {
        id: `poly-${m.id}`,
        question: m.question,
        category,
        volumeUsd: Math.round(m.volume24hr ?? m.volumeNum ?? 0),
        yesBid: Number(Math.max(0.01, mid - 0.01).toFixed(2)),
        yesAsk: Number(Math.min(0.99, mid + 0.01).toFixed(2)),
        probabilityYesPct: clamped,
        resolutionDate: m.endDate ? m.endDate.slice(0, 10) : "Active",
      };
    });

  const goldPrice = gold?.close ?? 0;
  const silverPrice = silver?.close ?? 0;
  const wtiPrice = wti?.close ?? 0;
  const brentPrice = brent?.close ?? 0;
  const goldSilverRatio = goldPrice > 0 && silverPrice > 0 ? (goldPrice / silverPrice).toFixed(1) : "—";
  const brentWtiSpread = brentPrice > 0 && wtiPrice > 0 ? (brentPrice - wtiPrice).toFixed(2) : "—";

  const commodities: CommoditySpot[] = [
    { name: "Spot Gold (XAU)", symbol: "XAU/USD", price: goldPrice, unit: "$/oz", change24hPct: Number((gold?.change ?? 0).toFixed(2)), spreadInfo: `Gold/Silver Ratio: ${goldSilverRatio}x` },
    { name: "Spot Silver (XAG)", symbol: "XAG/USD", price: silverPrice, unit: "$/oz", change24hPct: Number((silver?.change ?? 0).toFixed(2)), spreadInfo: "Real-Time Spot Bullion" },
    { name: "WTI Crude Oil", symbol: "CL", price: wtiPrice, unit: "$/bbl", change24hPct: Number((wti?.change ?? 0).toFixed(2)), spreadInfo: `Brent-WTI Spread: +$${brentWtiSpread}` },
    { name: "Brent Crude Oil", symbol: "BZ", price: brentPrice, unit: "$/bbl", change24hPct: Number((brent?.change ?? 0).toFixed(2)), spreadInfo: "Global Benchmark Crude" },
    { name: "High Grade Copper", symbol: "HG", price: copper?.close ?? 0, unit: "$/lb", change24hPct: Number((copper?.change ?? 0).toFixed(2)), spreadInfo: "COMEX Live Futures" },
    { name: "Henry Hub Natural Gas", symbol: "NG", price: natgas?.close ?? 0, unit: "$/MMBtu", change24hPct: Number((natgas?.change ?? 0).toFixed(2)), spreadInfo: "NYMEX Front Month" },
  ].filter((c) => c.price > 0);

  const macroIndicators: OpenBBMacroIndicator[] = [
    ...(y10 !== null && y10Prev !== null
      ? [
          {
            metric: "US 10Y Treasury Yield",
            current: `${y10.toFixed(2)}%`,
            previous: `${y10Prev.toFixed(2)}%`,
            change: `${Math.round((y10 - y10Prev) * 100)} bps`,
            impact: (y10 <= y10Prev ? "Bullish" : "Neutral") as OpenBBMacroIndicator["impact"],
            updated: yieldResult.source,
          },
        ]
      : []),
    ...(y10 !== null && y2 !== null && spread10y2yBps !== null
      ? [
          {
            metric: "10Y - 2Y Treasury Spread",
            current: `${spread10y2yBps >= 0 ? "+" : ""}${spread10y2yBps} bps`,
            previous: `${y2.toFixed(2)}% (2Y) / ${y10.toFixed(2)}% (10Y)`,
            change: spread10y2yBps >= 0 ? "Positive Slope" : "Inverted",
            impact: (spread10y2yBps >= 0 ? "Bullish" : "Bearish") as OpenBBMacroIndicator["impact"],
            updated: yieldResult.source,
          },
        ]
      : []),
    {
      metric: "US Dollar Index (DXY)",
      current: dxy?.close ? dxy.close.toFixed(2) : "—",
      previous: dxy?.close ? (dxy.close - dxy.abs).toFixed(2) : "—",
      change: dxy ? `${dxy.change >= 0 ? "+" : ""}${dxy.change.toFixed(2)}%` : "0.00%",
      impact: (dxy?.change ?? 0) <= 0 ? "Bullish" : "Neutral",
      updated: "ICE DXY Real-Time",
    },
    ...(vixVal !== null
      ? [
          {
            metric: "CBOE Volatility Index (VIX)",
            current: vixVal.toFixed(2),
            previous: vix ? (vix.close - vix.abs).toFixed(2) : vixVal.toFixed(2),
            change: vix ? `${vix.change >= 0 ? "+" : ""}${vix.change.toFixed(2)}%` : "0.00%",
            impact: (vixVal < 20 ? "Bullish" : vixVal < 28 ? "Neutral" : "Bearish") as OpenBBMacroIndicator["impact"],
            updated: "CBOE VIX Live",
          },
        ]
      : []),
    {
      metric: "S&P 500 Benchmark (SPX)",
      current: spx?.close ? spx.close.toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—",
      previous: spx?.close ? (spx.close - spx.abs).toLocaleString("en-US", { maximumFractionDigits: 2 }) : "—",
      change: spx ? `${spx.change >= 0 ? "+" : ""}${spx.change.toFixed(2)}%` : "0.00%",
      impact: (spx?.change ?? 0) >= 0 ? "Bullish" : "Bearish",
      updated: "S&P Dow Jones Live",
    },
  ];

  const btcLive = quoteFor("BTC");
  const eurRate = eurUsd?.close ?? (fxRes?.rates?.EUR ? 1 / fxRes.rates.EUR : 0);

  const weif = [
    {
      sym: "SPX",
      name: "S&P 500 IDX",
      px: spx?.close ? spx.close.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—",
      chg: spx ? `${spx.change >= 0 ? "+" : ""}${spx.change.toFixed(2)}%` : "—",
      up: (spx?.change ?? 0) >= 0,
    },
    {
      sym: "IXIC",
      name: "NASDAQ COMP",
      px: ixic?.close ? ixic.close.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—",
      chg: ixic ? `${ixic.change >= 0 ? "+" : ""}${ixic.change.toFixed(2)}%` : "—",
      up: (ixic?.change ?? 0) >= 0,
    },
    {
      sym: "TNX",
      name: "10Y YIELD",
      px: y10 !== null ? `${y10.toFixed(2)}%` : "—",
      chg: us10yTv ? `${us10yTv.change >= 0 ? "+" : ""}${us10yTv.change.toFixed(2)}%` : "—",
      up: (us10yTv?.change ?? 0) >= 0,
    },
    {
      sym: "BTC",
      name: "BITCOIN",
      px: btcLive?.price ? `$${btcLive.price.toLocaleString("en-US", { maximumFractionDigits: 0 })}` : "—",
      chg: btcLive ? `${btcLive.change >= 0 ? "+" : ""}${(btcLive.change * 100).toFixed(2)}%` : "—",
      up: (btcLive?.change ?? 0) >= 0,
    },
    {
      sym: "XAU",
      name: "GOLD BULLION",
      px: goldPrice > 0 ? `$${goldPrice.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : "—",
      chg: gold ? `${gold.change >= 0 ? "+" : ""}${gold.change.toFixed(2)}%` : "—",
      up: (gold?.change ?? 0) >= 0,
    },
    {
      sym: "WTI",
      name: "WTI CRUDE",
      px: wtiPrice > 0 ? `$${wtiPrice.toFixed(2)}` : "—",
      chg: wti ? `${wti.change >= 0 ? "+" : ""}${wti.change.toFixed(2)}%` : "—",
      up: (wti?.change ?? 0) >= 0,
    },
    {
      sym: "EUR",
      name: "EUR/USD",
      px: eurRate > 0 ? eurRate.toFixed(4) : "—",
      chg: eurUsd ? `${eurUsd.change >= 0 ? "+" : ""}${eurUsd.change.toFixed(2)}%` : "—",
      up: (eurUsd?.change ?? 0) >= 0,
    },
    {
      sym: "DXY",
      name: "DOLLAR INDEX",
      px: dxy?.close ? dxy.close.toFixed(2) : "—",
      chg: dxy ? `${dxy.change >= 0 ? "+" : ""}${dxy.change.toFixed(2)}%` : "—",
      up: (dxy?.change ?? 0) >= 0,
    },
  ];

  const payload = {
    view: "macro-perps",
    asOf: new Date().toISOString(),
    sources: [
      "TradingView Global Macro",
      yieldResult.source,
      "Binance & Hyperliquid Perpetuals",
      hasLiveFng ? "Alternative.me F&G" : "CBOE VIX & SPX Breadth",
      "Polymarket Gamma API",
    ],
    fearGreed,
    macroRegime,
    yieldCurve: yieldResult.curve,
    macroIndicators,
    perps,
    polymarkets,
    commodities,
    headlines: liveNews,
    weif,
  };

  setCached("macro-perps", payload, 15_000);
  return NextResponse.json(payload);
}

function computeUtcSessionStatus(
  openUtc: string,
  closeUtc: string,
  is247: boolean,
  isFx245: boolean,
  now = new Date(),
): "OPEN" | "PRE-MARKET" | "AFTER-HOURS" | "CLOSED" {
  const day = now.getUTCDay(); // 0 Sun .. 6 Sat
  const mins = now.getUTCHours() * 60 + now.getUTCMinutes();

  if (is247) return "OPEN";
  if (isFx245) {
    if (day === 6) return "CLOSED";
    if (day === 0 && mins < 22 * 60) return "CLOSED";
    if (day === 5 && mins >= 22 * 60) return "CLOSED";
    return "OPEN";
  }
  if (day === 0 || day === 6) return "CLOSED";

  const [oh, om] = openUtc.split(":").map(Number);
  const [ch, cm] = closeUtc.split(":").map(Number);
  const openMins = oh * 60 + om;
  const closeMins = ch * 60 + cm;

  if (mins >= openMins && mins < closeMins) return "OPEN";
  if (mins >= openMins - 120 && mins < openMins) return "PRE-MARKET";
  if (mins >= closeMins && mins < closeMins + 120) return "AFTER-HOURS";
  return "CLOSED";
}

async function handleBistEquities() {
  const cached = getCached<Record<string, unknown>>("bist");
  if (cached) return NextResponse.json(cached);

  const tickers = ["BIST:THYAO", "BIST:GARAN", "BIST:ASELS", "BIST:EREGL", "BIST:KCHOL", "BIST:BIMAS"];
  const disclosures: Record<string, string> = {
    THYAO: "KAP Live Feed · Borsa İstanbul Star Market Aerospace & Aviation",
    GARAN: "KAP Live Feed · Borsa İstanbul Banking & Financial Services",
    ASELS: "KAP Live Feed · Borsa İstanbul Defense Electronics",
    EREGL: "KAP Live Feed · Borsa İstanbul Integrated Steel & Metals",
    KCHOL: "KAP Live Feed · Borsa İstanbul Industrial Conglomerate",
    BIMAS: "KAP Live Feed · Borsa İstanbul Consumer Retail",
  };

  const rows = await scanTradingView("turkey", {
    symbols: { tickers, query: { types: [] } },
    columns: ["name", "description", "close", "change", "price_earnings_ttm", "dividends_yield"],
  });

  const bistEquities: BISTAsset[] = rows
    .map((r) => {
      const sym = String(r.d?.[0] ?? "").toUpperCase();
      const priceTRY = toNum(r.d?.[2]);
      if (!sym || priceTRY <= 0) return null;
      return {
        symbol: sym,
        name: String(r.d?.[1] ?? sym),
        priceTRY: Number(priceTRY.toFixed(2)),
        change24hPct: Number(toNum(r.d?.[3]).toFixed(2)),
        peRatio: Number(toNum(r.d?.[4]).toFixed(1)),
        dividendYieldPct: Number(toNum(r.d?.[5]).toFixed(2)),
        kapLastDisclosure: disclosures[sym] ?? "KAP Live Disclosure Stream",
      };
    })
    .filter((item): item is BISTAsset => item !== null);

  const payload = {
    view: "bist",
    asOf: new Date().toISOString(),
    sources: ["TradingView BIST Scanner"],
    bistEquities,
  };
  setCached("bist", payload, 15_000);
  return NextResponse.json(payload);
}

async function handleOpenStockMarkets() {
  const cached = getCached<Record<string, unknown>>("openstock-markets");
  if (cached) return NextResponse.json(cached);

  const tickers = [
    "SP:SPX",
    "NSE:NIFTY",
    "XETR:DAX",
    "TSX:TSX",
    "ASX:XJO",
    "TADAWUL:TASI",
    "GPW:WIG20",
    "TVC:DXY",
    "TVC:DJI",
    "TVC:UKX",
    "TVC:SMI",
    "BIST:XU100",
    "DFM:DFMGI",
    "TVC:NI225",
    "HSI:HSI",
    "FTSE:STI",
  ];

  const [tvRows, cgGlobal] = await Promise.all([
    scanTradingView("global", {
      symbols: { tickers, query: { types: [] } },
      columns: ["name", "close", "change"],
    }),
    fetchJsonSafe<{
      data?: {
        total_market_cap?: { usd?: number };
        market_cap_change_percentage_24h_usd?: number;
      };
    }>("https://api.coingecko.com/api/v3/global"),
  ]);

  const tvBySym = new Map<string, { close: number; change: number }>();
  for (const r of tvRows) {
    const close = toNum(r.d?.[1]);
    const change = toNum(r.d?.[2]);
    if (close > 0) tvBySym.set(r.s, { close, change });
  }

  const now = new Date();
  const regionConfigs = [
    { id: "us", tv: "SP:SPX", open: "13:30", close: "20:00" },
    { id: "in", tv: "NSE:NIFTY", open: "03:45", close: "10:00" },
    { id: "de", tv: "XETR:DAX", open: "07:00", close: "15:30" },
    { id: "ca", tv: "TSX:TSX", open: "13:30", close: "20:00" },
    { id: "au", tv: "ASX:XJO", open: "00:00", close: "06:00" },
    { id: "sa", tv: "TADAWUL:TASI", open: "07:00", close: "12:00" },
    { id: "pl", tv: "GPW:WIG20", open: "07:00", close: "15:00" },
    { id: "crypto", tv: "", open: "00:00", close: "24:00", is247: true },
    { id: "forex", tv: "TVC:DXY", open: "22:00", close: "22:00", isFx245: true },
  ];

  const markets = regionConfigs.map((cfg) => {
    const status = computeUtcSessionStatus(cfg.open, cfg.close, Boolean(cfg.is247), Boolean(cfg.isFx245), now);
    if (cfg.id === "crypto") {
      const mcapUsd = cgGlobal?.data?.total_market_cap?.usd ?? 0;
      const mcapB = mcapUsd > 0 ? Number((mcapUsd / 1e9).toFixed(1)) : 0;
      const chg = cgGlobal?.data?.market_cap_change_percentage_24h_usd ?? 0;
      return {
        id: cfg.id,
        indexValue: mcapB,
        indexChangePct: Number(chg.toFixed(2)),
        status,
      };
    }
    const hit = tvBySym.get(cfg.tv);
    return {
      id: cfg.id,
      indexValue: hit ? Number(hit.close.toFixed(2)) : 0,
      indexChangePct: hit ? Number(hit.change.toFixed(2)) : 0,
      status,
    };
  });

  const mapHubConfigs = [
    { id: "nyse-nasdaq", tv: "TVC:DJI", open: "13:30", close: "20:00", ticker: "DOW" },
    { id: "cme-chicago", tv: "SP:SPX", open: "23:00", close: "22:00", isFx245: true, ticker: "ES1!" },
    { id: "lse-london", tv: "TVC:UKX", open: "07:00", close: "15:30", ticker: "UKX" },
    { id: "frankfurt-deutsche-boerse", tv: "XETR:DAX", open: "07:00", close: "15:30", ticker: "DAX" },
    { id: "six-swiss", tv: "TVC:SMI", open: "07:00", close: "15:30", ticker: "SMI" },
    { id: "borsa-istanbul", tv: "BIST:XU100", open: "06:40", close: "15:10", ticker: "XU100" },
    { id: "dubai-dfm", tv: "DFM:DFMGI", open: "06:00", close: "10:45", ticker: "DFMGI" },
    { id: "tokyo-tse", tv: "TVC:NI225", open: "00:00", close: "06:00", ticker: "NI225" },
    { id: "hong-kong-hkex", tv: "HSI:HSI", open: "01:30", close: "08:00", ticker: "HSI" },
    { id: "singapore-sgx", tv: "FTSE:STI", open: "01:00", close: "09:00", ticker: "STI" },
    { id: "sydney-asx", tv: "ASX:XJO", open: "00:00", close: "06:00", ticker: "XJO" },
  ];

  const tradingCenters = mapHubConfigs.map((hub) => {
    const hit = tvBySym.get(hub.tv);
    const status = computeUtcSessionStatus(hub.open, hub.close, false, Boolean(hub.isFx245), now);
    const chg = hit ? hit.change : null;
    return {
      id: hub.id,
      status,
      indexValue: hit ? hit.close : null,
      indexChange:
        chg !== null
          ? `${hub.ticker} ${chg >= 0 ? "+" : ""}${chg.toFixed(2)}%`
          : `${hub.ticker} Live Offline`,
      isPositive: (chg ?? 0) >= 0,
    };
  });

  const payload = {
    view: "openstock-markets",
    asOf: now.toISOString(),
    sources: ["TradingView Global Indices", "CoinGecko Global", "UTC Exchange Session Clock"],
    markets,
    tradingCenters,
  };
  setCached("openstock-markets", payload, 15_000);
  return NextResponse.json(payload);
}

export async function GET(req: NextRequest) {
  const view = req.nextUrl.searchParams.get("view") ?? "market-center";
  if (view === "macro-perps") {
    return handleMacroPerps();
  }
  if (view === "bist") {
    return handleBistEquities();
  }
  if (view === "openstock-markets") {
    return handleOpenStockMarkets();
  }
  return handleMarketCenter();
}
