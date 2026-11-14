export type InstitutionalStack = "traditional" | "digital";

export type InstitutionalToolSlug =
  | "bloomberg-desk"
  | "excel-dcf"
  | "capital-iq"
  | "alphasense"
  | "tradingview-screener"
  | "glassnode-onchain"
  | "chainalysis-aml"
  | "messari-research"
  | "nansen-arkham"
  | "defillama-terminal"
  | "coinmetrics-kaiko"
  | "crypto-fear-greed"
  | "whale-alert"
  | "ai-sentiment"
  | "top-signals";

export interface InstitutionalToolSpec {
  slug: InstitutionalToolSlug;
  href: string;
  label: string;
  shortLabel: string;
  stack: InstitutionalStack;
  equivalentPlatforms: string;
  tagline: string;
  freeApis: string[];
}

export const INSTITUTIONAL_TOOL_SPECS: InstitutionalToolSpec[] = [
  {
    slug: "bloomberg-desk",
    href: "/tools/bloomberg-desk",
    label: "Bloomberg Terminal Desk",
    shortLabel: "Bloomberg Desk",
    stack: "traditional",
    equivalentPlatforms: "Bloomberg Terminal",
    tagline:
      "Multi-asset equity, US Treasury yield curve, live ECB FX cross-rates, and real-time breaking market wire.",
    freeApis: ["Yahoo Finance Live/Chart", "Frankfurter ECB FX", "Binance 24h Crypto", "SEC EDGAR 8-K Wire"],
  },
  {
    slug: "excel-dcf",
    href: "/tools/excel-dcf",
    label: "Excel DCF & Comps Model",
    shortLabel: "Excel DCF",
    stack: "traditional",
    equivalentPlatforms: "Microsoft Excel · Macabacus",
    tagline:
      "Interactive 5-year DCF valuation workbook, WACC builder, 5x5 sensitivity matrix, and Excel CSV export synced with SEC XBRL.",
    freeApis: ["SEC EDGAR XBRL Facts", "Yahoo Finance Spot & Beta", "US Treasury 10Y Risk-Free"],
  },
  {
    slug: "capital-iq",
    href: "/tools/capital-iq",
    label: "Capital IQ & FactSet Comps",
    shortLabel: "Capital IQ",
    stack: "traditional",
    equivalentPlatforms: "S&P Capital IQ · FactSet",
    tagline:
      "Reported GAAP financials, peer trading multiples (EV/Rev, EV/EBITDA, P/E, FCF Yield), and margin benchmarks.",
    freeApis: ["SEC EDGAR CompanyFacts XBRL", "Yahoo Finance Multi-Ticker"],
  },
  {
    slug: "alphasense",
    href: "/tools/alphasense",
    label: "AlphaSense Filings & Search",
    shortLabel: "AlphaSense",
    stack: "traditional",
    equivalentPlatforms: "AlphaSense",
    tagline:
      "Live SEC EDGAR 10-K, 10-Q, 8-K, and Form 4 institutional document search with direct primary-source links.",
    freeApis: ["SEC EDGAR Submissions API", "SEC EDGAR Full-Text Archives"],
  },
  {
    slug: "tradingview-screener",
    href: "/tools/tradingview-screener",
    label: "TradingView Multi-Asset",
    shortLabel: "TradingView",
    stack: "traditional",
    equivalentPlatforms: "TradingView",
    tagline:
      "Multi-asset technical charting with RSI(14), MACD(12,26,9), SMA-20/50 overlays, and real-time market screener.",
    freeApis: ["Yahoo Finance 90D OHLCV", "Binance Klines OHLCV"],
  },
  {
    slug: "glassnode-onchain",
    href: "/tools/glassnode-onchain",
    label: "Glassnode & CryptoQuant",
    shortLabel: "Glassnode",
    stack: "digital",
    equivalentPlatforms: "Glassnode · CryptoQuant",
    tagline:
      "Live Bitcoin mempool congestion, fee pressure (sat/vB), block velocity, mining hashrate, and derivatives funding.",
    freeApis: ["Mempool.space Bitcoin API", "Binance Futures Open Interest & Funding"],
  },
  {
    slug: "chainalysis-aml",
    href: "/tools/chainalysis-aml",
    label: "Chainalysis & TRM Forensics",
    shortLabel: "Chainalysis AML",
    stack: "digital",
    equivalentPlatforms: "Chainalysis · TRM Labs",
    tagline:
      "Live Bitcoin UTXO & Ethereum RPC wallet inspection, smart contract detection, transaction tracing, and AML risk scoring.",
    freeApis: ["Mempool.space Address API", "Ethereum PublicNode JSON-RPC"],
  },
  {
    slug: "messari-research",
    href: "/tools/messari-research",
    label: "Messari & Blockworks Intel",
    shortLabel: "Messari Intel",
    stack: "digital",
    equivalentPlatforms: "Messari · Blockworks Research",
    tagline:
      "Token supply emission schedules (Circulating vs FDV), live Snapshot.org DAO governance proposals, and protocol economics.",
    freeApis: ["Snapshot.org GraphQL API", "CoinGecko Markets API", "DeFiLlama Protocols"],
  },
  {
    slug: "nansen-arkham",
    href: "/tools/nansen-arkham",
    label: "Nansen & Arkham Smart Money",
    shortLabel: "Nansen Arkham",
    stack: "digital",
    equivalentPlatforms: "Nansen · Arkham Intelligence",
    tagline:
      "Real-time high-value on-chain ETH transfers, large exchange block trades, and stablecoin net mint/flow intelligence.",
    freeApis: ["Ethereum PublicNode Latest Blocks", "DeFiLlama Stablecoins API", "Binance Live Trades"],
  },
  {
    slug: "defillama-terminal",
    href: "/tools/defillama-terminal",
    label: "DeFiLlama & Token Terminal",
    shortLabel: "DeFiLlama TVL",
    stack: "digital",
    equivalentPlatforms: "DeFiLlama · Token Terminal",
    tagline:
      "Live Total Value Locked (TVL), multi-chain dominance, protocol fee & revenue capture, and Price-to-Fees (P/F) multiples.",
    freeApis: ["DeFiLlama Protocols API", "DeFiLlama Fees & Revenue API", "DeFiLlama Chains v2"],
  },
  {
    slug: "coinmetrics-kaiko",
    href: "/tools/coinmetrics-kaiko",
    label: "Coin Metrics & Kaiko Feeds",
    shortLabel: "Coin Metrics",
    stack: "digital",
    equivalentPlatforms: "Coin Metrics · Kaiko",
    tagline:
      "Normalized cross-exchange Level 2 order book depth across Binance, Coinbase, and Kraken with slippage & spread dispersion.",
    freeApis: ["Binance L2 Depth API", "Coinbase Exchange L2 Book", "Kraken Public Depth API"],
  },
  {
    slug: "crypto-fear-greed",
    href: "/tools/crypto-fear-greed",
    label: "Crypto Fear & Greed Index",
    shortLabel: "Fear & Greed",
    stack: "digital",
    equivalentPlatforms: "Alternative.me · Coinglass Sentiment",
    tagline:
      "Real-time 0–100 crypto market sentiment gauge, 90-day extreme regime history, Z-score dispersion, and live BTC/ETH/SOL leverage & dominance context.",
    freeApis: ["Alternative.me F&G API", "Binance Spot & Perps", "CoinGecko Global"],
  },
  {
    slug: "whale-alert",
    href: "/tools/whale-alert",
    label: "Live Whale Movement Feed (Whale Alert)",
    shortLabel: "Whale Alert",
    stack: "digital",
    equivalentPlatforms: "Whale Alert · Arkham · Nansen",
    tagline:
      "Real-time tracking of high-value Ethereum block transfers, institutional BTC/ETH/SOL spot block prints, and 24h stablecoin treasury mints.",
    freeApis: ["Ethereum PublicNode Mainnet", "Binance Spot Whale Tape", "DeFiLlama Stablecoins"],
  },
  {
    slug: "ai-sentiment",
    href: "/tools/ai-sentiment",
    label: "Real-Time AI Market Sentiment",
    shortLabel: "AI Sentiment",
    stack: "traditional",
    equivalentPlatforms: "NextWallStreet AI · Alternative.me",
    tagline:
      "Real-time AI sentiment regime blending 2,038-asset breadth, live Fear & Greed Index, perpetual funding skew, and institutional desk synthesis.",
    freeApis: ["2,038-Asset Scoring Engine", "Alternative.me F&G", "Binance Perps Funding"],
  },
  {
    slug: "top-signals",
    href: "/tools/top-signals",
    label: "Top 3 Signals Today & Conviction Board",
    shortLabel: "Top 3 Signals",
    stack: "traditional",
    equivalentPlatforms: "NextWallStreet Quant Desk",
    tagline:
      "Real-time highest-conviction signals across US equities and digital assets with live targets, mathematical invalidation levels, and risk-reward ratios.",
    freeApis: ["Live Multi-Venue Quotes", "5-Factor Trend Scoring Model"],
  },
];

export interface WorkflowComparisonRow {
  focusArea: string;
  traditionalWallStreet: string;
  digitalAssetCrypto: string;
}

export const WORKFLOW_COMPARISON_MATRIX: WorkflowComparisonRow[] = [
  {
    focusArea: "Primary Data Source",
    traditionalWallStreet: "SEC filings (10-K/10-Q/8-K), earnings releases, and regulated exchange feeds",
    digitalAssetCrypto: "Public blockchain ledgers, smart contracts, mempools, and DEX/CEX APIs",
  },
  {
    focusArea: "Core Valuation Metrics",
    traditionalWallStreet: "Revenue, EBITDA, Free Cash Flow (DCF), WACC, and P/E ratios",
    digitalAssetCrypto: "Total Value Locked (TVL), protocol fees (P/F), active addresses, and token supply schedules",
  },
  {
    focusArea: "Risk & Compliance",
    traditionalWallStreet: "Credit ratings, US Treasury curves, regulatory filings, and GAAP audit reports",
    digitalAssetCrypto: "Wallet address AML screening, UTXO/illicit fund tracing, and smart contract code audits",
  },
  {
    focusArea: "Dominant Terminal",
    traditionalWallStreet: "Bloomberg Terminal, Microsoft Excel, S&P Capital IQ, FactSet, AlphaSense",
    digitalAssetCrypto: "Glassnode, Chainalysis, Messari, Nansen, Arkham, DeFiLlama, Token Terminal, Kaiko",
  },
];

export const SEC_CIK_MAP: Record<string, { cik: string; name: string; sector: string }> = {
  NVDA: { cik: "0001045810", name: "NVIDIA Corp.", sector: "Semiconductors" },
  AAPL: { cik: "0000320193", name: "Apple Inc.", sector: "Consumer Hardware" },
  MSFT: { cik: "0000789019", name: "Microsoft Corp.", sector: "Enterprise Software" },
  AMZN: { cik: "0001018724", name: "Amazon.com Inc.", sector: "Cloud & Commerce" },
  META: { cik: "0001326801", name: "Meta Platforms Inc.", sector: "Digital Platforms" },
  GOOGL: { cik: "0001652044", name: "Alphabet Inc.", sector: "Digital Platforms" },
  TSLA: { cik: "0001318605", name: "Tesla Inc.", sector: "Autos & Robotics" },
  JPM: { cik: "0000019617", name: "JPMorgan Chase & Co.", sector: "Money Center Banks" },
  GS: { cik: "0000886982", name: "Goldman Sachs Group Inc.", sector: "Investment Banking" },
  COIN: { cik: "0001679788", name: "Coinbase Global Inc.", sector: "Digital Market Infra" },
  AMD: { cik: "0000002488", name: "Advanced Micro Devices Inc.", sector: "Semiconductors" },
};

export interface WaccInputs {
  riskFreeRatePct: number;
  equityRiskPremiumPct: number;
  beta: number;
  costOfDebtPct: number;
  taxRatePct: number;
  debtWeightPct: number;
}

export function computeWacc(inputs: WaccInputs): {
  costOfEquityPct: number;
  afterTaxCostOfDebtPct: number;
  waccPct: number;
} {
  const rf = Math.max(0, inputs.riskFreeRatePct);
  const erp = Math.max(0, inputs.equityRiskPremiumPct);
  const beta = Math.max(0.1, inputs.beta);
  const costOfEquityPct = rf + beta * erp;

  const taxRate = Math.min(0.6, Math.max(0, inputs.taxRatePct / 100));
  const afterTaxCostOfDebtPct = Math.max(0, inputs.costOfDebtPct) * (1 - taxRate);

  const debtWeight = Math.min(0.95, Math.max(0, inputs.debtWeightPct / 100));
  const equityWeight = 1 - debtWeight;
  const waccPct = equityWeight * costOfEquityPct + debtWeight * afterTaxCostOfDebtPct;

  return {
    costOfEquityPct,
    afterTaxCostOfDebtPct,
    waccPct,
  };
}

export interface DcfInputs {
  baseRevenueM: number;
  revenueGrowthPct: number;
  ebitdaMarginPct: number;
  taxRatePct: number;
  daPctOfRev: number;
  capexPctOfRev: number;
  nwcPctOfRev: number;
  waccPct: number;
  terminalGrowthPct: number;
  netDebtM: number;
  sharesOutM: number;
  currentPriceUsd?: number;
}

export interface DcfYearProjection {
  year: number;
  revenueM: number;
  ebitdaM: number;
  ebitM: number;
  nopatM: number;
  ufcfM: number;
  discountFactor: number;
  pvFcfM: number;
}

export interface DcfOutput {
  projections: DcfYearProjection[];
  sumPvFcfM: number;
  terminalValueM: number;
  pvTerminalValueM: number;
  enterpriseValueM: number;
  equityValueM: number;
  impliedSharePriceUsd: number;
  upsidePct: number | null;
  tvShareOfEvPct: number;
  sensitivityGrid: Array<{
    waccPct: number;
    cells: Array<{ terminalGrowthPct: number; impliedPriceUsd: number }>;
  }>;
}

function solveDcfPrice(inputs: DcfInputs, waccOverride: number, tgrOverride: number): {
  projections: DcfYearProjection[];
  sumPvFcfM: number;
  terminalValueM: number;
  pvTerminalValueM: number;
  enterpriseValueM: number;
  equityValueM: number;
  impliedSharePriceUsd: number;
} {
  const wacc = Math.max(0.02, waccOverride / 100);
  const tgr = Math.min(wacc - 0.005, Math.max(0, tgrOverride / 100));
  const growth = inputs.revenueGrowthPct / 100;
  const ebitdaMargin = inputs.ebitdaMarginPct / 100;
  const daPct = inputs.daPctOfRev / 100;
  const capexPct = inputs.capexPctOfRev / 100;
  const nwcPct = inputs.nwcPctOfRev / 100;
  const taxRate = Math.min(0.6, Math.max(0, inputs.taxRatePct / 100));

  const projections: DcfYearProjection[] = [];
  let prevRevenue = Math.max(1, inputs.baseRevenueM);
  let sumPvFcfM = 0;

  for (let yr = 1; yr <= 5; yr++) {
    // Taper growth slightly in years 4-5 for realistic institutional fade
    const yearGrowth = yr <= 3 ? growth : growth * (yr === 4 ? 0.85 : 0.72);
    const revenueM = prevRevenue * (1 + yearGrowth);
    const deltaRev = revenueM - prevRevenue;
    const ebitdaM = revenueM * ebitdaMargin;
    const daM = revenueM * daPct;
    const ebitM = ebitdaM - daM;
    const nopatM = ebitM * (1 - taxRate);
    const capexM = revenueM * capexPct;
    const changeNwcM = deltaRev * nwcPct;
    const ufcfM = nopatM + daM - capexM - changeNwcM;
    const discountFactor = 1 / Math.pow(1 + wacc, yr);
    const pvFcfM = ufcfM * discountFactor;

    sumPvFcfM += pvFcfM;
    projections.push({
      year: yr,
      revenueM,
      ebitdaM,
      ebitM,
      nopatM,
      ufcfM,
      discountFactor,
      pvFcfM,
    });
    prevRevenue = revenueM;
  }

  const terminalYearFcf = projections[projections.length - 1]?.ufcfM ?? 0;
  const terminalValueM = (terminalYearFcf * (1 + tgr)) / Math.max(0.005, wacc - tgr);
  const pvTerminalValueM = terminalValueM / Math.pow(1 + wacc, 5);
  const enterpriseValueM = sumPvFcfM + pvTerminalValueM;
  const equityValueM = enterpriseValueM - inputs.netDebtM;
  const shares = Math.max(1, inputs.sharesOutM);
  const impliedSharePriceUsd = Math.max(0, equityValueM / shares);

  return {
    projections,
    sumPvFcfM,
    terminalValueM,
    pvTerminalValueM,
    enterpriseValueM,
    equityValueM,
    impliedSharePriceUsd,
  };
}

export function computeDcfModel(inputs: DcfInputs): DcfOutput {
  const base = solveDcfPrice(inputs, inputs.waccPct, inputs.terminalGrowthPct);
  const waccSteps = [-1.0, -0.5, 0, 0.5, 1.0];
  const tgrSteps = [-0.5, -0.25, 0, 0.25, 0.5];

  const sensitivityGrid = waccSteps.map((dw) => {
    const w = Number((inputs.waccPct + dw).toFixed(2));
    return {
      waccPct: w,
      cells: tgrSteps.map((dt) => {
        const g = Number((inputs.terminalGrowthPct + dt).toFixed(2));
        const res = solveDcfPrice(inputs, w, g);
        return {
          terminalGrowthPct: g,
          impliedPriceUsd: res.impliedSharePriceUsd,
        };
      }),
    };
  });

  const upsidePct =
    inputs.currentPriceUsd && inputs.currentPriceUsd > 0
      ? ((base.impliedSharePriceUsd - inputs.currentPriceUsd) / inputs.currentPriceUsd) * 100
      : null;

  const tvShareOfEvPct =
    base.enterpriseValueM > 0 ? (base.pvTerminalValueM / base.enterpriseValueM) * 100 : 0;

  return {
    ...base,
    upsidePct,
    tvShareOfEvPct,
    sensitivityGrid,
  };
}

export interface TechnicalCandle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicators {
  rsi14: number;
  sma20: number;
  sma50: number;
  macdLine: number;
  signalLine: number;
  macdHistogram: number;
  trendBias: "Bullish Momentum" | "Overbought" | "Oversold" | "Consolidation";
}

function calcEmaSeries(values: number[], period: number): number[] {
  if (values.length === 0) return [];
  const k = 2 / (period + 1);
  const ema: number[] = [values[0]];
  for (let i = 1; i < values.length; i++) {
    ema.push(values[i] * k + ema[i - 1] * (1 - k));
  }
  return ema;
}

export function computeTechnicalIndicators(closes: number[]): TechnicalIndicators {
  if (closes.length === 0) {
    return {
      rsi14: 50,
      sma20: 0,
      sma50: 0,
      macdLine: 0,
      signalLine: 0,
      macdHistogram: 0,
      trendBias: "Consolidation",
    };
  }

  const last = closes[closes.length - 1];
  const slice20 = closes.slice(-20);
  const slice50 = closes.slice(-50);
  const sma20 = slice20.reduce((s, v) => s + v, 0) / slice20.length;
  const sma50 = slice50.reduce((s, v) => s + v, 0) / slice50.length;

  // Wilder-smoothed / standard 14-period RSI
  let avgGain = 0;
  let avgLoss = 0;
  const period = Math.min(14, Math.max(1, closes.length - 1));
  const startIdx = Math.max(1, closes.length - period);
  for (let i = startIdx; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff;
    else avgLoss += Math.abs(diff);
  }
  avgGain /= period;
  avgLoss /= period;
  const rs = avgLoss === 0 ? (avgGain > 0 ? 100 : 1) : avgGain / avgLoss;
  const rsi14 = avgLoss === 0 && avgGain === 0 ? 50 : 100 - 100 / (1 + rs);

  const ema12 = calcEmaSeries(closes, 12);
  const ema26 = calcEmaSeries(closes, 26);
  const macdSeries = ema12.map((v, i) => v - ema26[i]);
  const signalSeries = calcEmaSeries(macdSeries, 9);
  const macdLine = macdSeries[macdSeries.length - 1] ?? 0;
  const signalLine = signalSeries[signalSeries.length - 1] ?? 0;
  const macdHistogram = macdLine - signalLine;

  let trendBias: TechnicalIndicators["trendBias"] = "Consolidation";
  if (rsi14 >= 70) trendBias = "Overbought";
  else if (rsi14 <= 30) trendBias = "Oversold";
  else if (last > sma20 && macdHistogram >= 0) trendBias = "Bullish Momentum";

  return {
    rsi14,
    sma20,
    sma50,
    macdLine,
    signalLine,
    macdHistogram,
    trendBias,
  };
}

export interface OrderbookLevel {
  price: number;
  size: number;
}

export interface OrderbookSlippageResult {
  requestedUsd: number;
  filledUsd: number;
  filledUnits: number;
  vwapPrice: number;
  bestPrice: number;
  slippageBps: number;
  exhaustedBook: boolean;
}

export function computeOrderbookSlippage(
  levels: OrderbookLevel[],
  notionalUsd: number,
): OrderbookSlippageResult {
  if (levels.length === 0 || notionalUsd <= 0) {
    return {
      requestedUsd: notionalUsd,
      filledUsd: 0,
      filledUnits: 0,
      vwapPrice: 0,
      bestPrice: 0,
      slippageBps: 0,
      exhaustedBook: true,
    };
  }

  const bestPrice = levels[0].price;
  let remainingUsd = notionalUsd;
  let totalUnits = 0;
  let totalSpentUsd = 0;

  for (const lvl of levels) {
    if (lvl.price <= 0 || lvl.size <= 0) continue;
    const levelUsd = lvl.price * lvl.size;
    if (levelUsd >= remainingUsd) {
      const unitsHere = remainingUsd / lvl.price;
      totalUnits += unitsHere;
      totalSpentUsd += remainingUsd;
      remainingUsd = 0;
      break;
    } else {
      totalUnits += lvl.size;
      totalSpentUsd += levelUsd;
      remainingUsd -= levelUsd;
    }
  }

  const vwapPrice = totalUnits > 0 ? totalSpentUsd / totalUnits : bestPrice;
  const slippageBps =
    bestPrice > 0 ? (Math.abs(vwapPrice - bestPrice) / bestPrice) * 10000 : 0;

  return {
    requestedUsd: notionalUsd,
    filledUsd: totalSpentUsd,
    filledUnits: totalUnits,
    vwapPrice,
    bestPrice,
    slippageBps,
    exhaustedBook: remainingUsd > 0.01,
  };
}

export interface AmlRiskInput {
  chain: "bitcoin" | "ethereum";
  balanceNative: number;
  txCount: number;
  isContract: boolean;
  unconfirmedCount: number;
  highVelocityCount: number;
  knownSanctionedMatch?: boolean;
}

export interface AmlRiskOutput {
  score: number;
  tier: "Low Risk" | "Moderate Review" | "Elevated Risk" | "High Risk Flag";
  factors: Array<{ label: string; impact: string; severity: "low" | "med" | "high" }>;
}

export function computeAmlRiskScore(input: AmlRiskInput): AmlRiskOutput {
  let score = 8;
  const factors: AmlRiskOutput["factors"] = [];

  if (input.knownSanctionedMatch) {
    score += 75;
    factors.push({
      label: "OFAC / Known Illicit Cluster Heuristic",
      impact: "+75 pts",
      severity: "high",
    });
  }

  if (input.txCount > 5000) {
    score += 22;
    factors.push({
      label: `High-Velocity Relay Address (${input.txCount.toLocaleString()} txs)`,
      impact: "+22 pts",
      severity: "med",
    });
  } else if (input.txCount > 500) {
    score += 10;
    factors.push({
      label: `Active Counterparty Graph (${input.txCount.toLocaleString()} txs)`,
      impact: "+10 pts",
      severity: "low",
    });
  } else {
    factors.push({
      label: `Standard Velocity Profile (${input.txCount.toLocaleString()} txs)`,
      impact: "+0 pts",
      severity: "low",
    });
  }

  if (input.unconfirmedCount > 3) {
    score += 18;
    factors.push({
      label: `${input.unconfirmedCount} Unconfirmed Mempool Spends (RBF / Chaining)`,
      impact: "+18 pts",
      severity: "med",
    });
  }

  if (input.highVelocityCount > 5) {
    score += 16;
    factors.push({
      label: `Rapid Peel-Chain / Split Pattern (${input.highVelocityCount} hops)`,
      impact: "+16 pts",
      severity: "med",
    });
  }

  if (input.isContract) {
    score += 12;
    factors.push({
      label: "Deployed EVM Smart Contract Bytecode",
      impact: "+12 pts (audit code)",
      severity: "med",
    });
  }

  if (input.balanceNative >= 1000 && input.chain === "bitcoin") {
    factors.push({
      label: "Institutional Cold Custody Balance (>1,000 BTC)",
      impact: "Custody Signal",
      severity: "low",
    });
  }

  const clamped = Math.min(100, Math.max(1, Math.round(score)));
  const tier: AmlRiskOutput["tier"] =
    clamped >= 70
      ? "High Risk Flag"
      : clamped >= 45
        ? "Elevated Risk"
        : clamped >= 25
          ? "Moderate Review"
          : "Low Risk";

  return { score: clamped, tier, factors };
}

export function formatCompactCurrency(val: number): string {
  const abs = Math.abs(val);
  const sign = val < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1)}K`;
  return `${sign}$${abs.toFixed(2)}`;
}
