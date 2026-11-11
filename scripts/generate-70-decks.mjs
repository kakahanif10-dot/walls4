import fs from "fs";

const authors = [
  { name: "Daniel Okafor", role: "Head of Wall Street Equity Strategy" },
  { name: "Sarah Vance, CFA", role: "Chief Quantitative & Day Trade Strategist" },
  { name: "Elena Rostova", role: "Senior Crypto Flow & Derivatives Analyst" },
  { name: "Marcus Thorne", role: "Speculative Liquidity & Meme Coin Desk Lead" },
  { name: "Julian Sterling", role: "Macro & Central Bank Liquidity Strategist" },
  { name: "Adrian Chen", role: "High-Frequency Order Flow & Execution Specialist" }
];

const stockTickers = ["NVDA", "AAPL", "MSFT", "AMZN", "META", "TSLA", "GOOGL", "AMD", "AVGO", "PLTR", "COIN", "SMCI", "ARM", "RDDT", "RKLB", "CAVA"];
const cryptoTickers = ["BTC", "ETH", "SOL", "BNB", "XRP", "ADA", "AVAX", "NEAR", "SUI", "LINK", "UNI", "TAO", "RENDER", "AAVE", "FET"];
const memeTickers = ["DOGE", "SHIB", "PEPE", "WIF", "BONK", "FLOKI", "FARTCOIN", "GOAT", "PNUT", "MOODENG", "POPCAT", "SPX", "FARTO", "GRIF", "CHILL"];

// 30 Wall Street & Day Trading Decks
const marketTitles = [
  "The AI capex cycle is now a second-derivative trade",
  "The Breadth Divergence Playbook: When five mega-caps carry the index",
  "Institutional Pre-Market Volume Imbalance: Exploiting the 09:15 EST Gap",
  "The Earnings PEAD Mechanism: Why post-earnings drift persists for 42 days",
  "Semiconductor Lead-Lag Dynamics: Measuring ASML bookings against US fab beta",
  "Day Trading the 5-Minute Opening Range Breakout (ORB) with 200-SMA confirmation",
  "Why Price-to-Earnings Ratios lag: Replacing valuation with momentum slopes",
  "The Invalidation Principle: How institutional desks size before direction",
  "Options Dealer Gamma Flips: Predicting intraday volatility regime transitions",
  "S&P 500 Mean-Reversion bands: When 2-Standard Deviation VWAP becomes magnetic",
  "High-Beta Growth Rotation: Spotting the shift from defensives to Russell 2000",
  "The 10-Year Treasury Yield Shock: Which equity sectors survive 4.80% yields",
  "Hyperscaler Cloud Margins: Dissecting software recurring revenue vs AI power costs",
  "Algorithmic Liquidity Sweeps: Identifying stops hunted before trend continuation",
  "Volume Profile Point of Control (POC): Trading value area migrations",
  "Quantifying 60-Day Realized Volatility for position sizing normalization",
  "The Fed Balance Sheet & Overnight Reverse Repo: Liquidity transmission to equities",
  "Semiconductor Cycle Top Indicators: Capex-to-revenue thresholds that signal exhaustion",
  "Intraday Delta Footprint: Spotting institutional absorption at key support",
  "The Systematic Momentum Factor: Academic empirical proof vs discretionary bias",
  "Defense & Aerospace Super-Cycle: Structural tailwinds beyond headline defense budgets",
  "Biotech Catalysts & FDA Approval Drift: Sizing binary events without ruin",
  "Mega-Cap Tech Free Cash Flow Yields: Comparing 2026 cash return to bond yields",
  "Financials & Yield Curve Steepener: Regional bank net interest margin mechanics",
  "Retail Sentiment Contrarian Indicators: How retail option call skew flags tops",
  "The Mid-Cap Growth Screener: Finding tomorrow's Nasdaq-100 inclusions",
  "Tape Reading in Dark Pools: Identifying off-exchange institutional blocks",
  "The 50-day Moving Average Defense: Anatomy of an institutional accumulation shelf",
  "Short Squeeze Anatomy: Days-to-cover and borrow fee spikes before explosive moves",
  "Wall Street Morning Desk Memo: Execution rules for high-volatility CPI mornings"
];

// 22 Crypto & Layer-1/2 Decks
const cryptoTitles = [
  "Bitcoin has no valuation floor. It has a liquidity ceiling.",
  "Ethereum Blob Space & Layer-2 Fee Economics post-Dencun",
  "Solana vs Ethereum Economic Security: Fee burn versus validator subsidies",
  "Bitcoin Spot ETF Inflow Velocity: Tracking institutional accumulator addresses",
  "Perpetual Funding Rate Extremes: Mean-reversion signals on Binance & OKX",
  "Stablecoin Supply Expansion as the ultimate leading indicator for crypto bull runs",
  "Decentralized Physical Infrastructure (DePIN): Real revenue models vs token emissions",
  "AI Compute Tokens on-chain: GPU clusters, decentralized inference, and token sinks",
  "Real World Assets (RWAs): Institutional treasury tokenization and liquidity velocity",
  "The Bitcoin Halving Cycle Decay: Why 4-year cycle theories are giving way to macro",
  "Cross-Chain Bridge Liquidity & Interoperability Risk: Auditing bridge collateral",
  "Crypto Market Microstructure: Order book depth on Coinbase vs offshore exchanges",
  "Decentralized Exchange (DEX) Volume Dominance: Uniswap and Raydium flow dynamics",
  "Proof-of-Stake Validator Staking Yields vs US Risk-Free Rates",
  "Smart Contract Platform War: Monolithic throughput vs modular rollup architectures",
  "Liquid Restaking Protocol Risks: EigenLayer recursive leverage and slashing contagion",
  "Bitcoin Miner Capitulation Signals: Hashrate drawdown and reserve depletion bottoms",
  "Crypto Derivatives Gamma Squeeze: Pin risk and open interest liquidation waterfalls",
  "On-Chain Whale Clustering: Distinguishing exchange internal transfers from OTC buys",
  "Decentralized Lending Liquidation Thresholds: Stress testing Maker and Aave collateral",
  "Layer-1 Tokenomics Audit: Inflation schedule, unlock cliffs, and insider allocations",
  "Institutional Crypto Custody & Prime Brokerage: How big funds deploy spot exposure"
];

// 18 Meme Coin & pump.fun Alpha Decks
const memeTitles = [
  "Pump.fun Bonding Curve Mechanics: The mathematical threshold to Raydium graduation",
  "Holder Concentration & Snipe Wallet Clustering: Spotting insider dev bundles",
  "The Meme Coin Attention Half-Life: Quantifying virality decay in hours, not weeks",
  "Why 99% of Pump.fun tokens fail: Anatomy of developer rug-pulls and liquidity drains",
  "Solana Telegram Trading Bots: Speed advantages, MEV bribes, and slippage protection",
  "Viral Meme Narrative Life Cycles: From Telegram insider room to Binance listing",
  "Meme Coin Position Sizing Discipline: Why 2% portfolio allocation is the hard cap",
  "Liquidity Pool Burn Audits: Verifying LP lock contracts on Solana and Base",
  "Top 10 Holder Wallets: Calculating developer cabal control before buying",
  "The Second Wave Breakout: How to trade meme tokens after the initial 80% dump",
  "Meme Coins as Cultural Call Options: Why attention economics replaces DCF models",
  "Base Ecosystem Meme Rotation: How Coinbase Smart Wallets drive retail meme onboarding",
  "Pump.fun Graduation Momentum: Trading the Raydium liquidity seeding spike",
  "Meme Coin Sentiment Scraping: Tracking Twitter engagement velocity and bot inflation",
  "Order Book Illiquidity Shock: How a $50k sell order causes an 85% flash crash",
  "CT (Crypto Twitter) Influencer Frontrunning: Decoding paid shilling schedules",
  "Bonding Curve Fee Extraction: How platform protocols generate $1M+ daily fees",
  "Meme Coin Exit Strategy Playbook: Scaling out into strength before liquidity evaporates"
];

const decks = [];

function generateDeck(title, category, index) {
  const author = authors[index % authors.length];
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  
  let tickers = [];
  if (category === "markets") {
    tickers = [stockTickers[index % stockTickers.length], stockTickers[(index + 3) % stockTickers.length], stockTickers[(index + 7) % stockTickers.length]];
  } else if (category === "crypto") {
    tickers = [cryptoTickers[index % cryptoTickers.length], cryptoTickers[(index + 2) % cryptoTickers.length]];
  } else {
    tickers = [memeTickers[index % memeTickers.length], memeTickers[(index + 4) % memeTickers.length]];
  }

  const dateOffset = index * 2;
  const d = new Date(Date.now() - dateOffset * 86400000);
  const dateStr = d.toISOString().split("T")[0];

  return {
    slug,
    title,
    category,
    dek: `In-depth quantitative desk analysis on ${title.toLowerCase()}. Evaluating structural trends, liquidity flows, exact invalidation price levels, and institutional risk distribution.`,
    author: author.name,
    role: author.role,
    date: dateStr,
    readMinutes: 6 + (index % 6),
    tags: category === "markets" 
      ? ["Wall Street", "Equities", "Trend Scoring", "Invalidation"]
      : category === "crypto"
      ? ["Crypto", "Liquidity", "On-Chain", "Binance"]
      : ["Meme Coins", "pump.fun", "Bonding Curve", "Solana"],
    premium: index > 2, // First 3 free, rest premium
    tickers,
    body: [
      {
        type: "p",
        text: `Every institutional trader knows that price action without structural context is merely noise. In this desk memo, we dissect the core drivers behind ${title.toLowerCase()}, examining where real capital is deploying versus where passive liquidity is trapped.`
      },
      {
        type: "h2",
        text: "1. The Quantitative Trend & Flow Thesis"
      },
      {
        type: "p",
        text: `Unlike subjective sentiment or lagging fundamental ratios, our 5-factor scoring engine measures the slope of moving averages (20, 50, and 200 SMA), 30-session rate of change, and RSI stretch. When ${tickers.join(", ")} trigger momentum persistence above the 66-threshold, positioning transitions from accumulation to trend expansion.`
      },
      {
        type: "quote",
        text: `A trend is structurally valid until the price crosses the mathematical invalidation level. Sizing decides survival before returns ever matter.`
      },
      {
        type: "h2",
        text: "2. Order Flow, Liquidity & Invalidation Stop"
      },
      {
        type: "p",
        text: `The critical failure mode for most retail traders is entering based on narrative and exiting based on pain. On the NextWall Street institutional desk, our invalidation is anchored to the lower band of the 20-day and 50-day moving average confluence. A daily close below this anchor invalidates the thesis, triggering an immediate disciplined cut.`
      },
      {
        type: "list",
        items: [
          "Confirm multi-timeframe moving average alignment before initiating primary risk notional.",
          "Check order book absorption and dark pool volume or DEX liquidity depth.",
          "Size inversely to 60-day realized volatility: higher variance demands smaller notional.",
          "Automate stop execution strictly at the model invalidation level."
        ]
      },
      {
        type: "h2",
        text: "3. Actionable Desk Takeaways & Sizing Rules"
      },
      {
        type: "p",
        text: `For subscribers actively tracking ${tickers[0]} and related sector peers, review your exposure against the hard sector caps: maximum 20% portfolio allocation in equities, 8% in major crypto, and a strict 2% ceiling in meme tokens.`
      }
    ]
  };
}

marketTitles.forEach((t, i) => decks.push(generateDeck(t, "markets", i)));
cryptoTitles.forEach((t, i) => decks.push(generateDeck(t, "crypto", i)));
memeTitles.forEach((t, i) => decks.push(generateDeck(t, "meme", i)));

const content = `import type { Block } from "./content";

export type ResearchCategory = "markets" | "crypto" | "meme";

export type ResearchDeck = {
  slug: string;
  title: string;
  dek: string;
  category: ResearchCategory;
  author: string;
  role: string;
  date: string;
  readMinutes: number;
  tags: string[];
  premium: boolean;
  tickers: string[];
  body: Block[];
};

export const RESEARCH_DECKS_70: ResearchDeck[] = ${JSON.stringify(decks, null, 2)};

export const DECKS_BY_CATEGORY = {
  markets: RESEARCH_DECKS_70.filter(d => d.category === "markets"),
  crypto: RESEARCH_DECKS_70.filter(d => d.category === "crypto"),
  meme: RESEARCH_DECKS_70.filter(d => d.category === "meme"),
};

export const DECK_BY_SLUG = Object.fromEntries(
  RESEARCH_DECKS_70.map((d) => [d.slug, d])
);
`;

fs.writeFileSync("./lib/research-decks-70.ts", content);
console.log(`Generated ${decks.length} research decks in lib/research-decks-70.ts`);
