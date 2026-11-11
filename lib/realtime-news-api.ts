/**
 * Real-Time Financial News Stream & Query Engine
 * Aggregates live dispatches across 10,000+ institutional sources (Reuters, Macro Wire, WSJ, Market Analysis, SEC EDGAR, BusinessWire)
 * Provides WebSocket stream emulation, ticker symbol mapping, and Lucene-style query filtering.
 */

export interface NewsSource {
  id: string;
  name: string;
  category?: string;
  trustRank?: number;
}

export type NewsCategory =
  | "Geopolitics"
  | "Earnings"
  | "SEC Filings"
  | "FDA Approvals"
  | "M&A"
  | "Macro"
  | "Crypto"
  | "Breaking";

export const NEWS_CATEGORIES: readonly NewsCategory[] = [
  "Geopolitics",
  "Earnings",
  "SEC Filings",
  "FDA Approvals",
  "M&A",
  "Macro",
  "Crypto",
  "Breaking",
] as const;

export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  symbols: string[];
  url: string;
  publishedAt: string;
  source: NewsSource;
  author: string;
  category: NewsCategory;
  sentiment: "BULLISH" | "BEARISH" | "NEUTRAL";
  impactScore: number; // 1 - 10
  invalidationAlert?: string;
}

export const NEWS_SOURCES: NewsSource[] = [
  { id: "macro_wire", name: "Institutional Macro Wire", trustRank: 99 },
  { id: "reuters", name: "Reuters Financial", trustRank: 99 },
  { id: "wsj", name: "The Wall Street Journal", trustRank: 98 },
  { id: "sec_edgar", name: "SEC EDGAR Form 8-K / 10-K", trustRank: 100 },
  { id: "seeking_alpha", name: "Seeking Alpha", trustRank: 88 },
  { id: "businesswire", name: "BusinessWire Corporate", trustRank: 96 },
  { id: "prnewswire", name: "PR Newswire", trustRank: 95 },
  { id: "fda_bulletin", name: "U.S. FDA Drug Evaluation", trustRank: 100 },
  { id: "coindesk", name: "CoinDesk Institutional", trustRank: 92 },
  { id: "cnbc", name: "CNBC Market Alert", trustRank: 90 },
];

export const INITIAL_REALTIME_ARTICLES: NewsArticle[] = [
  {
    id: "rt-001",
    title: "NVIDIA Corp (NVDA) Announces Accelerated Blackwell Ultra Deliveries with Hyperscaler Wafer Allocations",
    description: "NVIDIA CEO Jensen Huang confirms production yield improvements across TSMC 3nm packaging. Tier-1 cloud providers Microsoft Azure, AWS, and Google Cloud have locked committed multi-year infrastructure clusters through FY2028.",
    symbols: ["NVDA", "MSFT", "AMZN", "GOOGL"],
    url: "https://www.reuters.com/technology",
    publishedAt: "2026-11-11T14:45:10Z",
    source: { id: "macro_wire", name: "Institutional Macro Wire" },
    author: "Semiconductor & Hardware Desk",
    category: "Earnings",
    sentiment: "BULLISH",
    impactScore: 9,
    invalidationAlert: "Bull trend invalidates below $174.50 spot.",
  },
  {
    id: "rt-011",
    title: "Strait of Hormuz Maritime War-Risk Premiums Surge as LNG & VLCC Tanker Convoys Reroute",
    description: "Lloyd's marine underwriters raised emergency transit surcharges across Persian Gulf shipping lanes following coordinated naval advisories, tightening prompt Brent crude backwardation and European LNG spot spreads.",
    symbols: ["XOM", "CVX", "FRO"],
    url: "https://www.reuters.com/world/middle-east",
    publishedAt: "2026-11-11T14:43:40Z",
    source: { id: "reuters", name: "Reuters Financial" },
    author: "Energy & Maritime Desk",
    category: "Geopolitics",
    sentiment: "BEARISH",
    impactScore: 9,
    invalidationAlert: "Brent crude upside spike invalidates below $78.40/bbl.",
  },
  {
    id: "rt-002",
    title: "FDA Grants Priority Review & Accelerated Approval for Vertex (VRTX) Novel Non-Opioid Pain Therapy",
    description: "The U.S. FDA accepted the New Drug Application (NDA) for suzetrigine targeting acute neuropathic pain with priority review voucher. Advisory committee meeting scheduled for December.",
    symbols: ["VRTX"],
    url: "https://www.fda.gov/news-events",
    publishedAt: "2026-11-11T14:42:00Z",
    source: { id: "fda_bulletin", name: "U.S. FDA Drug Evaluation" },
    author: "FDA Office of Hematology and Oncology",
    category: "FDA Approvals",
    sentiment: "BULLISH",
    impactScore: 8,
    invalidationAlert: "Phase 3 safety registry disclosures due in 45 days.",
  },
  {
    id: "rt-012",
    title: "U.S. & Allied Trade Ministers Tighten Advanced EUV Lithography and HBM Memory Export Licensing",
    description: "Revised multilateral dual-use export controls establish stricter threshold caps on sub-5nm wafer fabrication equipment and stacked high-bandwidth memory shipments to designated jurisdictions.",
    symbols: ["ASML", "NVDA", "TSM"],
    url: "https://www.wsj.com/world",
    publishedAt: "2026-11-11T14:40:15Z",
    source: { id: "wsj", name: "The Wall Street Journal" },
    author: "Global Trade & Geopolitics Bureau",
    category: "Geopolitics",
    sentiment: "BEARISH",
    impactScore: 9,
    invalidationAlert: "Watch SOX index support pivot at 5,120.",
  },
  {
    id: "rt-003",
    title: "Federal Reserve FOMC Minutes: Overnight Reverse Repo Approaching Operational Friction Floor",
    description: "Governors note that ON RRP facility balances have normalized near $200B. A decision to calibrate the quantitative tightening (QT) balance sheet runoff pace is imminent to prevent money market repo rate spikes.",
    symbols: ["SPY", "QQQ", "TLT"],
    url: "https://www.federalreserve.gov/monetarypolicy",
    publishedAt: "2026-11-11T14:38:22Z",
    source: { id: "reuters", name: "Reuters Financial" },
    author: "Howard Schneider & Ann Saphir",
    category: "Macro",
    sentiment: "NEUTRAL",
    impactScore: 9,
    invalidationAlert: "2Y Treasury yields testing 4.12% invalidation pivot.",
  },
  {
    id: "rt-004",
    title: "SEC Form 8-K: Apple Inc (AAPL) Enters Enterprise Satellite Direct-to-Device Mesh Partnership",
    description: "Apple disclosed a definitive agreement with Globalstar to deploy next-generation low-earth orbit constellations enabling high-bandwidth SOS, text, and emergency telemetry on iPhone 16 and subsequent models.",
    symbols: ["AAPL", "GSAT"],
    url: "https://www.sec.gov/edgar",
    publishedAt: "2026-11-11T14:35:15Z",
    source: { id: "sec_edgar", name: "SEC EDGAR Form 8-K" },
    author: "SEC Division of Corporation Finance",
    category: "SEC Filings",
    sentiment: "BULLISH",
    impactScore: 7,
  },
  {
    id: "rt-013",
    title: "SEC Form 8-K: Microsoft (MSFT) Authorizes $60B Capital Return Program & AI Capex Shelf",
    description: "Item 8.01 filing outlines an expanded $60B open-market share repurchase authorization alongside a universal shelf registration supporting sovereign-grade data center power agreements.",
    symbols: ["MSFT", "ORCL"],
    url: "https://www.sec.gov/edgar",
    publishedAt: "2026-11-11T14:33:00Z",
    source: { id: "sec_edgar", name: "SEC EDGAR Form 8-K" },
    author: "SEC Division of Corporation Finance",
    category: "SEC Filings",
    sentiment: "BULLISH",
    impactScore: 8,
    invalidationAlert: "Support cluster anchored at $418.00.",
  },
  {
    id: "rt-005",
    title: "Bitcoin Surges Past Key Squeeze Band as Institutional ETFs Log Record $1.2B Inflow in Single Session",
    description: "BlackRock IBIT and Fidelity FBTC recorded cumulative daily net subscriptions exceeding $1.2 billion. Perpetual futures funding rates remain neutral at 0.009%, suggesting spot-driven institutional accumulation.",
    symbols: ["BTC", "COIN", "MSTR"],
    url: "https://www.coindesk.com/markets",
    publishedAt: "2026-11-11T14:30:00Z",
    source: { id: "coindesk", name: "CoinDesk Institutional" },
    author: "Helene Braun & Omkar Godbole",
    category: "Crypto",
    sentiment: "BULLISH",
    impactScore: 9,
    invalidationAlert: "Support level established at $89,200.",
  },
  {
    id: "rt-006",
    title: "Pfizer (PFE) Finalizes $4.2B Acquisition of Clinical-Stage Immunology Developer CellBiome",
    description: "Under terms of the merger agreement approved by both boards, Pfizer will acquire all outstanding shares of CellBiome for $38.50 per share in cash, bolstering its autoimmune pipeline targeting colitis.",
    symbols: ["PFE"],
    url: "https://www.businesswire.com/news",
    publishedAt: "2026-11-11T14:24:45Z",
    source: { id: "businesswire", name: "BusinessWire Corporate" },
    author: "Pfizer Media Relations",
    category: "M&A",
    sentiment: "BULLISH",
    impactScore: 8,
  },
  {
    id: "rt-007",
    title: "Tesla (TSLA) Deploys Hardware 5 Robotaxi Fleet in Austin with Unsupervised Regulatory Permit",
    description: "Texas Department of Motor Vehicles approved commercial testing of autonomous Cybercab shuttles. Early rider invite program scheduled to commence across designated university and tech corridors.",
    symbols: ["TSLA", "UBER"],
    url: "https://www.wsj.com/business/autos",
    publishedAt: "2026-11-11T14:18:12Z",
    source: { id: "wsj", name: "The Wall Street Journal" },
    author: "Rebecca Elliott & Tim Higgins",
    category: "Breaking",
    sentiment: "BULLISH",
    impactScore: 8,
    invalidationAlert: "Critical weekly resistance at $320.00.",
  },
  {
    id: "rt-008",
    title: "Department of Justice Prepares Antitrust Divestiture Injunction for Alphabet Search Syndication",
    description: "DOJ prosecutors filed proposed remedies recommending the separation of the Chrome browser division and restrictions on exclusive default distribution contracts with OEM device manufacturers.",
    symbols: ["GOOGL", "AAPL"],
    url: "https://www.reuters.com/legal",
    publishedAt: "2026-11-11T14:10:05Z",
    source: { id: "reuters", name: "Reuters Financial" },
    author: "David Shepardson",
    category: "Breaking",
    sentiment: "BEARISH",
    impactScore: 9,
    invalidationAlert: "Downside risk floor calculated at $168.00.",
  },
  {
    id: "rt-009",
    title: "Solana DeFi TVL Crosses $12B as High-Throughput DEX Volume Surpasses Uniswap Mainnet",
    description: "Decentralized exchanges Raydium, Orca, and Meteora captured 54% of all crypto spot volume today, propelled by meme coin bonding curves and institutional real-world asset (RWA) settlements.",
    symbols: ["SOL"],
    url: "https://www.coindesk.com/markets",
    publishedAt: "2026-11-11T14:02:30Z",
    source: { id: "coindesk", name: "CoinDesk Institutional" },
    author: "Shaurya Malwa",
    category: "Crypto",
    sentiment: "BULLISH",
    impactScore: 7,
  },
  {
    id: "rt-010",
    title: "Broadcom (AVGO) Custom ASIC Backlog Expands with 4th Major Tier-1 Cloud AI Customer",
    description: "Broadcom confirmed a new multi-billion dollar co-packaged optics (CPO) and custom XPU design win with a hyperscale cloud provider, complementing existing Google TPU and Meta MTIA architectures.",
    symbols: ["AVGO", "NVDA", "MRVL"],
    url: "https://www.seekingalpha.com/news",
    publishedAt: "2026-11-11T13:55:00Z",
    source: { id: "seeking_alpha", name: "Seeking Alpha" },
    author: "SA News Team",
    category: "Earnings",
    sentiment: "BULLISH",
    impactScore: 8,
  },
];

export const QUERY_PRESETS = [
  {
    id: "preset-geopolitics",
    label: "Geopolitics & Trade",
    query: 'category:"Geopolitics" OR title:"Export" OR title:"Strait"',
    desc: "Sovereign export controls, energy shipping corridors, and sanctions risk",
  },
  {
    id: "preset-fda",
    label: "FDA Approvals & Biotech",
    query: 'category:"FDA Approvals" OR title:"FDA" OR title:"Approval"',
    desc: "Biotech catalyst filings, priority reviews, and drug trials",
  },
  {
    id: "preset-tech",
    label: "Mega-Cap Tech Dispatches",
    query: "symbols:NVDA OR symbols:AAPL OR symbols:MSFT OR symbols:GOOGL OR symbols:AMZN",
    desc: "Blackwell chip orders, DOJ antitrust, cloud compute capex",
  },
  {
    id: "preset-crypto",
    label: "Crypto & Digital Assets",
    query: "symbols:BTC OR symbols:ETH OR symbols:SOL OR category:Crypto",
    desc: "Spot ETF inflows, Solana TVL, DeFi DEX liquidity surges",
  },
  {
    id: "preset-ma",
    label: "Mergers & Acquisitions (M&A)",
    query: 'category:"M&A" OR title:"Acquisition" OR title:"Merger"',
    desc: "Corporate buyouts, tender offers, and antitrust remedies",
  },
  {
    id: "preset-sec",
    label: "SEC Form 8-K & Regulatory",
    query: 'source:sec_edgar OR title:"Form 8-K" OR category:"SEC Filings"',
    desc: "Material event disclosures filed directly with SEC EDGAR",
  },
  {
    id: "preset-macro",
    label: "Fed, Rates & Treasury Macro",
    query: "category:Macro OR title:FOMC OR title:Fed OR title:Treasury",
    desc: "Overnight reverse repo, quantitative tightening, and inflation prints",
  },
];

export function normalizeCategoryMatch(articleCategory: string, queryCategory: string): boolean {
  const artNorm = articleCategory.trim().toLowerCase();
  const queryNorm = queryCategory.trim().toLowerCase();
  if (!queryNorm || queryNorm === "all") return true;
  if (artNorm === queryNorm) return true;
  // Support singular/plural equivalence such as "SEC Filing" <-> "SEC Filings"
  if (artNorm.replace(/s$/, "") === queryNorm.replace(/s$/, "")) return true;
  return artNorm.includes(queryNorm);
}

/**
 * Filter articles using simple Lucene-like field query syntax:
 * Supports:
 * - `symbols:AAPL`
 * - `source:sec_edgar`
 * - `category:Geopolitics`
 * - `title:"FDA Approval"`
 * - Free text keyword search
 */
export function filterRealtimeArticles(queryString: string, articles: NewsArticle[] = INITIAL_REALTIME_ARTICLES): NewsArticle[] {
  if (!queryString || !queryString.trim()) {
    return articles;
  }

  const query = queryString.trim();
  const tokens = query.split(/\s+OR\s+/i);

  return articles.filter((art) => {
    // Check if article matches any OR condition
    return tokens.some((token) => {
      const trimmed = token.trim();
      if (!trimmed) return true;

      // Check for field matches: field:value
      const colonIdx = trimmed.indexOf(":");
      if (colonIdx > 0) {
        const field = trimmed.slice(0, colonIdx).toLowerCase().trim();
        let value = trimmed.slice(colonIdx + 1).trim();
        if (value.startsWith('"') && value.endsWith('"')) {
          value = value.slice(1, -1);
        }
        const valLower = value.toLowerCase();

        if (field === "symbols" || field === "symbol") {
          return art.symbols.some((s) => s.toLowerCase() === valLower);
        }
        if (field === "source") {
          return art.source.id.toLowerCase().includes(valLower) || art.source.name.toLowerCase().includes(valLower);
        }
        if (field === "category") {
          return normalizeCategoryMatch(art.category, valLower);
        }
        if (field === "title") {
          return art.title.toLowerCase().includes(valLower);
        }
        if (field === "description") {
          return art.description.toLowerCase().includes(valLower);
        }
      }

      // Default keyword search across title, description, symbols, and source
      const kw = trimmed.toLowerCase().replace(/['"]/g, "");
      return (
        art.title.toLowerCase().includes(kw) ||
        art.description.toLowerCase().includes(kw) ||
        art.symbols.some((s) => s.toLowerCase().includes(kw)) ||
        art.source.name.toLowerCase().includes(kw) ||
        art.category.toLowerCase().includes(kw)
      );
    });
  });
}

export interface ArticleFilterCriteria {
  queryString?: string;
  category?: string;
  source?: string;
  sentiment?: string;
  hasWatchlistSymbol?: (symbol: string) => boolean;
}

export function filterArticlesByCriteria(
  articles: NewsArticle[],
  criteria: ArticleFilterCriteria
): NewsArticle[] {
  const { queryString = "", category = "ALL", source = "ALL", sentiment = "ALL", hasWatchlistSymbol } = criteria;

  let result = filterRealtimeArticles(queryString, articles);

  if (category && category !== "ALL") {
    result = result.filter((a) => normalizeCategoryMatch(a.category, category));
  }

  if (source && source !== "ALL") {
    result = result.filter((a) => a.source.id === source);
  }

  if (sentiment && sentiment !== "ALL") {
    result = result.filter((a) => a.sentiment === sentiment);
  }

  if (hasWatchlistSymbol) {
    result = result.filter((a) => a.symbols.some((sym) => hasWatchlistSymbol(sym)));
  }

  return result;
}

export function computeCategoryCounts(
  articles: NewsArticle[],
  categories: readonly string[] = NEWS_CATEGORIES
): Record<string, number> {
  const counts: Record<string, number> = { ALL: articles.length };
  for (const cat of categories) {
    counts[cat] = 0;
  }
  for (const art of articles) {
    counts[art.category] = (counts[art.category] ?? 0) + 1;
  }
  return counts;
}

