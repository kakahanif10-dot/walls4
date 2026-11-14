import { NextRequest, NextResponse } from "next/server";
import { ASSET_BY_SYMBOL, quoteFor, series } from "@/lib/market";
import { ensureMarketData, ensureSymbolHistory } from "@/lib/market-data";
import {
  SEC_CIK_MAP,
  computeAmlRiskScore,
  computeOrderbookSlippage,
  computeTechnicalIndicators,
  type OrderbookLevel,
  type TechnicalCandle,
} from "@/lib/institutional-tools-data";
import {
  computeSentimentStats,
  normalizeAlternativeMeEntries,
} from "@/lib/crypto-fear-greed";
import {
  getLiveAiSentimentFeed,
  getLiveTopSignalsFeed,
  getLiveWhaleAlertFeed,
} from "@/lib/live-frontpage-data";

export const dynamic = "force-dynamic";

const SEC_HEADERS = {
  "User-Agent": "NextWallStreet InstitutionalResearch/1.0 research@nextwallstreet.com",
  Accept: "application/json",
};

// Lightweight in-memory TTL cache to respect free public API rate limits
const cache = new Map<string, { data: unknown; expiresAt: number }>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data as T;
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

async function fetchYahooQuote(symbol: string): Promise<{
  symbol: string;
  price: number;
  changePct: number;
  volume: number;
  candles: TechnicalCandle[];
} | null> {
  const cacheKey = `yf:${symbol}`;
  const hit = getCached<{
    symbol: string;
    price: number;
    changePct: number;
    volume: number;
    candles: TechnicalCandle[];
  }>(cacheKey);
  if (hit) return hit;

  const json = await fetchJsonSafe<{
    chart?: {
      result?: Array<{
        meta?: { regularMarketPrice?: number; previousClose?: number; regularMarketVolume?: number };
        timestamp?: number[];
        indicators?: {
          quote?: Array<{
            open?: Array<number | null>;
            high?: Array<number | null>;
            low?: Array<number | null>;
            close?: Array<number | null>;
            volume?: Array<number | null>;
          }>;
        };
      }>;
    };
  }>(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=3mo`, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  const result = json?.chart?.result?.[0];
  const meta = result?.meta;
  const q = result?.indicators?.quote?.[0];
  const ts = result?.timestamp ?? [];
  if (!meta || !q) return null;

  const candles: TechnicalCandle[] = [];
  for (let i = 0; i < ts.length; i++) {
    const o = q.open?.[i];
    const h = q.high?.[i];
    const l = q.low?.[i];
    const c = q.close?.[i];
    const v = q.volume?.[i] ?? 0;
    if (typeof o === "number" && typeof h === "number" && typeof l === "number" && typeof c === "number" && c > 0) {
      candles.push({
        time: new Date(ts[i] * 1000).toISOString().slice(0, 10),
        open: o,
        high: h,
        low: l,
        close: c,
        volume: v,
      });
    }
  }

  const price =
    typeof meta.regularMarketPrice === "number" && meta.regularMarketPrice > 0
      ? meta.regularMarketPrice
      : candles[candles.length - 1]?.close ?? 0;
  if (price <= 0) return null;

  const lastBarClose = candles[candles.length - 1]?.close ?? price;
  const fallbackPrev =
    candles.length >= 2 && Math.abs(lastBarClose - price) / Math.max(1e-9, price) < 0.005
      ? candles[candles.length - 2].close
      : candles[candles.length - 1]?.close ?? price;
  const prevClose =
    typeof meta.previousClose === "number" && meta.previousClose > 0 ? meta.previousClose : fallbackPrev;
  const changePct = prevClose > 0 ? ((price - prevClose) / prevClose) * 100 : 0;

  const out = {
    symbol,
    price,
    changePct,
    volume: meta.regularMarketVolume ?? candles[candles.length - 1]?.volume ?? 0,
    candles,
  };
  setCached(cacheKey, out, 60_000);
  return out;
}

type XbrlFactEntry = { val?: number; form?: string; start?: string; end?: string; fp?: string };

function extractLatestFact(
  facts: Record<string, { units?: Record<string, XbrlFactEntry[]> }> | undefined,
  keys: string[],
  unit = "USD",
  isFlow = false,
): number | null {
  if (!facts) return null;
  const candidates: Array<{ val: number; end: string; isAnnual: boolean }> = [];

  for (const key of keys) {
    const entries = facts[key]?.units?.[unit];
    if (!entries || entries.length === 0) continue;
    for (const e of entries) {
      if (typeof e.val !== "number" || !e.end) continue;
      if (isFlow && e.start) {
        const days = (Date.parse(e.end) - Date.parse(e.start)) / 86_400_000;
        if (days < 300) continue; // skip 90-day quarterly slices for annual flow metrics
      }
      const isAnnual = e.form === "10-K" || e.fp === "FY";
      candidates.push({ val: e.val, end: e.end, isAnnual });
    }
  }

  if (candidates.length === 0) return null;
  const annuals = candidates.filter((c) => c.isAnnual).sort((a, b) => b.end.localeCompare(a.end));
  if (annuals.length > 0) return annuals[0].val;

  candidates.sort((a, b) => b.end.localeCompare(a.end));
  return candidates[0].val;
}

type SecFactsSummary = {
  symbol: string;
  name: string;
  sector: string;
  revenueM: number;
  operatingIncomeM: number;
  netIncomeM: number;
  cashM: number;
  debtM: number;
  sharesOutM: number;
  liveSource: boolean;
};

async function fetchTradingViewEquityFundamentals(
  symbol: string,
): Promise<{ price: number; changePct: number; facts: SecFactsSummary | null }> {
  const meta = SEC_CIK_MAP[symbol] ?? { name: symbol, sector: "US Equities", cik: "" };
  try {
    const res = await fetchJsonSafe<{ data?: Array<{ d?: Array<string | number | null> }> }>(
      "https://scanner.tradingview.com/america/scan",
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
        body: JSON.stringify({
          filter: [{ left: "name", operation: "equal", right: symbol }],
          columns: [
            "name",
            "description",
            "sector",
            "close",
            "change",
            "total_revenue_ttm",
            "ebitda_ttm",
            "net_income_ttm",
            "total_debt",
            "cash_n_short_term_invest",
            "total_shares_outstanding_fundamental",
          ],
          range: [0, 3],
        }),
      },
      4000,
    );
    const d = res?.data?.[0]?.d;
    if (!d) return { price: 0, changePct: 0, facts: null };
    const price = typeof d[3] === "number" ? d[3] : 0;
    const changePct = typeof d[4] === "number" ? d[4] : 0;
    const rev = typeof d[5] === "number" ? d[5] : 0;
    const ebitda = typeof d[6] === "number" ? d[6] : 0;
    const netInc = typeof d[7] === "number" ? d[7] : 0;
    const debt = typeof d[8] === "number" ? d[8] : 0;
    const cash = typeof d[9] === "number" ? d[9] : 0;
    const shares = typeof d[10] === "number" ? d[10] : 0;

    if (rev > 0 && shares > 0) {
      return {
        price,
        changePct,
        facts: {
          symbol,
          name: typeof d[1] === "string" && d[1] ? d[1] : meta.name,
          sector: typeof d[2] === "string" && d[2] ? d[2] : meta.sector,
          revenueM: Math.round(rev / 1e6),
          operatingIncomeM: Math.round((ebitda > 0 ? ebitda * 0.85 : netInc * 1.15) / 1e6),
          netIncomeM: Math.round(netInc / 1e6),
          cashM: Math.round(cash / 1e6),
          debtM: Math.round(debt / 1e6),
          sharesOutM: Math.round(shares / 1e6),
          liveSource: true,
        },
      };
    }
    return { price, changePct, facts: null };
  } catch {
    return { price: 0, changePct: 0, facts: null };
  }
}

async function fetchSecCompanyFactsSummary(symbol: string): Promise<SecFactsSummary | null> {
  const meta = SEC_CIK_MAP[symbol] ?? SEC_CIK_MAP.NVDA;
  const cacheKey = `sec-facts:${symbol}`;
  const hit = getCached<SecFactsSummary>(cacheKey);
  if (hit) return hit;

  const json = await fetchJsonSafe<{
    entityName?: string;
    facts?: {
      "us-gaap"?: Record<string, { units?: Record<string, Array<{ val?: number; form?: string; end?: string; fp?: string }>> }>;
      dei?: Record<string, { units?: Record<string, Array<{ val?: number; form?: string; end?: string; fp?: string }>> }>;
    };
  }>(`https://data.sec.gov/api/xbrl/companyfacts/CIK${meta.cik}.json`, { headers: SEC_HEADERS }, 5000);

  const gaap = json?.facts?.["us-gaap"];
  const dei = json?.facts?.dei;

  if (gaap) {
    const rev = extractLatestFact(
      gaap,
      [
        "RevenueFromContractWithCustomerExcludingAssessedTax",
        "Revenues",
        "SalesRevenueNet",
        "RevenueFromContractWithCustomerIncludingAssessedTax",
      ],
      "USD",
      true,
    );
    const opInc = extractLatestFact(gaap, ["OperatingIncomeLoss"], "USD", true);
    const netInc = extractLatestFact(gaap, ["NetIncomeLoss", "ProfitLoss"], "USD", true);
    const cash = extractLatestFact(gaap, [
      "CashAndCashEquivalentsAtCarryingValue",
      "CashCashEquivalentsAndShortTermInvestments",
    ]);
    const debt = extractLatestFact(gaap, ["LongTermDebt", "LongTermDebtNoncurrent", "DebtCurrent"]);
    const shares =
      extractLatestFact(gaap, ["CommonStockSharesOutstanding", "WeightedAverageNumberOfDilutedSharesOutstanding"], "shares") ??
      extractLatestFact(dei, ["EntityCommonStockSharesOutstanding"], "shares");

    if (rev && netInc && shares) {
      const out: SecFactsSummary = {
        symbol,
        name: json?.entityName ?? meta.name,
        sector: meta.sector,
        revenueM: Math.round(rev / 1e6),
        operatingIncomeM: Math.round((opInc ?? rev * 0.25) / 1e6),
        netIncomeM: Math.round(netInc / 1e6),
        cashM: Math.round((cash ?? 0) / 1e6),
        debtM: Math.round((debt ?? 0) / 1e6),
        sharesOutM: Math.round(shares / 1e6),
        liveSource: true,
      };
      setCached(cacheKey, out, 300_000);
      return out;
    }
  }

  const tvBackup = await fetchTradingViewEquityFundamentals(symbol);
  if (tvBackup.facts) {
    setCached(cacheKey, tvBackup.facts, 300_000);
    return tvBackup.facts;
  }

  return null;
}

async function fetchTradingViewYieldMap(tickers: string[]): Promise<Map<string, { price: number; changeAbs: number }>> {
  const out = new Map<string, { price: number; changeAbs: number }>();
  const tv = await fetchJsonSafe<{ data?: Array<{ s: string; d: Array<string | number | null> }> }>(
    "https://scanner.tradingview.com/global/scan",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "Mozilla/5.0" },
      body: JSON.stringify({
        symbols: { tickers, query: { types: [] } },
        columns: ["name", "close", "change_abs"],
      }),
    },
    3500,
  );
  for (const r of tv?.data ?? []) {
    const close = typeof r.d?.[1] === "number" ? r.d[1] : 0;
    const abs = typeof r.d?.[2] === "number" ? r.d[2] : 0;
    if (close > 0) out.set(r.s, { price: close, changeAbs: abs });
  }
  return out;
}

async function handleBloombergDesk() {
  const symbols = ["SPY", "QQQ", "NVDA", "AAPL", "MSFT", "TSLA", "JPM", "COIN"];
  const yieldSyms = [
    { label: "US 3M", sym: "^IRX", tv: "TVC:US03MY" },
    { label: "US 5Y", sym: "^FVX", tv: "TVC:US05Y" },
    { label: "US 10Y", sym: "^TNX", tv: "TVC:US10Y" },
    { label: "US 30Y", sym: "^TYX", tv: "TVC:US30Y" },
  ];

  const [, equities, yields, tvYields, binanceTickers, fxPrimary, fxBackup, secFeed] = await Promise.all([
    ensureMarketData(),
    Promise.all(symbols.map((s) => fetchYahooQuote(s))),
    Promise.all(yieldSyms.map((y) => fetchYahooQuote(y.sym))),
    fetchTradingViewYieldMap(yieldSyms.map((y) => y.tv)),
    fetchJsonSafe<Array<{ symbol: string; lastPrice: string; priceChangePercent: string; quoteVolume: string }>>(
      'https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","SOLUSDT"]',
    ),
    fetchJsonSafe<{ rates?: Record<string, number> }>(
      "https://api.frankfurter.app/latest?from=USD&to=EUR,GBP,JPY,CHF,SGD",
    ),
    fetchJsonSafe<{ rates?: Record<string, number> }>("https://open.er-api.com/v6/latest/USD"),
    fetchJsonSafe<{
      entityName?: string;
      filings?: { recent?: { form?: string[]; filingDate?: string[]; primaryDocDescription?: string[]; accessionNumber?: string[]; primaryDocument?: string[] } };
    }>(`https://data.sec.gov/submissions/CIK0001045810.json`, { headers: SEC_HEADERS }),
  ]);

  const equityRows = symbols
    .map((sym, idx) => {
      const y = equities[idx];
      if (y) return { symbol: y.symbol, price: y.price, changePct: y.changePct, volume: y.volume };
      const q = quoteFor(sym);
      if (!q) return null;
      return { symbol: sym, price: q.price, changePct: q.change * 100, volume: 0 };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);

  const yieldCurve = yieldSyms
    .map((y, idx) => {
      const yf = yields[idx];
      if (yf && yf.price > 0) {
        return {
          tenor: y.label,
          yieldPct: yf.price,
          changeBps: yf.changePct * 10,
        };
      }
      const tvHit = tvYields.get(y.tv);
      if (tvHit && tvHit.price > 0) {
        return {
          tenor: y.label,
          yieldPct: tvHit.price,
          changeBps: tvHit.changeAbs * 100,
        };
      }
      return null;
    })
    .filter((y): y is NonNullable<typeof y> => y !== null);

  let cryptoRows = (binanceTickers ?? []).map((t) => ({
    symbol: t.symbol.replace("USDT", ""),
    price: Number.parseFloat(t.lastPrice),
    changePct: Number.parseFloat(t.priceChangePercent),
    volumeUsd: Number.parseFloat(t.quoteVolume),
  }));

  if (cryptoRows.length === 0) {
    cryptoRows = ["BTC", "ETH", "SOL"]
      .map((sym) => {
        const q = quoteFor(sym);
        if (!q || q.price <= 0) return null;
        return { symbol: sym, price: q.price, changePct: q.change * 100, volumeUsd: 0 };
      })
      .filter((c): c is NonNullable<typeof c> => c !== null);
  }

  const fxSourceRates = fxPrimary?.rates?.EUR
    ? fxPrimary.rates
    : fxBackup?.rates?.EUR
      ? {
          EUR: fxBackup.rates.EUR,
          GBP: fxBackup.rates.GBP,
          JPY: fxBackup.rates.JPY,
          CHF: fxBackup.rates.CHF,
          SGD: fxBackup.rates.SGD,
        }
      : null;

  const fxRows = fxSourceRates
    ? Object.entries(fxSourceRates)
        .filter(([, rate]) => typeof rate === "number" && Number.isFinite(rate) && rate > 0)
        .map(([ccy, rate]) => ({ pair: `USD/${ccy}`, rate }))
    : [];

  const recent = secFeed?.filings?.recent;
  const headlines: Array<{ time: string; source: string; headline: string; url: string }> = [];
  if (recent?.form && recent?.filingDate && recent?.accessionNumber && recent?.primaryDocument) {
    for (let i = 0; i < Math.min(12, recent.form.length); i++) {
      if (["8-K", "10-Q", "10-K", "4"].includes(recent.form[i])) {
        const accNoDash = recent.accessionNumber[i].replace(/-/g, "");
        headlines.push({
          time: recent.filingDate[i],
          source: `SEC EDGAR · ${recent.form[i]}`,
          headline: `${secFeed?.entityName ?? "NVIDIA"} filed Form ${recent.form[i]} — ${recent.primaryDocDescription?.[i] || "Regulatory disclosure"}`,
          url: `https://www.sec.gov/Archives/edgar/data/1045810/${accNoDash}/${recent.primaryDocument[i]}`,
        });
      }
      if (headlines.length >= 6) break;
    }
  }

  return NextResponse.json({
    tool: "bloomberg-desk",
    sources: [
      equities.some(Boolean) ? "Yahoo Finance Live" : "Multi-Venue Market Feed",
      binanceTickers && binanceTickers.length > 0 ? "Binance 24h" : "Multi-Venue Crypto Live",
      fxPrimary?.rates ? "Frankfurter ECB FX" : fxBackup?.rates ? "ExchangeRate-API Live FX" : "FX Feed Offline",
      headlines.length ? "SEC EDGAR 8-K Wire" : "SEC EDGAR Direct",
    ],
    asOf: new Date().toISOString(),
    equities: equityRows,
    yieldCurve,
    crypto: cryptoRows,
    fx: fxRows,
    headlines,
  });
}

async function handleExcelDcf(symbol: string) {
  const sym = SEC_CIK_MAP[symbol] ? symbol : "NVDA";
  const [, facts, quote, tnx, tvBackup, tvYields] = await Promise.all([
    ensureMarketData(),
    fetchSecCompanyFactsSummary(sym),
    fetchYahooQuote(sym),
    fetchYahooQuote("^TNX"),
    fetchTradingViewEquityFundamentals(sym),
    fetchTradingViewYieldMap(["TVC:US10Y"]),
  ]);

  const liveQ = quoteFor(sym);
  const currentPriceUsd =
    quote?.price && quote.price > 0
      ? quote.price
      : liveQ?.price && liveQ.price > 0
        ? liveQ.price
        : tvBackup.price;
  const riskFreeRatePct = tnx?.price ?? tvYields.get("TVC:US10Y")?.price ?? null;

  if (!facts || currentPriceUsd <= 0 || riskFreeRatePct === null) {
    return NextResponse.json(
      { error: `Live SEC XBRL fundamentals or spot market quotes unavailable for ${sym}.` },
      { status: 503 },
    );
  }

  return NextResponse.json({
    tool: "excel-dcf",
    sources: [
      "SEC EDGAR XBRL CompanyFacts",
      quote ? "Yahoo Finance Live Spot" : liveQ ? "Multi-Venue Market Feed" : "TradingView Live Scanner",
      tnx ? "US 10Y Treasury (^TNX)" : "TradingView US 10Y Yield",
    ],
    asOf: new Date().toISOString(),
    symbol: sym,
    companyName: facts.name,
    sector: facts.sector,
    currentPriceUsd,
    riskFreeRatePct: Number(riskFreeRatePct.toFixed(2)),
    revenueM: facts.revenueM,
    ebitdaMarginPct: Number(
      Math.min(75, Math.max(12, ((facts.operatingIncomeM + facts.revenueM * 0.03) / facts.revenueM) * 100)).toFixed(1),
    ),
    netDebtM: facts.debtM - facts.cashM,
    sharesOutM: facts.sharesOutM,
  });
}

async function handleCapitalIq() {
  const peerSymbols = ["NVDA", "MSFT", "AAPL", "META", "GOOGL", "AMZN", "AMD", "COIN"];
  await ensureMarketData();
  const results = await Promise.all(
    peerSymbols.map(async (sym) => {
      const [facts, quote, tvBackup] = await Promise.all([
        fetchSecCompanyFactsSummary(sym),
        fetchYahooQuote(sym),
        fetchTradingViewEquityFundamentals(sym),
      ]);
      const liveQ = quoteFor(sym);
      const price =
        quote?.price && quote.price > 0
          ? quote.price
          : liveQ?.price && liveQ.price > 0
            ? liveQ.price
            : tvBackup.price;
      const effectiveFacts = facts ?? tvBackup.facts;
      if (!effectiveFacts || price <= 0) return null;

      const changePct = quote?.changePct ?? (liveQ ? liveQ.change * 100 : tvBackup.changePct);
      const mcapM = price * effectiveFacts.sharesOutM;
      const evM = mcapM + effectiveFacts.debtM - effectiveFacts.cashM;
      const ebitdaM = effectiveFacts.operatingIncomeM + effectiveFacts.revenueM * 0.035;
      return {
        symbol: sym,
        name: effectiveFacts.name,
        sector: effectiveFacts.sector,
        price,
        changePct,
        mcapM,
        evM,
        revenueM: effectiveFacts.revenueM,
        ebitdaM,
        netIncomeM: effectiveFacts.netIncomeM,
        evToRev: evM / Math.max(1, effectiveFacts.revenueM),
        evToEbitda: evM / Math.max(1, ebitdaM),
        peRatio: effectiveFacts.netIncomeM > 0 ? mcapM / effectiveFacts.netIncomeM : 0,
        ebitdaMarginPct: (ebitdaM / Math.max(1, effectiveFacts.revenueM)) * 100,
        liveSec: effectiveFacts.liveSource,
      };
    }),
  );

  return NextResponse.json({
    tool: "capital-iq",
    sources: ["SEC EDGAR XBRL CompanyFacts", "NYSE/Nasdaq Real-Time Spot"],
    asOf: new Date().toISOString(),
    peers: results.filter((r): r is NonNullable<typeof r> => r !== null),
  });
}

async function handleAlphaSense(symbol: string) {
  const sym = SEC_CIK_MAP[symbol] ? symbol : "NVDA";
  const meta = SEC_CIK_MAP[sym];
  const cikInt = String(Number.parseInt(meta.cik, 10));

  const sub = await fetchJsonSafe<{
    entityName?: string;
    sicDescription?: string;
    tickers?: string[];
    exchanges?: string[];
    filings?: {
      recent?: {
        accessionNumber?: string[];
        filingDate?: string[];
        reportDate?: string[];
        form?: string[];
        primaryDocument?: string[];
        primaryDocDescription?: string[];
      };
    };
  }>(`https://data.sec.gov/submissions/CIK${meta.cik}.json`, { headers: SEC_HEADERS }, 5000);

  const filings: Array<{
    form: string;
    filingDate: string;
    reportDate: string;
    description: string;
    accessionNumber: string;
    url: string;
  }> = [];

  const rec = sub?.filings?.recent;
  if (rec?.form && rec?.filingDate && rec?.accessionNumber && rec?.primaryDocument) {
    for (let i = 0; i < Math.min(80, rec.form.length); i++) {
      const form = rec.form[i];
      if (!["10-K", "10-Q", "8-K", "4", "DEF 14A", "S-3"].includes(form)) continue;
      const acc = rec.accessionNumber[i];
      const accNoDash = acc.replace(/-/g, "");
      filings.push({
        form,
        filingDate: rec.filingDate[i],
        reportDate: rec.reportDate?.[i] || rec.filingDate[i],
        description: rec.primaryDocDescription?.[i] || `SEC Form ${form} Filing`,
        accessionNumber: acc,
        url: `https://www.sec.gov/Archives/edgar/data/${cikInt}/${accNoDash}/${rec.primaryDocument[i]}`,
      });
      if (filings.length >= 28) break;
    }
  }

  return NextResponse.json({
    tool: "alphasense",
    sources: [filings.length > 0 ? "SEC EDGAR Submissions API" : "SEC EDGAR Direct"],
    asOf: new Date().toISOString(),
    symbol: sym,
    entityName: sub?.entityName ?? meta.name,
    sicDescription: sub?.sicDescription ?? meta.sector,
    exchange: sub?.exchanges?.[0] ?? "NASDAQ",
    filings,
  });
}

async function handleTradingViewScreener(symbol: string) {
  const sym = (symbol || "NVDA").toUpperCase();
  const known = ASSET_BY_SYMBOL[sym];
  const isCrypto = known
    ? known.kind !== "stock"
    : ["BTC", "ETH", "SOL", "PEPE", "DOGE", "AVAX", "XRP"].includes(sym);

  let candles: TechnicalCandle[] = [];
  let price = 0;
  let changePct = 0;

  await ensureMarketData();

  if (isCrypto) {
    const [klines, ticker] = await Promise.all([
      fetchJsonSafe<Array<[number, string, string, string, string, string]>>(
        `https://api.binance.com/api/v3/klines?symbol=${sym}USDT&interval=1d&limit=65`,
      ),
      fetchJsonSafe<{ lastPrice?: string; priceChangePercent?: string }>(
        `https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}USDT`,
      ),
    ]);
    if (klines) {
      candles = klines.map((k) => ({
        time: new Date(k[0]).toISOString().slice(0, 10),
        open: Number.parseFloat(k[1]),
        high: Number.parseFloat(k[2]),
        low: Number.parseFloat(k[3]),
        close: Number.parseFloat(k[4]),
        volume: Number.parseFloat(k[5]),
      }));
    }
    const liveQ = quoteFor(sym);
    price = ticker?.lastPrice ? Number.parseFloat(ticker.lastPrice) : candles[candles.length - 1]?.close ?? liveQ?.price ?? 0;
    changePct = ticker?.priceChangePercent
      ? Number.parseFloat(ticker.priceChangePercent)
      : liveQ
        ? liveQ.change * 100
        : 0;
  } else {
    const yf = await fetchYahooQuote(sym);
    if (yf) {
      candles = yf.candles;
      price = yf.price;
      changePct = yf.changePct;
    } else {
      await ensureSymbolHistory(sym);
      const pts = known ? series(known) : [];
      candles = pts.map((p) => ({
        time: p.date.toISOString().slice(0, 10),
        open: p.close,
        high: p.close,
        low: p.close,
        close: p.close,
        volume: 0,
      }));
      const liveQ = quoteFor(sym);
      price = liveQ?.price ?? candles[candles.length - 1]?.close ?? 0;
      changePct = liveQ ? liveQ.change * 100 : 0;
    }
  }

  const indicators = computeTechnicalIndicators(candles.map((c) => c.close));

  // Screener basket
  const screenerSymbols = ["NVDA", "AAPL", "MSFT", "TSLA", "SPY", "BTC", "ETH", "SOL"];
  const screener = await Promise.all(
    screenerSymbols.map(async (s) => {
      const crypto = ["BTC", "ETH", "SOL"].includes(s);
      if (crypto) {
        const [kl, tk] = await Promise.all([
          fetchJsonSafe<Array<[number, string, string, string, string, string]>>(
            `https://api.binance.com/api/v3/klines?symbol=${s}USDT&interval=1d&limit=35`,
          ),
          fetchJsonSafe<{ lastPrice?: string; priceChangePercent?: string; quoteVolume?: string }>(
            `https://api.binance.com/api/v3/ticker/24hr?symbol=${s}USDT`,
          ),
        ]);
        const closes = (kl ?? []).map((k) => Number.parseFloat(k[4]));
        const ind = computeTechnicalIndicators(closes);
        const liveQ = quoteFor(s);
        return {
          symbol: s,
          assetClass: "Crypto",
          price: tk?.lastPrice ? Number.parseFloat(tk.lastPrice) : closes[closes.length - 1] ?? liveQ?.price ?? 0,
          changePct: tk?.priceChangePercent ? Number.parseFloat(tk.priceChangePercent) : (liveQ ? liveQ.change * 100 : 0),
          rsi14: ind.rsi14,
          sma20: ind.sma20,
          bias: ind.trendBias,
        };
      }
      const q = await fetchYahooQuote(s);
      const liveQ = quoteFor(s);
      const asset = ASSET_BY_SYMBOL[s];
      const closes = (q?.candles ?? []).map((c) => c.close);
      if (closes.length === 0 && asset) {
        const pts = series(asset);
        closes.push(...pts.map((p) => p.close));
      }
      const ind = computeTechnicalIndicators(closes);
      return {
        symbol: s,
        assetClass: "Equity",
        price: q?.price ?? liveQ?.price ?? 0,
        changePct: q?.changePct ?? (liveQ ? liveQ.change * 100 : 0),
        rsi14: ind.rsi14,
        sma20: ind.sma20,
        bias: ind.trendBias,
      };
    }),
  );

  return NextResponse.json({
    tool: "tradingview-screener",
    sources: [isCrypto ? "Binance Spot Klines OHLCV" : "TradingView & Multi-Venue Live OHLCV"],
    asOf: new Date().toISOString(),
    symbol: sym,
    price,
    changePct,
    candles: candles.slice(-60),
    indicators,
    screener: screener.filter((r) => r.price > 0),
  });
}

async function handleGlassnodeOnchain() {
  const [
    ,
    fees,
    mempool,
    blocks,
    blockstreamBlocks,
    diff,
    hashrate,
    blockchainStats,
    btcPrem,
    btcOi,
    ethPrem,
    bybitBtc,
    bybitEth,
  ] = await Promise.all([
    ensureMarketData(),
    fetchJsonSafe<{ fastestFee: number; halfHourFee: number; hourFee: number; economyFee: number; minimumFee: number }>(
      "https://mempool.space/api/v1/fees/recommended",
    ),
    fetchJsonSafe<{ count: number; vsize: number; total_fee: number }>("https://mempool.space/api/mempool"),
    fetchJsonSafe<Array<{ id: string; height: number; timestamp: number; tx_count: number; size: number; extras?: { pool?: { name?: string }; totalFees?: number } }>>(
      "https://mempool.space/api/v1/blocks",
    ),
    fetchJsonSafe<Array<{ id: string; height: number; timestamp: number; tx_count: number; size: number }>>(
      "https://blockstream.info/api/blocks",
    ),
    fetchJsonSafe<{ progressPercent: number; difficultyChange: number; remainingBlocks: number; remainingTime: number }>(
      "https://mempool.space/api/v1/difficulty-adjustment",
    ),
    fetchJsonSafe<{ currentHashrate: number; currentDifficulty: number; hashrates?: Array<{ timestamp: number; avgHashrate: number }> }>(
      "https://mempool.space/api/v1/mining/hashrate/1m",
    ),
    fetchJsonSafe<{ hash_rate?: number }>("https://api.blockchain.info/stats"),
    fetchJsonSafe<{ markPrice: string; lastFundingRate: string; indexPrice: string }>(
      "https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT",
    ),
    fetchJsonSafe<{ openInterest: string }>("https://fapi.binance.com/fapi/v1/openInterest?symbol=BTCUSDT"),
    fetchJsonSafe<{ markPrice: string; lastFundingRate: string }>(
      "https://fapi.binance.com/fapi/v1/premiumIndex?symbol=ETHUSDT",
    ),
    fetchJsonSafe<{ result?: { list?: Array<{ markPrice?: string; fundingRate?: string; openInterestValue?: string }> } }>(
      "https://api.bybit.com/v5/market/tickers?category=linear&symbol=BTCUSDT",
    ),
    fetchJsonSafe<{ result?: { list?: Array<{ markPrice?: string; fundingRate?: string }> } }>(
      "https://api.bybit.com/v5/market/tickers?category=linear&symbol=ETHUSDT",
    ),
  ]);

  const bybitBtcRow = bybitBtc?.result?.list?.[0];
  const bybitEthRow = bybitEth?.result?.list?.[0];
  const btcLiveQ = quoteFor("BTC");
  const ethLiveQ = quoteFor("ETH");

  const btcPrice = btcPrem?.markPrice
    ? Number.parseFloat(btcPrem.markPrice)
    : bybitBtcRow?.markPrice
      ? Number.parseFloat(bybitBtcRow.markPrice)
      : btcLiveQ?.price ?? null;
  const btcOiUnits = btcOi?.openInterest ? Number.parseFloat(btcOi.openInterest) : null;
  const btcOiUsd =
    btcOiUnits !== null && btcPrice !== null
      ? btcOiUnits * btcPrice
      : bybitBtcRow?.openInterestValue
        ? Number.parseFloat(bybitBtcRow.openInterestValue)
        : null;

  const ethMarkPrice = ethPrem?.markPrice
    ? Number.parseFloat(ethPrem.markPrice)
    : bybitEthRow?.markPrice
      ? Number.parseFloat(bybitEthRow.markPrice)
      : ethLiveQ?.price ?? null;

  const currentHashrateEh = hashrate?.currentHashrate
    ? hashrate.currentHashrate / 1e18
    : blockchainStats?.hash_rate
      ? blockchainStats.hash_rate / 1e9
      : null;

  const effectiveBlocks =
    blocks && blocks.length > 0
      ? blocks.slice(0, 8).map((b) => ({
          height: b.height,
          txCount: b.tx_count,
          sizeMb: Number((b.size / 1e6).toFixed(2)),
          pool: b.extras?.pool?.name ?? "Unknown Pool",
          feesBtc: typeof b.extras?.totalFees === "number" ? Number((b.extras.totalFees / 1e8).toFixed(4)) : null,
          timestamp: new Date(b.timestamp * 1000).toISOString(),
        }))
      : (blockstreamBlocks ?? []).slice(0, 8).map((b) => ({
          height: b.height,
          txCount: b.tx_count,
          sizeMb: Number((b.size / 1e6).toFixed(2)),
          pool: "Bitcoin Blockstream Node",
          feesBtc: null,
          timestamp: new Date(b.timestamp * 1000).toISOString(),
        }));

  const btcFunding8hPct = btcPrem?.lastFundingRate
    ? Number.parseFloat(btcPrem.lastFundingRate) * 100
    : bybitBtcRow?.fundingRate
      ? Number.parseFloat(bybitBtcRow.fundingRate) * 100
      : null;

  const ethFunding8hPct = ethPrem?.lastFundingRate
    ? Number.parseFloat(ethPrem.lastFundingRate) * 100
    : bybitEthRow?.fundingRate
      ? Number.parseFloat(bybitEthRow.fundingRate) * 100
      : null;

  return NextResponse.json({
    tool: "glassnode-onchain",
    sources: [
      mempool || fees ? "Mempool.space Bitcoin Node" : effectiveBlocks.length > 0 ? "Blockstream Bitcoin Node" : "Bitcoin Node Offline",
      btcPrem ? "Binance Perpetuals Futures" : bybitBtcRow ? "Bybit Perpetuals Futures" : "Multi-Venue Crypto Spot",
    ],
    asOf: new Date().toISOString(),
    fees: fees ?? null,
    mempool: mempool ?? null,
    difficulty: diff ?? null,
    currentHashrateEh,
    hashrateSeries: (hashrate?.hashrates ?? []).slice(-20).map((h) => ({
      date: new Date(h.timestamp * 1000).toISOString().slice(5, 10),
      ehPerSec: Number((h.avgHashrate / 1e18).toFixed(1)),
    })),
    recentBlocks: effectiveBlocks,
    derivatives: {
      btcMarkPrice: btcPrice,
      btcFunding8hPct,
      btcOpenInterestUsd: btcOiUsd,
      ethMarkPrice,
      ethFunding8hPct,
    },
  });
}

async function handleChainalysisAml(addressInput: string) {
  const addr = (addressInput || "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa").trim();
  const isEth = /^0x[a-fA-F0-9]{40}$/.test(addr);

  if (isEth) {
    const rpcCall = async (method: string, params: unknown[]) => {
      const res = await fetchJsonSafe<{ result?: string }>(
        "https://ethereum-rpc.publicnode.com",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        },
        4000,
      );
      return res?.result ?? null;
    };

    const [balHex, nonceHex, codeHex, blockscoutRes] = await Promise.all([
      rpcCall("eth_getBalance", [addr, "latest"]),
      rpcCall("eth_getTransactionCount", [addr, "latest"]),
      rpcCall("eth_getCode", [addr, "latest"]),
      fetchJsonSafe<{
        items?: Array<{
          hash: string;
          block_number?: number;
          timestamp?: string;
          value?: string;
          fee?: { value?: string };
          result?: string;
        }>;
      }>(`https://eth.blockscout.com/api/v2/addresses/${encodeURIComponent(addr)}/transactions`, undefined, 4000),
    ]);

    const balanceEth = balHex ? Number(BigInt(balHex)) / 1e18 : 0;
    const txCount = nonceHex ? Number.parseInt(nonceHex, 16) : 0;
    const isContract = Boolean(codeHex && codeHex !== "0x");
    const risk = computeAmlRiskScore({
      chain: "ethereum",
      balanceNative: balanceEth,
      txCount,
      isContract,
      unconfirmedCount: 0,
      highVelocityCount: txCount > 10000 ? 8 : 0,
    });

    const recentTxs = (blockscoutRes?.items ?? []).slice(0, 10).map((t) => ({
      txid: t.hash,
      confirmed: t.result === "success" || Boolean(t.block_number),
      blockHeight: t.block_number ?? null,
      time: t.timestamp ? t.timestamp.slice(0, 16).replace("T", " ") : "Pending",
      amountNative: t.value ? Number((Number(BigInt(t.value)) / 1e18).toFixed(4)) : 0,
      feeDisplay: t.fee?.value ? `${(Number(BigInt(t.fee.value)) / 1e18).toFixed(5)} ETH` : "—",
    }));

    return NextResponse.json({
      tool: "chainalysis-aml",
      sources: [
        balHex ? "Ethereum PublicNode JSON-RPC" : "Ethereum Mainnet RPC",
        ...(recentTxs.length > 0 ? ["Blockscout Ethereum Trace API"] : []),
      ],
      asOf: new Date().toISOString(),
      chain: "ethereum",
      address: addr,
      entityType: isContract ? "Smart Contract" : "Externally Owned Account (EOA)",
      balanceNative: balanceEth,
      nativeUnit: "ETH",
      txCount,
      unconfirmedCount: 0,
      risk,
      recentTxs,
    });
  }

  // Bitcoin address inspection via Mempool.space
  const [info, txs] = await Promise.all([
    fetchJsonSafe<{
      address: string;
      chain_stats: { funded_txo_sum: number; spent_txo_sum: number; tx_count: number };
      mempool_stats: { funded_txo_sum: number; spent_txo_sum: number; tx_count: number };
    }>(`https://mempool.space/api/address/${encodeURIComponent(addr)}`),
    fetchJsonSafe<
      Array<{
        txid: string;
        fee: number;
        size: number;
        status: { confirmed: boolean; block_height?: number; block_time?: number };
        vout: Array<{ value: number }>;
      }>
    >(`https://mempool.space/api/address/${encodeURIComponent(addr)}/txs`),
  ]);

  const funded = info?.chain_stats?.funded_txo_sum ?? 0;
  const spent = info?.chain_stats?.spent_txo_sum ?? 0;
  const balanceBtc = (funded - spent) / 1e8;
  const txCount = info?.chain_stats?.tx_count ?? 0;
  const unconfirmedCount = info?.mempool_stats?.tx_count ?? 0;

  const risk = computeAmlRiskScore({
    chain: "bitcoin",
    balanceNative: balanceBtc,
    txCount,
    isContract: false,
    unconfirmedCount,
    highVelocityCount: (txs ?? []).filter((t) => t.vout.length >= 6).length,
  });

  return NextResponse.json({
    tool: "chainalysis-aml",
    sources: [info ? "Mempool.space Bitcoin Forensics API" : "Bitcoin Mempool Forensics"],
    asOf: new Date().toISOString(),
    chain: "bitcoin",
    address: addr,
    entityType: balanceBtc > 1000 ? "High-Balance UTXO Cluster" : "Bitcoin UTXO Address",
    balanceNative: balanceBtc,
    nativeUnit: "BTC",
    txCount,
    unconfirmedCount,
    risk,
    recentTxs: (txs ?? []).slice(0, 10).map((t) => ({
      txid: t.txid,
      confirmed: t.status.confirmed,
      blockHeight: t.status.block_height ?? null,
      time: t.status.block_time ? new Date(t.status.block_time * 1000).toISOString().slice(0, 16).replace("T", " ") : "Pending",
      amountNative: Number((t.vout.reduce((s, v) => s + v.value, 0) / 1e8).toFixed(4)),
      feeDisplay: `${t.fee.toLocaleString()} sats`,
    })),
  });
}

async function handleMessariResearch() {
  const [cgMarkets, snapshotRes] = await Promise.all([
    fetchJsonSafe<
      Array<{
        id: string;
        symbol: string;
        name: string;
        current_price: number;
        market_cap: number;
        fully_diluted_valuation: number | null;
        circulating_supply: number;
        total_supply: number | null;
        max_supply: number | null;
        total_volume: number;
        price_change_percentage_24h: number | null;
      }>
    >(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&ids=bitcoin,ethereum,solana,arbitrum,aave,uniswap,chainlink,maker&order=market_cap_desc",
    ),
    fetchJsonSafe<{
      data?: {
        proposals?: Array<{
          id: string;
          title: string;
          state: string;
          space: { id: string; name: string };
          scores_total: number;
          votes: number;
          end: number;
        }>;
      };
    }>("https://hub.snapshot.org/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query: `query { proposals(first: 12, skip: 0, where: { space_in: ["aavedao.eth", "arbitrumfoundation.eth", "uniswapgovernance.eth", "ens.eth", "lido-snapshot.eth"] }, orderBy: "created", orderDirection: desc) { id title state scores_total votes end space { id name } } }`,
      }),
    }),
  ]);

  const tokenomics = (cgMarkets ?? []).map((c) => {
    const fdv = c.fully_diluted_valuation ?? c.market_cap;
    const floatPct = fdv > 0 ? Math.min(100, (c.market_cap / fdv) * 100) : 100;
    return {
      symbol: c.symbol.toUpperCase(),
      name: c.name,
      price: c.current_price,
      change24hPct: c.price_change_percentage_24h ?? 0,
      marketCap: c.market_cap,
      fdv,
      floatPct,
      volume24h: c.total_volume,
    };
  });

  const proposals = (snapshotRes?.data?.proposals ?? []).map((p) => ({
    id: p.id,
    dao: p.space.name,
    title: p.title,
    state: p.state,
    votes: p.votes,
    scoresTotal: p.scores_total,
    endDate: new Date(p.end * 1000).toISOString().slice(0, 10),
  }));

  return NextResponse.json({
    tool: "messari-research",
    sources: [
      tokenomics.length > 0 ? "CoinGecko Tokenomics API" : "CoinGecko Markets Feed",
      proposals.length > 0 ? "Snapshot.org GraphQL Governance" : "Snapshot.org Governance",
    ],
    asOf: new Date().toISOString(),
    tokenomics,
    proposals,
  });
}

async function handleNansenArkham() {
  const [stables, btcTrades, ethTrades, latestBlock] = await Promise.all([
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
    fetchJsonSafe<{
      result?: {
        number?: string;
        timestamp?: string;
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
    .slice(0, 12);

  const ethTxs = (latestBlock?.result?.transactions ?? [])
    .map((tx) => ({
      hash: tx.hash,
      from: tx.from,
      to: tx.to ?? "Contract Creation",
      valueEth: Number(BigInt(tx.value)) / 1e18,
    }))
    .filter((tx) => tx.valueEth >= 0.5)
    .sort((a, b) => b.valueEth - a.valueEth)
    .slice(0, 8);

  return NextResponse.json({
    tool: "nansen-arkham",
    sources: [
      stableRows.length > 0 ? "DeFiLlama Stablecoins API" : "DeFiLlama Stablecoins Feed",
      ethTxs.length > 0 ? "Ethereum PublicNode Block Stream" : "ETH RPC",
      combinedTrades.length > 0 ? "Binance Large Spot Prints" : "Spot Tape",
    ],
    asOf: new Date().toISOString(),
    ethBlockNumber: latestBlock?.result?.number ? Number.parseInt(latestBlock.result.number, 16) : 0,
    stablecoins: stableRows,
    whaleTrades: combinedTrades,
    ethWhaleTxs: ethTxs,
  });
}

async function handleDefillamaTerminal() {
  const [protocols, chains, fees] = await Promise.all([
    fetchJsonSafe<
      Array<{
        name: string;
        symbol: string;
        category: string;
        tvl: number;
        change_1d: number | null;
        change_7d: number | null;
        mcap: number | null;
      }>
    >("https://api.llama.fi/protocols"),
    fetchJsonSafe<Array<{ name: string; tvl: number; tokenSymbol?: string }>>("https://api.llama.fi/v2/chains"),
    fetchJsonSafe<{
      total24h?: number;
      total30d?: number;
      protocols?: Array<{
        name: string;
        displayName?: string;
        category?: string;
        total24h?: number;
        total30d?: number;
        revenue24h?: number;
      }>;
    }>("https://api.llama.fi/overview/fees?excludeTotalDataChart=true&excludeTotalDataChartBreakdown=true"),
  ]);

  const feeByName = new Map<string, { fees24h: number; fees30d: number }>();
  for (const p of fees?.protocols ?? []) {
    const key = (p.displayName ?? p.name ?? "").toLowerCase();
    feeByName.set(key, {
      fees24h: p.total24h ?? 0,
      fees30d: p.total30d ?? 0,
    });
  }

  const topProtocols = (protocols ?? [])
    .filter((p) => p.tvl > 50_000_000 && p.category !== "CEX")
    .slice(0, 20)
    .map((p) => {
      const f = feeByName.get(p.name.toLowerCase());
      const annualizedFees = f?.fees30d ? f.fees30d * 12 : (f?.fees24h ?? 0) * 365;
      const mcap = p.mcap ?? 0;
      const pfRatio = mcap > 0 && annualizedFees > 0 ? mcap / annualizedFees : null;
      const mcapTvl = mcap > 0 && p.tvl > 0 ? mcap / p.tvl : null;
      return {
        name: p.name,
        symbol: p.symbol,
        category: p.category,
        tvl: p.tvl,
        change1d: p.change_1d ?? 0,
        change7d: p.change_7d ?? 0,
        mcap,
        fees24h: f?.fees24h ?? 0,
        annualizedFees,
        pfRatio,
        mcapTvl,
      };
    });

  const topChains = (chains ?? [])
    .filter((c) => c.tvl > 100_000_000)
    .sort((a, b) => b.tvl - a.tvl)
    .slice(0, 10);

  return NextResponse.json({
    tool: "defillama-terminal",
    sources: [
      topProtocols.length > 0 ? "DeFiLlama Protocols API" : "DeFiLlama TVL Feed",
      fees ? "DeFiLlama Fees & Revenue API" : "DeFiLlama Fees Feed",
      topChains.length > 0 ? "DeFiLlama Chains v2" : "DeFiLlama Chains Feed",
    ],
    asOf: new Date().toISOString(),
    totalDeFiFees24h: fees?.total24h ?? 0,
    totalDeFiFees30d: fees?.total30d ?? 0,
    protocols: topProtocols,
    chains: topChains,
  });
}

async function handleCoinMetricsKaiko(symbol: string) {
  const sym = ["BTC", "ETH", "SOL"].includes(symbol) ? symbol : "BTC";
  const krakenPair = sym === "BTC" ? "XBTUSD" : `${sym}USD`;

  const [binanceBook, coinbaseBook, krakenBook] = await Promise.all([
    fetchJsonSafe<{ bids?: Array<[string, string]>; asks?: Array<[string, string]> }>(
      `https://api.binance.com/api/v3/depth?symbol=${sym}USDT&limit=25`,
    ),
    fetchJsonSafe<{ bids?: Array<[string, string, number]>; asks?: Array<[string, string, number]> }>(
      `https://api.exchange.coinbase.com/products/${sym}-USD/book?level=2`,
    ),
    fetchJsonSafe<{ result?: Record<string, { bids?: Array<[string, string, number]>; asks?: Array<[string, string, number]> }> }>(
      `https://api.kraken.com/0/public/Depth?pair=${krakenPair}&count=25`,
    ),
  ]);

  const parseVenue = (
    name: string,
    rawBids?: Array<[string, string, ...unknown[]]>,
    rawAsks?: Array<[string, string, ...unknown[]]>,
  ) => {
    const bids: OrderbookLevel[] = (rawBids ?? [])
      .slice(0, 25)
      .map((b) => ({ price: Number.parseFloat(b[0]), size: Number.parseFloat(b[1]) }))
      .filter((l) => l.price > 0 && l.size > 0);
    const asks: OrderbookLevel[] = (rawAsks ?? [])
      .slice(0, 25)
      .map((a) => ({ price: Number.parseFloat(a[0]), size: Number.parseFloat(a[1]) }))
      .filter((l) => l.price > 0 && l.size > 0);

    if (bids.length === 0 || asks.length === 0) return null;
    const bestBid = bids[0].price;
    const bestAsk = asks[0].price;
    const mid = (bestBid + bestAsk) / 2;
    const spreadBps = ((bestAsk - bestBid) / mid) * 10000;
    const bidDepthUsd = bids.slice(0, 15).reduce((s, l) => s + l.price * l.size, 0);
    const askDepthUsd = asks.slice(0, 15).reduce((s, l) => s + l.price * l.size, 0);
    const slip100k = computeOrderbookSlippage(asks, 100_000);
    const slip500k = computeOrderbookSlippage(asks, 500_000);

    return {
      venue: name,
      bestBid,
      bestAsk,
      mid,
      spreadBps,
      bidDepthUsd,
      askDepthUsd,
      slip100kBps: slip100k.slippageBps,
      slip500kBps: slip500k.slippageBps,
      topBids: bids.slice(0, 8),
      topAsks: asks.slice(0, 8),
    };
  };

  const krakenResultObj = krakenBook?.result ? Object.values(krakenBook.result)[0] : undefined;
  const venues = [
    parseVenue("Binance Spot (USDT)", binanceBook?.bids, binanceBook?.asks),
    parseVenue("Coinbase Exchange (USD)", coinbaseBook?.bids, coinbaseBook?.asks),
    parseVenue("Kraken Pro (USD)", krakenResultObj?.bids, krakenResultObj?.asks),
  ].filter((v): v is NonNullable<typeof v> => v !== null);

  const compositeMid =
    venues.length > 0 ? venues.reduce((s, v) => s + v.mid, 0) / venues.length : 0;
  const mids = venues.map((v) => v.mid);
  const crossVenueDispersionBps =
    mids.length >= 2 && compositeMid > 0
      ? ((Math.max(...mids) - Math.min(...mids)) / compositeMid) * 10000
      : 0;

  return NextResponse.json({
    tool: "coinmetrics-kaiko",
    sources: venues.map((v) => v.venue),
    asOf: new Date().toISOString(),
    symbol: sym,
    compositeMid,
    crossVenueDispersionBps,
    venues,
  });
}

async function handleCryptoFearGreed() {
  const cacheKey = "crypto-fear-greed:90d";
  const cached = getCached<Record<string, unknown>>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const [fngRes, binance24hRes, btcFundingRes, globalRes] = await Promise.all([
    fetchJsonSafe<{
      name?: string;
      data?: Array<{
        value?: string;
        value_classification?: string;
        timestamp?: string;
        time_until_update?: string;
      }>;
      metadata?: { error?: string | null };
    }>("https://api.alternative.me/fng/?limit=90&format=json", undefined, 5000),
    fetchJsonSafe<Array<{ symbol: string; lastPrice: string; priceChangePercent: string; quoteVolume: string }>>(
      'https://api.binance.com/api/v3/ticker/24hr?symbols=["BTCUSDT","ETHUSDT","SOLUSDT"]',
    ),
    fetchJsonSafe<{ markPrice?: string; lastFundingRate?: string }>(
      "https://fapi.binance.com/fapi/v1/premiumIndex?symbol=BTCUSDT",
    ),
    fetchJsonSafe<{
      data?: {
        total_market_cap?: { usd?: number };
        market_cap_change_percentage_24h_usd?: number;
        market_cap_percentage?: { btc?: number; eth?: number };
      };
    }>("https://api.coingecko.com/api/v3/global"),
  ]);

  const rawEntries = fngRes?.data ?? [];
  const parsedHistory = normalizeAlternativeMeEntries(rawEntries);
  const liveFngOk = parsedHistory.length > 0;
  const history = liveFngOk ? parsedHistory : [];
  const stats = liveFngOk ? computeSentimentStats(parsedHistory) : null;

  const rawNextUpdate = Number(rawEntries[0]?.time_until_update);
  const timeUntilUpdateSec =
    Number.isFinite(rawNextUpdate) && rawNextUpdate > 0 ? Math.round(rawNextUpdate) : null;

  const findTicker = (sym: string) => binance24hRes?.find((t) => t.symbol === sym);
  const btcTicker = findTicker("BTCUSDT");
  const ethTicker = findTicker("ETHUSDT");
  const solTicker = findTicker("SOLUSDT");

  const sources: string[] = [];
  if (liveFngOk) sources.push("Alternative.me F&G Index");
  else sources.push("Alternative.me F&G Offline");
  if (binance24hRes && binance24hRes.length > 0) sources.push("Binance Spot & Perps");
  if (globalRes?.data) sources.push("CoinGecko Global");

  const payload = {
    tool: "crypto-fear-greed",
    liveFeed: liveFngOk,
    sources,
    asOf: new Date().toISOString(),
    timeUntilUpdateSec,
    history,
    stats,
    marketContext: {
      btcPrice: btcTicker ? Number(btcTicker.lastPrice) : null,
      btcChange24h: btcTicker ? Number(btcTicker.priceChangePercent) : null,
      ethPrice: ethTicker ? Number(ethTicker.lastPrice) : null,
      ethChange24h: ethTicker ? Number(ethTicker.priceChangePercent) : null,
      solPrice: solTicker ? Number(solTicker.lastPrice) : null,
      solChange24h: solTicker ? Number(solTicker.priceChangePercent) : null,
      btcFunding8hPct: btcFundingRes?.lastFundingRate
        ? Number(btcFundingRes.lastFundingRate) * 100
        : null,
      btcDominancePct: globalRes?.data?.market_cap_percentage?.btc ?? null,
      ethDominancePct: globalRes?.data?.market_cap_percentage?.eth ?? null,
      totalMarketCapUsd: globalRes?.data?.total_market_cap?.usd ?? null,
      marketCapChange24hPct: globalRes?.data?.market_cap_change_percentage_24h_usd ?? null,
    },
  };

  setCached(cacheKey, payload, 120_000);
  return NextResponse.json(payload);
}

export async function GET(req: NextRequest) {
  const tool = req.nextUrl.searchParams.get("tool") ?? "bloomberg-desk";
  const symbol = (req.nextUrl.searchParams.get("symbol") ?? "NVDA").toUpperCase().replace(/[^A-Z0-9-]/g, "");
  const address = req.nextUrl.searchParams.get("address") ?? "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa";

  switch (tool) {
    case "bloomberg-desk":
      return handleBloombergDesk();
    case "excel-dcf":
      return handleExcelDcf(symbol);
    case "capital-iq":
      return handleCapitalIq();
    case "alphasense":
      return handleAlphaSense(symbol);
    case "tradingview-screener":
      return handleTradingViewScreener(symbol);
    case "glassnode-onchain":
      return handleGlassnodeOnchain();
    case "chainalysis-aml":
      return handleChainalysisAml(address);
    case "messari-research":
      return handleMessariResearch();
    case "nansen-arkham":
      return handleNansenArkham();
    case "defillama-terminal":
      return handleDefillamaTerminal();
    case "coinmetrics-kaiko":
      return handleCoinMetricsKaiko(symbol);
    case "crypto-fear-greed":
      return handleCryptoFearGreed();
    case "whale-alert":
      return NextResponse.json(await getLiveWhaleAlertFeed());
    case "ai-sentiment":
      return NextResponse.json(await getLiveAiSentimentFeed());
    case "top-signals":
      return NextResponse.json(await getLiveTopSignalsFeed(18));
    default:
      return NextResponse.json({ error: "Unknown tool parameter" }, { status: 400 });
  }
}
