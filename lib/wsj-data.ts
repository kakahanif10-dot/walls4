export interface WSJMarketLeader {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  volume: string;
  notional: string;
  peRatio: number;
  marketCap: string;
  sector: string;
  week52High: number;
  week52Low: number;
}

export interface WSJHeardStory {
  id: string;
  headline: string;
  subhead: string;
  columnist: string;
  columnistRole: string;
  timestamp: string;
  readTime: string;
  category: "Heard on the Street" | "Executive Intelligence" | "Activist Dispatch" | "Macro Deep-Dive";
  primarySymbol: string;
  summary: string;
  fullAnalysis: string[];
  takeaways: string[];
}

export interface WSJInsiderTrade {
  id: string;
  symbol: string;
  company: string;
  insiderName: string;
  title: string;
  type: "BUY" | "SALE" | "OPTION_EXERCISE";
  shares: string;
  price: number;
  totalValue: string;
  filingDate: string;
  significance: "High - Cluster Buying" | "Routine Diversification" | "Activist Stake Increase" | "Executive Departure Signal";
}

export interface WSJEarningsEvent {
  id: string;
  symbol: string;
  company: string;
  reportDate: string;
  timing: "Before Market Open (BMO)" | "After Market Close (AMC)";
  consensusEPS: string;
  whisperEPS: string;
  impliedMove: string;
  sentiment: "Bullish Skew" | "Bearish Skew" | "Neutral Straddle";
  lastQuarterSurprise: string;
}

export interface WSJSectorPerformance {
  name: string;
  change1d: number;
  change1w: number;
  change1m: number;
  changeYTD: number;
  leader: string;
  laggard: string;
  peAverage: number;
}

export const WSJ_SECTORS: WSJSectorPerformance[] = [
  { name: "Information Technology", change1d: 2.14, change1w: 4.82, change1m: 8.65, changeYTD: 28.4, leader: "NVDA (+4.8%)", laggard: "INTC (-1.2%)", peAverage: 34.2 },
  { name: "Financials & Banking", change1d: 0.95, change1w: 1.45, change1m: 3.20, changeYTD: 14.8, leader: "JPM (+1.8%)", laggard: "WFC (+0.1%)", peAverage: 14.8 },
  { name: "Communication Services", change1d: 1.42, change1w: 2.90, change1m: 5.15, changeYTD: 21.6, leader: "GOOGL (+2.3%)", laggard: "DIS (-0.4%)", peAverage: 24.5 },
  { name: "Healthcare & Biotech", change1d: -0.32, change1w: -1.10, change1m: 0.85, changeYTD: 6.4, leader: "LLY (+1.6%)", laggard: "UNH (-2.1%)", peAverage: 26.1 },
  { name: "Consumer Discretionary", change1d: 1.18, change1w: 3.10, change1m: 4.40, changeYTD: 18.2, leader: "TSLA (+5.2%)", laggard: "NKE (-1.8%)", peAverage: 29.8 },
  { name: "Industrial & Defense", change1d: 0.65, change1w: 1.85, change1m: 2.90, changeYTD: 16.3, leader: "GE (+2.9%)", laggard: "BA (-0.8%)", peAverage: 22.4 },
  { name: "Energy & Petrochemical", change1d: -1.45, change1w: -2.80, change1m: -4.10, changeYTD: 3.9, leader: "XOM (-0.4%)", laggard: "CVX (-1.9%)", peAverage: 12.1 },
  { name: "Consumer Staples", change1d: -0.15, change1w: 0.40, change1m: 1.20, changeYTD: 7.8, leader: "COST (+1.2%)", laggard: "PEP (-0.9%)", peAverage: 23.6 },
  { name: "Materials & Mining", change1d: 0.40, change1w: 0.90, change1m: 1.75, changeYTD: 9.2, leader: "FCX (+3.1%)", laggard: "NEM (-1.1%)", peAverage: 18.9 },
  { name: "Utilities & Power Grid", change1d: 1.82, change1w: 3.40, change1m: 6.80, changeYTD: 22.1, leader: "CEG (+4.4%)", laggard: "NEE (+0.6%)", peAverage: 20.3 },
  { name: "Real Estate (REITs)", change1d: -0.45, change1w: -1.25, change1m: 0.30, changeYTD: 4.1, leader: "PLD (+0.8%)", laggard: "O (-1.4%)", peAverage: 31.5 },
];

export const WSJ_MOST_ACTIVE: WSJMarketLeader[] = [
  { symbol: "NVDA", name: "NVIDIA Corporation", price: 187.40, change: 8.60, changePct: 4.81, volume: "68.4M", notional: "$12.8B", peRatio: 46.2, marketCap: "$4.59T", sector: "Semiconductors", week52High: 195.20, week52Low: 86.40 },
  { symbol: "TSLA", name: "Tesla, Inc.", price: 342.15, change: 16.90, changePct: 5.20, volume: "52.1M", notional: "$17.8B", peRatio: 92.4, marketCap: "$1.09T", sector: "Auto & Robotics", week52High: 360.00, week52Low: 138.80 },
  { symbol: "AAPL", name: "Apple Inc.", price: 264.10, change: 3.25, changePct: 1.25, volume: "44.2M", notional: "$11.6B", peRatio: 33.8, marketCap: "$3.98T", sector: "Consumer Hardware", week52High: 268.50, week52Low: 164.08 },
  { symbol: "PLTR", name: "Palantir Technologies", price: 68.40, change: 4.85, changePct: 7.63, volume: "39.8M", notional: "$2.72B", peRatio: 114.0, marketCap: "$152B", sector: "Enterprise AI Software", week52High: 72.50, week52Low: 19.80 },
  { symbol: "AMZN", name: "Amazon.com, Inc.", price: 218.40, change: 4.10, changePct: 1.91, volume: "31.6M", notional: "$6.90B", peRatio: 41.5, marketCap: "$2.29T", sector: "Cloud & Retail", week52High: 224.00, week52Low: 166.30 },
  { symbol: "MSFT", name: "Microsoft Corporation", price: 512.80, change: 5.90, changePct: 1.16, volume: "22.5M", notional: "$11.5B", peRatio: 36.1, marketCap: "$3.81T", sector: "Enterprise Cloud", week52High: 520.00, week52Low: 388.00 },
  { symbol: "AMD", name: "Advanced Micro Devices", price: 164.20, change: 6.80, changePct: 4.32, volume: "29.4M", notional: "$4.82B", peRatio: 68.0, marketCap: "$265B", sector: "Semiconductors", week52High: 227.30, week52Low: 130.60 },
  { symbol: "COIN", name: "Coinbase Global, Inc.", price: 318.50, change: 24.20, changePct: 8.22, volume: "18.3M", notional: "$5.83B", peRatio: 48.2, marketCap: "$78.4B", sector: "Crypto Brokerage", week52High: 345.00, week52Low: 142.00 },
];

export const WSJ_TOP_GAINERS: WSJMarketLeader[] = [
  { symbol: "COIN", name: "Coinbase Global", price: 318.50, change: 24.20, changePct: 8.22, volume: "18.3M", notional: "$5.83B", peRatio: 48.2, marketCap: "$78.4B", sector: "Crypto Exchange", week52High: 345.00, week52Low: 142.00 },
  { symbol: "PLTR", name: "Palantir Tech", price: 68.40, change: 4.85, changePct: 7.63, volume: "39.8M", notional: "$2.72B", peRatio: 114.0, marketCap: "$152B", sector: "AI Defense Software", week52High: 72.50, week52Low: 19.80 },
  { symbol: "CEG", name: "Constellation Energy", price: 278.40, change: 16.50, changePct: 6.30, volume: "8.4M", notional: "$2.34B", peRatio: 32.5, marketCap: "$88.2B", sector: "Nuclear AI Power", week52High: 285.00, week52Low: 114.00 },
  { symbol: "TSLA", name: "Tesla Inc.", price: 342.15, change: 16.90, changePct: 5.20, volume: "52.1M", notional: "$17.8B", peRatio: 92.4, marketCap: "$1.09T", sector: "Autonomy & Energy", week52High: 360.00, week52Low: 138.80 },
  { symbol: "NVDA", name: "NVIDIA Corp.", price: 187.40, change: 8.60, changePct: 4.81, volume: "68.4M", notional: "$12.8B", peRatio: 46.2, marketCap: "$4.59T", sector: "GPU Accelerators", week52High: 195.20, week52Low: 86.40 },
  { symbol: "SMCI", name: "Super Micro Computer", price: 42.80, change: 1.85, changePct: 4.52, volume: "24.1M", notional: "$1.03B", peRatio: 14.8, marketCap: "$25.1B", sector: "Server Infrastructure", week52High: 122.00, week52Low: 17.50 },
];

export const WSJ_TOP_LOSERS: WSJMarketLeader[] = [
  { symbol: "INTC", name: "Intel Corporation", price: 23.40, change: -1.25, changePct: -5.07, volume: "36.2M", notional: "$847M", peRatio: 0, marketCap: "$101B", sector: "Foundry & Microchips", week52High: 45.20, week52Low: 18.50 },
  { symbol: "UNH", name: "UnitedHealth Group", price: 548.20, change: -18.60, changePct: -3.28, volume: "6.8M", notional: "$3.72B", peRatio: 22.1, marketCap: "$504B", sector: "Managed Healthcare", week52High: 615.00, week52Low: 460.00 },
  { symbol: "CVX", name: "Chevron Corporation", price: 154.20, change: -4.10, changePct: -2.59, volume: "8.9M", notional: "$1.37B", peRatio: 13.4, marketCap: "$282B", sector: "Integrated Oil & Gas", week52High: 168.00, week52Low: 138.00 },
  { symbol: "NKE", name: "Nike, Inc.", price: 74.80, change: -1.65, changePct: -2.16, volume: "11.2M", notional: "$837M", peRatio: 24.2, marketCap: "$112B", sector: "Footwear & Apparel", week52High: 104.00, week52Low: 70.50 },
  { symbol: "BA", name: "The Boeing Company", price: 168.40, change: -3.20, changePct: -1.86, volume: "9.4M", notional: "$1.58B", peRatio: 0, marketCap: "$103B", sector: "Commercial Aerospace", week52High: 218.00, week52Low: 135.00 },
];

export const WSJ_HEARD_STORIES: WSJHeardStory[] = [
  {
    id: "wsj-heard-1",
    headline: "The $4 Trillion Question: Has Big Tech Capex Outrun Real AI Enterprise Utility?",
    subhead: "Hyperscalers are committing $320 billion this fiscal year to data center shells and Nvidia silicon. But software companies are quietly discounting AI seat licenses to hit quotas.",
    columnist: "Dan Gallagher",
    columnistRole: "Senior Markets Columnist, Heard on the Street",
    timestamp: "28 minutes ago",
    readTime: "6 min read",
    category: "Heard on the Street",
    primarySymbol: "MSFT",
    summary: "As Microsoft, Alphabet, Meta and Amazon pour unprecedented capital expenditure into power generation and server racks, Wall Street is pivoting its valuation lens from capacity additions to return on invested capital (ROIC).",
    fullAnalysis: [
      "Capital expenditure among the four largest cloud providers has grown from 12% of revenue three years ago to nearly 24% today. For investors accustomed to asset-light software margins exceeding 70%, the transition to heavy infrastructure operator resembles the railroad and telecom buildouts of the late 1990s.",
      "The issue is not whether artificial intelligence works; it clearly does. The issue is whether enterprise end-users are willing to absorb a 40% markup on cloud subscription seats when standard productivity tooling already satisfies 90% of knowledge workflows.",
      "Our channel checks at Fortune 500 procurement desks indicate that while proof-of-concept budgets remain open, CIOs are demanding firm six-month payback audits before authorizing multi-thousand seat rollouts.",
      "Conclusion for institutional portfolios: Maintain exposure to the hardware pick-and-shovel providers whose backlog is non-cancellable for 12 months, but establish strict invalidation stops on mid-tier SaaS multiples trading at >15x enterprise value to next-twelve-months revenue."
    ],
    takeaways: [
      "Capex intensity has doubled to 24% of hyperscaler revenue, testing cash flow yields.",
      "Enterprise seat expansion is decelerating from pilot stages to ROI verification.",
      "Model recommendation: Stay overweight GPU silicon while trimming secondary SaaS names without pricing power."
    ]
  },
  {
    id: "wsj-heard-2",
    headline: "Nuclear Power Is the New Telecom Fiber: Why Big Tech Is Buying Reactor Output 20 Years Forward",
    subhead: "Constellation and Vistra are locking in 20-year off-take agreements at a 70% premium to wholesale baseload power. Regulators are taking notice.",
    columnist: "Jinjoo Lee",
    columnistRole: "Energy & Infrastructure Editor",
    timestamp: "1 hour ago",
    readTime: "5 min read",
    category: "Executive Intelligence",
    primarySymbol: "CEG",
    summary: "The bottleneck of the artificial intelligence boom has officially shifted from semiconductor packaging to high-voltage grid interconnection queues. Independent power producers with existing zero-carbon capacity hold monopolistic leverage.",
    fullAnalysis: [
      "When Microsoft signed a deal to resurrect the Three Mile Island reactor unit, Wall Street realized that gigawatt availability now commands higher strategic value than marginal chip discounts.",
      "Data centers under design today require 500 megawatts to 2 gigawatts per campus—equivalent to the electrical consumption of a mid-sized metropolitan city like Pittsburgh or Atlanta.",
      "Federal Energy Regulatory Commission (FERC) dockets are already seeing pushback from regional manufacturing coalitions complaining that hyperscaler power co-location shifts transmission tariff burdens onto retail ratepayers.",
      "Investors must watch the PJM Interconnection capacity auctions: if regional clearing prices double, merchant power earnings per share could beat consensus by 40% over the next two fiscal years."
    ],
    takeaways: [
      "Baseload power has replaced chip availability as the critical latency path for cloud expansion.",
      "Long-term off-take contracts grant independent nuclear generators sovereign-like cash flow visibility.",
      "Regulatory scrutiny over grid fairness represents the primary structural risk."
    ]
  },
  {
    id: "wsj-heard-3",
    headline: "Activist Hedge Funds Descend on Legacy Auto as EV Retrenchment Leaves Hundreds of Billions Stranded",
    subhead: "With EV consumer demand plateauing outside China, major automakers face catastrophic capital write-downs on dedicated battery plants.",
    columnist: "Stephen Wilmot",
    columnistRole: "Global Automotive & Industrial Bureau",
    timestamp: "2 hours ago",
    readTime: "7 min read",
    category: "Activist Dispatch",
    primarySymbol: "TSLA",
    summary: "As traditional carmakers backtrack on aggressive electrification targets, activist hedge funds are building stakes to force spin-offs, hybrid re-allocations, and aggressive share repurchase programs.",
    fullAnalysis: [
      "Over the past five years, Detroit and European OEMs spent more than $300 billion retooling assembly lines for battery-electric vehicles that consumers are currently rejecting at current interest rate hurdles.",
      "Meanwhile, Tesla's manufacturing cost per vehicle continues to fall towards $28,000, creating an insurmountable margin moat against legacy architectures burdened by union labor agreements and dealer franchise laws.",
      "Expect activist letters demanding the separation of combustion truck and SUV businesses from loss-making digital and battery skunkworks before the next annual proxy season."
    ],
    takeaways: [
      "Massive sunk capital in battery factories faces multi-billion dollar impairment charges.",
      "Hybrid vehicle profit margins are subsidizing balance sheets, driving executive realignment.",
      "Activist pressure is poised to accelerate structural breakups."
    ]
  }
];

export const WSJ_INSIDER_TRADES: WSJInsiderTrade[] = [
  { id: "it-1", symbol: "NVDA", company: "NVIDIA Corporation", insiderName: "Huang, Jen-Hsun", title: "President & CEO", type: "SALE", shares: "120,000", price: 184.50, totalValue: "$22.1M", filingDate: "Today 16:15 EST", significance: "Routine Diversification" },
  { id: "it-2", symbol: "PLTR", company: "Palantir Tech", insiderName: "Karp, Alexander", title: "Chief Executive Officer", type: "OPTION_EXERCISE", shares: "350,000", price: 65.20, totalValue: "$22.8M", filingDate: "Today 15:42 EST", significance: "Routine Diversification" },
  { id: "it-3", symbol: "JPM", company: "JPMorgan Chase & Co.", insiderName: "Dimon, Jamie", title: "Chairman & CEO", type: "BUY", shares: "50,000", price: 238.10, totalValue: "$11.9M", filingDate: "Yesterday 18:02 EST", significance: "High - Cluster Buying" },
  { id: "it-4", symbol: "CEG", company: "Constellation Energy", insiderName: "Dominguez, Kathleen", title: "Executive VP & Director", type: "BUY", shares: "15,000", price: 268.40, totalValue: "$4.02M", filingDate: "Yesterday 17:15 EST", significance: "High - Cluster Buying" },
  { id: "it-5", symbol: "AAPL", company: "Apple Inc.", insiderName: "Cook, Timothy D.", title: "Chief Executive Officer", type: "SALE", shares: "85,000", price: 261.80, totalValue: "$22.2M", filingDate: "Nov 09 16:30 EST", significance: "Routine Diversification" },
  { id: "it-6", symbol: "TSLA", company: "Tesla, Inc.", insiderName: "Musk, Kimbal", title: "Director", type: "SALE", shares: "40,000", price: 335.20, totalValue: "$13.4M", filingDate: "Nov 08 17:45 EST", significance: "Routine Diversification" },
];

export const WSJ_EARNINGS_EVENTS: WSJEarningsEvent[] = [
  { id: "ee-1", symbol: "NVDA", company: "NVIDIA Corporation", reportDate: "Nov 20, 2026", timing: "After Market Close (AMC)", consensusEPS: "$0.84", whisperEPS: "$0.91", impliedMove: "±8.2%", sentiment: "Bullish Skew", lastQuarterSurprise: "+14.2%" },
  { id: "ee-2", symbol: "PLTR", company: "Palantir Technologies", reportDate: "Nov 22, 2026", timing: "After Market Close (AMC)", consensusEPS: "$0.10", whisperEPS: "$0.13", impliedMove: "±11.5%", sentiment: "Bullish Skew", lastQuarterSurprise: "+22.5%" },
  { id: "ee-3", symbol: "TSLA", company: "Tesla, Inc.", reportDate: "Jan 24, 2027", timing: "After Market Close (AMC)", consensusEPS: "$0.72", whisperEPS: "$0.68", impliedMove: "±7.8%", sentiment: "Bearish Skew", lastQuarterSurprise: "-4.1%" },
  { id: "ee-4", symbol: "AAPL", company: "Apple Inc.", reportDate: "Feb 01, 2027", timing: "After Market Close (AMC)", consensusEPS: "$2.36", whisperEPS: "$2.42", impliedMove: "±4.3%", sentiment: "Neutral Straddle", lastQuarterSurprise: "+5.1%" },
  { id: "ee-5", symbol: "COIN", company: "Coinbase Global", reportDate: "Feb 12, 2027", timing: "After Market Close (AMC)", consensusEPS: "$1.45", whisperEPS: "$1.62", impliedMove: "±13.4%", sentiment: "Bullish Skew", lastQuarterSurprise: "+31.8%" },
];
