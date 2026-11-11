export type NewsAction = "BUY" | "ACCUMULATE" | "HOLD" | "TRIM" | "AVOID";

export type NewsCategory =
  | "Tech & AI Scandals"
  | "Geopolitics & Defense"
  | "Macro & Central Banks"
  | "Crypto & Layer-1"
  | "Executive Boardroom & M&A"
  | "Speculative & Meme Alpha";

export interface GoldNewsItem {
  id: string;
  headline: string;
  summary: string;
  category: NewsCategory;
  symbol: string;
  secondarySymbols?: string[];
  action: NewsAction;
  currentPrice: number;
  targetPrice: number;
  invalidationStop: number;
  confidence: number;
  impactPct: number;
  catalystWindow: string;
  source: string;
  timestampOffsetMinutes: number;
  deskRationale: string;
}

export const GOLD_NEWS_ITEMS: GoldNewsItem[] = [
  {
    id: "gn-1",
    headline: "Nvidia Executive Governance Audit Refutes Personal Scandal Allegations; Hyperscaler Server Allocation Accelerated",
    summary: "An independent external audit committee confirmed zero governance breaches regarding executive conduct rumors that briefly surfaced on anonymous social forums. Concurrently, Tier-1 cloud hyperscalers expanded forward procurement contracts by $14.2B.",
    category: "Tech & AI Scandals",
    symbol: "NVDA",
    secondarySymbols: ["MSFT", "AMD"],
    action: "BUY",
    currentPrice: 187.40,
    targetPrice: 215.00,
    invalidationStop: 174.50,
    confidence: 94,
    impactPct: 8.4,
    catalystWindow: "Next 48 Hours",
    source: "Terminal Wire (TOP)",
    timestampOffsetMinutes: 1,
    deskRationale: "Frivolous rumor-induced dips represent institutional accumulation anomalies when operating fundamentals and capex backlogs remain bulletproof."
  },
  {
    id: "gn-2",
    headline: "Taiwan Strait Maritime Corridor Re-Opened After Unannounced Naval Drills; Semiconductor Shipping Insurance Normalized",
    summary: "Maritime authorities lifted precautionary naval transit advisories across the northern shipping corridor. Lloyd's of London underwriters rescinded temporary war-risk insurance surcharges on advanced silicon wafer transport.",
    category: "Geopolitics & Defense",
    symbol: "TSM",
    secondarySymbols: ["NVDA", "AAPL"],
    action: "ACCUMULATE",
    currentPrice: 198.50,
    targetPrice: 228.00,
    invalidationStop: 186.20,
    confidence: 88,
    impactPct: 5.2,
    catalystWindow: "1-3 Sessions",
    source: "Reuters Priority Wire",
    timestampOffsetMinutes: 2,
    deskRationale: "De-escalation of maritime transit risk restores delivery continuity for leading-edge 3nm and 2nm foundry wafer runs."
  },
  {
    id: "gn-3",
    headline: "Federal Reserve Emergency Discount Window Liquidity Injection Leaked to Primary Dealers",
    summary: "Unscheduled repo facility volume surged past $45B as European banking counterparties accessed US dollar swap lines following sovereign bond volatility. Gold and digital store-of-value assets reacted with immediate safe-haven bid.",
    category: "Macro & Central Banks",
    symbol: "BTC",
    secondarySymbols: ["XAU", "ETH"],
    action: "BUY",
    currentPrice: 94250.00,
    targetPrice: 108000.00,
    invalidationStop: 88600.00,
    confidence: 92,
    impactPct: 11.2,
    catalystWindow: "Intraday Surge",
    source: "WSJ Dow Jones Newswires",
    timestampOffsetMinutes: 3,
    deskRationale: "Central bank balance sheet liquidity expansion mechanically triggers hard monetary asset revaluation."
  },
  {
    id: "gn-4",
    headline: "Tesla Autonomous FSD v13 Unsupervised Safety Certification Approved in 7 US Metropolitan Jurisdictions",
    summary: "Department of Transportation regulators issued initial commercial autonomous ride-hailing permits across Arizona, Texas, Nevada, and Florida, triggering an emergency short squeeze among auto-sector equity bears.",
    category: "Executive Boardroom & M&A",
    symbol: "TSLA",
    secondarySymbols: ["UBER"],
    action: "BUY",
    currentPrice: 342.15,
    targetPrice: 410.00,
    invalidationStop: 318.00,
    confidence: 89,
    impactPct: 14.8,
    catalystWindow: "Next 5 Sessions",
    source: "Terminal Wire (FIRST)",
    timestampOffsetMinutes: 4,
    deskRationale: "Shift from vehicle manufacturer multiple (15x P/E) to high-margin autonomous software recurring take rate (>40x multiple expansion)."
  },
  {
    id: "gn-5",
    headline: "US Department of Defense Selects Palantir for Classified $840M Multi-Domain Project Maven Autonomous Warfare Contract",
    summary: "The Pentagon announced an unannounced sole-source contract award for AI battlefield sensor integration, directing all combatant commands to standardize on Palantir's AIP and Gotham operational architecture.",
    category: "Geopolitics & Defense",
    symbol: "PLTR",
    secondarySymbols: ["LMT", "RTX"],
    action: "BUY",
    currentPrice: 68.40,
    targetPrice: 82.50,
    invalidationStop: 61.80,
    confidence: 91,
    impactPct: 9.6,
    catalystWindow: "Intraday & Weekly",
    source: "Defense Daily Wire",
    timestampOffsetMinutes: 5,
    deskRationale: "Sole-source Pentagon defense awards create multi-year non-cancellable revenue streams and validate institutional moat."
  },
  {
    id: "gn-6",
    headline: "Alphabet DeepMind Announces Breakthrough Fault-Tolerant Quantum Processor; Legacy RSA Encryption Transition Mandate Issued",
    summary: "Google researchers demonstrated 1,000 logical error-corrected qubits, prompting the National Institute of Standards and Technology (NIST) to issue an emergency post-quantum cryptographic upgrade requirement for federal databases.",
    category: "Tech & AI Scandals",
    symbol: "GOOGL",
    secondarySymbols: ["CRWD", "PANW"],
    action: "BUY",
    currentPrice: 182.30,
    targetPrice: 212.00,
    invalidationStop: 169.50,
    confidence: 87,
    impactPct: 6.8,
    catalystWindow: "1-2 Weeks",
    source: "Financial Times Tech Alert",
    timestampOffsetMinutes: 6,
    deskRationale: "DeepMind quantum superiority establishes sovereign-level strategic moat over merchant cloud competitors."
  },
  {
    id: "gn-7",
    headline: "Solana pump.fun Bonding Curve Upgrade Activates 50% Protocol Fee Burn; Daily Burn Reaches 12,000 SOL",
    summary: "A consensus governance upgrade to the decentralized token factory protocol began mechanically converting 50% of all creator transaction fees into direct market buybacks of SOL and ecosystem liquidity stakes.",
    category: "Speculative & Meme Alpha",
    symbol: "SOL",
    secondarySymbols: ["BONK", "POPCAT"],
    action: "BUY",
    currentPrice: 224.80,
    targetPrice: 275.00,
    invalidationStop: 204.00,
    confidence: 86,
    impactPct: 12.4,
    catalystWindow: "Intraday Momentum",
    source: "CoinDesk Terminal",
    timestampOffsetMinutes: 7,
    deskRationale: "Direct organic protocol fee burn creates constant structural demand float deficit on centralized exchanges."
  },
  {
    id: "gn-8",
    headline: "Apple Inks Strategic Search & Siri Gemini Multi-Modal Model Integration Agreement; Terms Disclosed at $4.5B Annually",
    summary: "Regulatory filings submitted in Luxembourg confirmed Apple will integrate Gemini Advanced directly into iOS 19 Siri infrastructure across 1.4B active iPhones, preserving hardware gross margins without dilutive model training capex.",
    category: "Executive Boardroom & M&A",
    symbol: "AAPL",
    secondarySymbols: ["GOOGL"],
    action: "ACCUMULATE",
    currentPrice: 264.10,
    targetPrice: 295.00,
    invalidationStop: 248.00,
    confidence: 90,
    impactPct: 4.8,
    catalystWindow: "Medium Horizon",
    source: "Institutional Desk (DEAL)",
    timestampOffsetMinutes: 8,
    deskRationale: "Apple secures enterprise-grade conversational AI without spending $50B in capital expenditure on high-depreciation GPU farms."
  },
  {
    id: "gn-9",
    headline: "Intel Foundry Division Faces Multi-Quarter Delay on 18A Node; Anchor Hyperscaler Cancels Advance Wafers",
    summary: "A leaked internal memo confirmed that defect density on test wafers remains three times above commercial volume threshold. Major customers reportedly redirected sub-2nm orders back to TSMC.",
    category: "Tech & AI Scandals",
    symbol: "INTC",
    secondarySymbols: ["TSM"],
    action: "AVOID",
    currentPrice: 23.40,
    targetPrice: 17.50,
    invalidationStop: 25.80,
    confidence: 95,
    impactPct: -14.2,
    catalystWindow: "Multi-Session Bleed",
    source: "Financial Wire Scoop",
    timestampOffsetMinutes: 9,
    deskRationale: "Yield delays in advanced nodes trigger terminal customer flight and massive multi-billion asset impairment write-offs."
  },
  {
    id: "gn-10",
    headline: "Saudi Aramco & PIF Announce $35B Clean Nuclear-Powered Data Center Campus for AI Compute Sovereignty",
    summary: "The Kingdom confirmed construction of a 3-gigawatt dedicated high-performance computing facility powered by modular reactors and solar baseload, issuing initial hardware purchase letters of intent.",
    category: "Geopolitics & Defense",
    symbol: "CEG",
    secondarySymbols: ["NVDA", "VST"],
    action: "BUY",
    currentPrice: 278.40,
    targetPrice: 330.00,
    invalidationStop: 252.00,
    confidence: 91,
    impactPct: 8.9,
    catalystWindow: "1-3 Weeks",
    source: "Global Energy Wire",
    timestampOffsetMinutes: 10,
    deskRationale: "Sovereign compute demand accelerates clean nuclear off-take valuations to multi-decade record premiums."
  },
  {
    id: "gn-11",
    headline: "Coinbase Derivative Volume Crosses $250B Monthly Threshold Following US Institutional Clearinghouse License Approval",
    summary: "The Commodity Futures Trading Commission (CFTC) granted full designated contract market clearing approval to Coinbase Financial Markets, unlocking institutional pension fund margin collateral.",
    category: "Crypto & Layer-1",
    symbol: "COIN",
    secondarySymbols: ["BTC"],
    action: "BUY",
    currentPrice: 318.50,
    targetPrice: 385.00,
    invalidationStop: 288.00,
    confidence: 88,
    impactPct: 10.5,
    catalystWindow: "Weekly Horizon",
    source: "SEC / CFTC Gazette",
    timestampOffsetMinutes: 11,
    deskRationale: "Institutional derivatives clearing expansion generates high-margin recurring fee revenue detached from retail churn."
  },
  {
    id: "gn-12",
    headline: "OPEC+ Unexpectedly Adjourns Ministerial Quota Meeting Without Agreement; US Crude Inventory Surplus Reaches 6-Month High",
    summary: "Internal squabbling over African member baseline quotas led ministers to end sessions prematurely, raising the likelihood of uncontrolled output surges. WTI front-month crude plunged below $68/bbl.",
    category: "Macro & Central Banks",
    symbol: "XOM",
    secondarySymbols: ["CVX"],
    action: "TRIM",
    currentPrice: 118.40,
    targetPrice: 104.00,
    invalidationStop: 122.50,
    confidence: 85,
    impactPct: -5.8,
    catalystWindow: "1-2 Sessions",
    source: "Commodities Intelligence Wire",
    timestampOffsetMinutes: 12,
    deskRationale: "OPEC quota discipline breakdown risks price-war supply overhang into global industrial manufacturing slowdown."
  },
  {
    id: "gn-13",
    headline: "Fartcoin & Viral AI Agent Meme Tokens Face Heavy Smart-Money Take-Profit; Liquidity Concentrating into Doge & SPX6900",
    summary: "On-chain analytics track $45M in whale wallet redemptions from sub-$50M market cap experimental tokens, rotating back into primary liquidity pools on Binance and Bybit spot markets.",
    category: "Speculative & Meme Alpha",
    symbol: "DOGE",
    secondarySymbols: ["PEPE", "WIF"],
    action: "ACCUMULATE",
    currentPrice: 0.395,
    targetPrice: 0.520,
    invalidationStop: 0.338,
    confidence: 82,
    impactPct: 15.6,
    catalystWindow: "Intraday Rotate",
    source: "Nansen Smart Money Radar",
    timestampOffsetMinutes: 13,
    deskRationale: "Speculative rotation flows naturally from high-risk tail illiquidity toward Tier-1 meme liquidity anchors."
  },
  {
    id: "gn-14",
    headline: "Super Micro Computer (SMCI) Completes Independent Special Audit with Clean Certification; Nasdaq Compliance Restored",
    summary: "The special committee concluded that prior financial restatements required zero adjustment to reported gross revenue or cash balances. BDO USA verified full control independence.",
    category: "Executive Boardroom & M&A",
    symbol: "SMCI",
    secondarySymbols: ["NVDA"],
    action: "BUY",
    currentPrice: 42.80,
    targetPrice: 65.00,
    invalidationStop: 34.00,
    confidence: 86,
    impactPct: 28.5,
    catalystWindow: "Immediate Squeeze",
    source: "SEC Form 8-K Notice",
    timestampOffsetMinutes: 14,
    deskRationale: "Removal of delisting threat unleashes violent short squeeze on an asset priced for bankruptcy."
  },
  {
    id: "gn-15",
    headline: "European Central Bank Signals Acceleration of 50 bps Deposit Rate Cut Following German Manufacturing Contraction",
    summary: "Eurozone PMI prints dropped to 42.1, forcing ECB governing council members to openly discuss front-loaded easing to prevent systemic corporate insolvency across Rhineland export giants.",
    category: "Macro & Central Banks",
    symbol: "XAU",
    secondarySymbols: ["EURUSD"],
    action: "BUY",
    currentPrice: 2680.00,
    targetPrice: 2850.00,
    invalidationStop: 2590.00,
    confidence: 93,
    impactPct: 4.8,
    catalystWindow: "Macro Trend",
    source: "Frankfurt Central Bank Desk",
    timestampOffsetMinutes: 15,
    deskRationale: "European currency debasement accelerates global sovereign and retail capital flight into physical bullion."
  },
  {
    id: "gn-16",
    headline: "Amazon AWS Secures $8B Multi-Tenant Healthcare AI Cloud Consolidation Mandate",
    summary: "UnitedHealth, Elevance, and Kaiser Permanente formed an infrastructure syndicate to migrate unified clinical records onto Amazon Bedrock and Anthropic Claude 3.5 enterprise VPC instances.",
    category: "Tech & AI Scandals",
    symbol: "AMZN",
    secondarySymbols: ["MSFT", "GOOGL"],
    action: "BUY",
    currentPrice: 218.40,
    targetPrice: 250.00,
    invalidationStop: 202.00,
    confidence: 90,
    impactPct: 7.2,
    catalystWindow: "Weekly Horizon",
    source: "Reuters Healthcare Bureau",
    timestampOffsetMinutes: 16,
    deskRationale: "Clinical healthcare migrations represent sticky, multi-decade cloud tenancy with minimal price sensitivity."
  },
  {
    id: "gn-17",
    headline: "Boeing Concludes New Labor Agreement with 38% Wage Increase; Commercial Jet Delivery Timetable Stabilized",
    summary: "Machinists voted 59% in favor of ratified contract terms, ending the 7-week Puget Sound strike. Factory shifts resumed for 737 MAX assembly with supply chain deliveries re-sequenced.",
    category: "Executive Boardroom & M&A",
    symbol: "BA",
    secondarySymbols: ["SPR"],
    action: "HOLD",
    currentPrice: 168.40,
    targetPrice: 185.00,
    invalidationStop: 154.00,
    confidence: 76,
    impactPct: 3.4,
    catalystWindow: "Consolidation",
    source: "Aerospace & Defense Wire",
    timestampOffsetMinutes: 17,
    deskRationale: "Strike resolution removes tail catastrophe risk, but elevated wage base compresses operating cash flow margins."
  },
  {
    id: "gn-18",
    headline: "Ethereum Foundation Unveils Pectra Upgrade Mainnet Activation Schedule for Q1 2027",
    summary: "Core developers finalized EIP-7702 account abstraction and validator staking maximum balance increase to 2,048 ETH, dramatically lowering layer-2 settlement latency and institutional staking overhead.",
    category: "Crypto & Layer-1",
    symbol: "ETH",
    secondarySymbols: ["ARB", "OP"],
    action: "ACCUMULATE",
    currentPrice: 3420.00,
    targetPrice: 4200.00,
    invalidationStop: 3080.00,
    confidence: 84,
    impactPct: 9.8,
    catalystWindow: "Multi-Week Accumulate",
    source: "Ethereum Core Dev Wire",
    timestampOffsetMinutes: 18,
    deskRationale: "Validator staking efficiency enhancements encourage corporate treasury staking yields."
  },
  {
    id: "gn-19",
    headline: "Advanced Micro Devices (AMD) MI350X Accelerator Benchmarks Surpass Prior Generations in Inference Workloads",
    summary: "Independent MLPerf testing verified that AMD's new CDNA 4 architecture achieves 1.25x price-performance ratio against competitors on open-source Llama 3 models, driving Tier-2 cloud win announcements.",
    category: "Tech & AI Scandals",
    symbol: "AMD",
    secondarySymbols: ["NVDA"],
    action: "BUY",
    currentPrice: 164.20,
    targetPrice: 198.00,
    invalidationStop: 148.50,
    confidence: 86,
    impactPct: 8.5,
    catalystWindow: "1-3 Sessions",
    source: "SemiAnalysis Technical Report",
    timestampOffsetMinutes: 19,
    deskRationale: "Inference market segment is doubling in size and price elasticity makes AMD a viable secondary dual-source supplier."
  },
  {
    id: "gn-20",
    headline: "JPMorgan Chase Reports Record Net Interest Income; Corporate Loan Book Quality Exceeds Stress Test Bounds",
    summary: "Jamie Dimon announced strong commercial banking results, citing robust middle-market corporate credit demand and zero contagion from commercial real estate office refinancing rounds.",
    category: "Executive Boardroom & M&A",
    symbol: "JPM",
    secondarySymbols: ["WFC", "BAC"],
    action: "ACCUMULATE",
    currentPrice: 238.10,
    targetPrice: 265.00,
    invalidationStop: 221.00,
    confidence: 91,
    impactPct: 4.2,
    catalystWindow: "Steady Trend",
    source: "Institutional Financials Wire",
    timestampOffsetMinutes: 20,
    deskRationale: "Fortress balance sheet bank stocks continue to compound through higher-for-longer interest rate environments."
  },
  // Items 21-100 will populate full coverage across all remaining tickers and scenarios
  ...Array.from({ length: 80 }).map((_, idx) => {
    const i = idx + 21;
    const scenarios: Array<{
      headline: string;
      summary: string;
      category: NewsCategory;
      symbol: string;
      action: NewsAction;
      price: number;
      target: number;
      stop: number;
      confidence: number;
      impact: number;
      source: string;
      rationale: string;
    }> = [
      {
        headline: "US Department of Commerce Expands High-Bandwidth Memory (HBM) Export Restrictions to Third-Party Hubs",
        summary: "New export compliance mandates require end-use verification for advanced memory modules passing through Singapore, Malaysia, and UAE transshipment hubs.",
        category: "Geopolitics & Defense",
        symbol: "MU",
        action: "TRIM",
        price: 114.20,
        target: 98.00,
        stop: 121.50,
        confidence: 84,
        impact: -6.4,
        source: "Institutional Trade Desk",
        rationale: "Supply chain compliance friction delays secondary international shipments."
      },
      {
        headline: "Microsoft Copilot Enterprise Daily Active Users Surge 140% Following Excel & Teams Workflow Automation Update",
        summary: "Satya Nadella reported accelerated enterprise seat conversions as Fortune 500 financial modeling workflows achieved 8-hour weekly time savings.",
        category: "Tech & AI Scandals",
        symbol: "MSFT",
        action: "BUY",
        price: 512.80,
        target: 575.00,
        stop: 485.00,
        confidence: 92,
        impact: 6.9,
        source: "WSJ Technology Dispatch",
        rationale: "Proven productivity ROI overcomes CIO budget skepticism and cements enterprise ARPU."
      },
      {
        headline: "Lockheed Martin Wins $4.2B International F-35 Joint Strike Fighter Modernization Package",
        summary: "Allied defense ministries in Eastern Europe and Indo-Pacific approved multi-year fighter airframe fleet readiness overhauls with domestic co-production offsets.",
        category: "Geopolitics & Defense",
        symbol: "LMT",
        action: "BUY",
        price: 584.50,
        target: 645.00,
        stop: 550.00,
        confidence: 89,
        impact: 5.4,
        source: "Reuters Defense",
        rationale: "Geopolitical NATO procurement commitments ensure high-visibility backlogs."
      },
      {
        headline: "Base Layer-2 Network Daily Transaction Count Reaches All-Time High; DeFi TVL Surpasses $4.5B",
        summary: "Institutional stablecoin settlements and viral consumer on-chain games generated over 9 million daily transactions on Coinbase's rollup network.",
        category: "Crypto & Layer-1",
        symbol: "COIN",
        action: "BUY",
        price: 318.50,
        target: 380.00,
        stop: 292.00,
        confidence: 87,
        impact: 8.8,
        source: "Dune Analytics / CoinDesk",
        rationale: "Sequencer revenue accrual directly drops into Coinbase corporate adjusted EBITDA."
      },
      {
        headline: "Pepe & Dogwifcoin Break Key Technical Resistance Levels on Binance Spot Orderbook Absorption",
        summary: "Bids above $0.000021 absorbed all trailing sell walls as speculative retail open interest hit a three-month relative high.",
        category: "Speculative & Meme Alpha",
        symbol: "PEPE",
        action: "ACCUMULATE",
        price: 0.0000224,
        target: 0.0000310,
        stop: 0.0000185,
        confidence: 80,
        impact: 18.2,
        source: "Binance Liquidity Heatmap",
        rationale: "Breakout through structural orderbook ceilings triggers algorithmic momentum sweeps."
      },
      {
        headline: "Eli Lilly (LLY) Oral Obesity Drug Trial Demonstrates 18.5% Weight Loss Without Muscle Mass Depletion",
        summary: "Phase III oral GLP-1/GIP small-molecule data confirmed superior patient retention and manufacturing cost 80% below injectable peptide alternatives.",
        category: "Executive Boardroom & M&A",
        symbol: "LLY",
        action: "BUY",
        price: 945.00,
        target: 1100.00,
        stop: 885.00,
        confidence: 93,
        impact: 11.4,
        source: "BioWorld Clinical Alert",
        rationale: "Oral formulation unlocks mass consumer scale and bypasses sterile syringe manufacturing constraints."
      },
      {
        headline: "US 10-Year Treasury Yield Drops Below 4.15% as Core PCE Inflation Print Matches Target Exactly at 2.6%",
        summary: "Bond market price action reflected rapid discounting of three consecutive 25 bps rate cuts into early 2027.",
        category: "Macro & Central Banks",
        symbol: "QQQ",
        action: "BUY",
        price: 518.20,
        target: 560.00,
        stop: 495.00,
        confidence: 90,
        impact: 4.8,
        source: "Rates & Macro Monitor",
        rationale: "Falling long-term real discount rates expand forward equity multiples across long-duration growth tech."
      },
      {
        headline: "CrowdStrike Global IT Resiliency Architecture Certified by Independent Cyber Defense Coalition",
        summary: "Six months post-incident, over 99.4% of enterprise clients renewed multi-year Falcon Falcon platform contracts with single-pane security telemetry.",
        category: "Tech & AI Scandals",
        symbol: "CRWD",
        action: "BUY",
        price: 365.80,
        target: 420.00,
        stop: 338.00,
        confidence: 88,
        impact: 7.6,
        source: "Gartner Cyber Quadrant",
        rationale: "Net revenue retention proves enterprise switching friction was too high for competitive defectors."
      }
    ];

    const pick = scenarios[(i - 21) % scenarios.length];
    return {
      id: `gn-${i}`,
      headline: `${pick.headline} [Bulletin #${i}]`,
      summary: pick.summary,
      category: pick.category,
      symbol: pick.symbol,
      action: pick.action,
      currentPrice: pick.price,
      targetPrice: pick.target,
      invalidationStop: pick.stop,
      confidence: Math.max(75, Math.min(97, pick.confidence + ((i * 3) % 7) - 3)),
      impactPct: Number((pick.impact * (1 + ((i % 5) - 2) * 0.08)).toFixed(1)),
      catalystWindow: i % 2 === 0 ? "Next 24 Hours" : "2-5 Trading Sessions",
      source: pick.source,
      timestampOffsetMinutes: i,
      deskRationale: pick.rationale,
    };
  }),
];
