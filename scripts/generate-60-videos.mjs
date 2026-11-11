import fs from "fs";

const instructors = [
  { name: "Daniel Okafor", role: "Head of Wall Street Equity Strategy", initials: "DO" },
  { name: "Sarah Vance, CFA", role: "Chief Quantitative & Day Trade Strategist", initials: "SV" },
  { name: "Elena Rostova", role: "Senior Crypto Flow & Derivatives Analyst", initials: "ER" },
  { name: "Marcus Thorne", role: "Speculative Liquidity & Meme Coin Desk Lead", initials: "MT" },
  { name: "Julian Sterling", role: "Macro & Central Bank Liquidity Strategist", initials: "JS" },
  { name: "Adrian Chen", role: "High-Frequency Order Flow & Execution Specialist", initials: "AC" }
];

const visualTypes = [
  "structure", "moving_averages", "invalidation", "sr_flips",
  "order_book", "volume_profile", "tape_reading", "liquidity_sweeps",
  "bonding_curve", "wallet_clustering", "scalp_playbook", "narrative_cycle",
  "position_sizing", "drawdown_math", "execution_checklist", "hedging_beta",
  "fed_liquidity", "ai_capex", "earnings_pead", "premarket_flow"
];

// 22 Equities & Day Trading Masterclasses
const marketTitles = [
  "Market Structure & Trend Regimes: Higher Highs vs Choppy Distributions",
  "The 20-Day, 50-Day, and 200-Day Moving Average Confluence Stack",
  "The Mathematical Invalidation Anchor: Placing Stops Where the Thesis Dies",
  "Support-to-Resistance Flips: Trading the Retest with Volume Confirmation",
  "Opening Range Breakout (ORB): 5-Minute Intraday Strategy on Nasdaq",
  "Volume Profile & Value Area High/Low: Day Trading Intraday Balance",
  "Tape Reading in Modern Equity Markets: Spotting Hidden Bid Blocks",
  "Earnings PEAD Playbook: Capitalizing on 42-Day Post-Earnings Announcement Drift",
  "Pre-Market Volume Imbalance & Gap-and-Go Execution at 09:30 EST",
  "Risk Management & Position Sizing: Normalizing by 60-Day Realized Volatility",
  "Drawdown Mathematics: Why Sizing Errors Kill Accounts Faster Than Bad Entries",
  "Day Trading vs Swing Trading: Horizon Alignment and Execution Checklists",
  "Options Delta & Gamma Exposure: Pinning, Squeezes, and OpEx Transitions",
  "High-Beta Semiconductor Momentum: Trading NVDA, AMD, and AVGO Co-Movement",
  "Federal Reserve Liquidity & Overnight Reverse Repo Transmission to S&P 500",
  "Mean Reversion on VWAP Extremes: Two-Standard-Deviation Fades",
  "The Breadth Divergence Signal: Spotting Index Tops Before Mega-Caps Crack",
  "Relative Strength vs the Benchmark: Leading Sectors in Pullbacks",
  "Liquidity Sweeps & Trap Candles: How Retail Stops Fuel Trend Continuations",
  "Macro Yield Curve Dynamics: Trading Equities in a Steepening Environment",
  "Multi-Day Continuation Patterns: Flags, Wedges, and High-Tight Shelves",
  "Institutional Execution & Dark Pools: Auditing Off-Exchange Print Clusters"
];

// 20 Crypto & Microstructure Masterclasses
const cryptoTitles = [
  "Order Book Microstructure & Depth: Spoofing, Walls, and Real Bids on Binance",
  "Perpetual Futures Funding Rates: Identifying Extreme Sentiment & Long Squeezes",
  "Bitcoin Spot ETF Inflows vs Coinbase Premium: Reading Real Institutional Demand",
  "Ethereum Blob Economics & Layer-2 Fee Capture Mechanics Post-Dencun",
  "Solana High-Throughput Microstructure: Priority Fees, Jito Bundles, and Validator Flow",
  "DeFi Liquidity Pools vs Centralized CLOBs: Automated Market Maker Mechanics",
  "On-Chain Whale Tracking: Distinguishing Cold Wallet Storage from Dumping",
  "Liquid Staking & Restaking: Auditing Slashing Risk and Yield Contagion",
  "Crypto Market Cycles: Halving Realities vs Global M2 Fiat Expansion",
  "Stablecoin Velocity & Supply Expansion: The Fuel for Altcoin Seasons",
  "Cross-Chain Bridge Vulnerabilities: Auditing Multi-Sig and Liquidity Security",
  "Bitcoin Miner Capitulation & Hash Ribbons: Spotting Macro Cycle Bottoms",
  "Decentralized Physical Infrastructure (DePIN): Real Tokenomics vs Inflation",
  "Real-World Asset (RWA) Tokenization: Treasuries, Private Credit, and On-Chain Flow",
  "Crypto Options Volatility Skew: Call vs Put Premiums on Deribit",
  "Algorithmic Grid Trading & Hedging: Neutralizing Beta in Sideways Ranges",
  "Decentralized Lending Health Factors: Monitoring Liquidation Waterfalls on Aave",
  "Layer-1 vs Modular Rollups: Comparing MEV Extraction and Scalability",
  "Smart Contract Security Auditing for Traders: Spotting Mint and Honeypot Traps",
  "Managing Crypto Portfolio Risk: Hard Caps, Cold Storage, and Invalidation Rules"
];

// 18 Meme Coin & pump.fun Alpha Masterclasses
const memeTitles = [
  "Pump.fun Bonding Curve Architecture: How Mathematical Pricing Curves Work",
  "Snipe Wallet Clustering & Dev Bundling: Exposing Cabal Pre-Allocations",
  "The 4-Hour Meme Attention Half-Life: Timing Viral Decay and Peak Volume",
  "Why 99% of Pump.fun Tokens Go to Zero: Detecting Liquidity Drains and Scams",
  "Solana Telegram Sniper Bots: Setting Up Jito Tips, Slippage, and Priority Fees",
  "Trading the Raydium Migration: Profiting from the Bonding Curve Graduation Spike",
  "Holder Concentration Metrics: Calculating Top 10 Wallet Dominance",
  "Viral Narrative Triggers: AI Agents, Mascot Memes, and Political Catalysts",
  "The Second-Wave Breakout Playbook: Sniping the 80% Retest on High Volume",
  "DEXScreener & BubbleMaps Mastery: Visualizing Wallet Bubbles and Insider Trees",
  "LP Burn and Mint Revocation Audits: Verifying Contract Immutability",
  "Meme Coin Scalping Execution: 1-Minute Chart Tape Reading and Momentum Exits",
  "Managing Meme Coin Volatility: Why 2% Is the Absolute Portfolio Allocation Cap",
  "Base Ecosystem Meme Dynamics: Bridging, Farcaster Hype, and Coinbase Retail Flow",
  "Crypto Twitter (CT) Engagement Scraping: Measuring Real Accounts vs Bot Swarms",
  "Flash Crash Liquidity Voids: What Happens When a Whale Market-Sells 10% Supply",
  "Bonding Curve Fee Extraction Models: Understanding Protocol Value Capture",
  "The Meme Coin Exit Discipline: Taking Initial Principal Out on 2x Multiples"
];

const videos = [];

function generateVideo(title, category, index) {
  const instructor = instructors[index % instructors.length];
  const visualType = visualTypes[index % visualTypes.length];
  const id = `lesson-${String(index + 1).padStart(2, "0")}-${category}`;
  const minutes = 12 + (index % 15);
  const durationSeconds = minutes * 60;
  const level = index < 6 ? "Beginner" : index < 14 ? "Intermediate" : "Advanced";
  
  let moduleName = "Price Action & Structure";
  if (category === "markets") {
    moduleName = index < 8 ? "Price Action & Structure" : index < 15 ? "Microstructure & Order Flow" : "Risk Management & Sizing";
  } else if (category === "crypto") {
    moduleName = index < 10 ? "Crypto Microstructure & Derivatives" : "Macro & Tech Cycles";
  } else {
    moduleName = "Meme Coins & Pump.fun Alpha";
  }

  return {
    id,
    title,
    category,
    module: moduleName,
    level,
    durationSeconds,
    durationLabel: `${minutes}:00`,
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    instructor: instructor.name,
    instructorRole: instructor.role,
    instructorInitials: instructor.initials,
    visualType,
    chapters: [
      { time: 0, title: "01. Desk Thesis & Theoretical Architecture", description: `Foundational overview of ${title.toLowerCase()}.` },
      { time: Math.floor(durationSeconds * 0.25), title: "02. Order Flow & Chart Execution Setup", description: "Real-time chart mechanics, indicator settings, and order book confluence." },
      { time: Math.floor(durationSeconds * 0.6), title: "03. The Mathematical Invalidation Level", description: "Calculating the exact level where the thesis is wrong and cut-loss triggers." },
      { time: Math.floor(durationSeconds * 0.85), title: "04. Position Sizing & Systematic Rules", description: "Risk budgeting, volatility adjustment, and profit target scaling." }
    ],
    summary: `Complete institutional masterclass on ${title.toLowerCase()}. Learn how quantitative desks read flow, determine mathematical invalidation levels, and preserve trading capital in volatile tape conditions.`,
    takeaways: [
      "Identify structural trend direction across multi-timeframe moving averages.",
      "Calculate mathematical invalidation stop before committing trading capital.",
      "Adjust notional size inversely proportional to 60-day realized volatility.",
      "Execute disciplined take-profit scaling into high-momentum spikes."
    ],
    quiz: {
      question: `What is the primary risk rule taught in '${title}'?`,
      options: [
        "Size your trade strictly based on the distance to mathematical invalidation, not profit hope",
        "Average down aggressively whenever price drops below the 200-day moving average",
        "Rely purely on social media narrative without verifying order book depth",
        "Allocate 50% of your total capital to high-volatility speculative breakouts"
      ],
      correctIndex: 0,
      explanation: "Risk is always defined by the distance to invalidation. If you cannot afford the stop distance at your current position size, you must scale down the notional or pass on the trade."
    }
  };
}

let count = 0;
marketTitles.forEach((t) => { count++; videos.push(generateVideo(t, "markets", count)); });
cryptoTitles.forEach((t) => { count++; videos.push(generateVideo(t, "crypto", count)); });
memeTitles.forEach((t) => { count++; videos.push(generateVideo(t, "meme", count)); });

const fileContent = `import type { VideoLesson, VideoVisualType, VideoChapter } from "./academy-videos";

export const VIDEO_LESSONS_60: VideoLesson[] = ${JSON.stringify(videos, null, 2)};

export const VIDEOS_BY_CATEGORY = {
  markets: VIDEO_LESSONS_60.filter(v => (v as any).category === "markets"),
  crypto: VIDEO_LESSONS_60.filter(v => (v as any).category === "crypto"),
  meme: VIDEO_LESSONS_60.filter(v => (v as any).category === "meme"),
};
`;

fs.writeFileSync("./lib/academy-videos-60.ts", fileContent);
console.log(`Generated ${videos.length} video masterclasses in lib/academy-videos-60.ts`);
