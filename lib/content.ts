export type Block =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] };

export type Article = {
  slug: string;
  title: string;
  dek: string;
  category?: "markets" | "crypto" | "meme";
  author: string;
  role: string;
  date: string;
  readMinutes: number;
  tags: string[];
  premium: boolean;
  tickers: string[];
  body: Block[];
};

import { RESEARCH_DECKS_70, DECKS_BY_CATEGORY, DECK_BY_SLUG, type ResearchDeck } from "./research-decks-70";
export { RESEARCH_DECKS_70, DECKS_BY_CATEGORY, DECK_BY_SLUG };
export type { ResearchDeck };

export const ARTICLES: Article[] = RESEARCH_DECKS_70;
export const ARTICLE_BY_SLUG: Record<string, Article> = DECK_BY_SLUG;

export type Lesson = {
  title: string;
  minutes: number;
  summary: string;
  points: string[];
};

export type Course = {
  slug: string;
  title: string;
  level: "Foundation" | "Intermediate" | "Advanced";
  instructor: string;
  instructorRole: string;
  summary: string;
  lessons: Lesson[];
  outcomes: string[];
};

export const COURSES: Course[] = [
  {
    slug: "reading-trends",
    title: "Reading a Trend: From Structure to Signal",
    level: "Foundation",
    instructor: "Daniel Okafor",
    instructorRole: "Head of Equity Strategy",
    summary:
      "The four-course foundation of the NextWall Street method. Learn to read structure with moving averages, momentum with rate of change, and conviction with volatility — then combine them into a single score you can defend.",
    outcomes: [
      "Build a repeatable trend classification instead of a gut feeling",
      "Understand why the 200-day is a regime filter, not a signal",
      "Read RSI and momentum without the common misinterpretations",
      "Combine indicators into one score with explicit weights",
    ],
    lessons: [
      {
        title: "Structure before signals",
        minutes: 11,
        summary:
          "A trend is a sequence of higher highs and higher lows until it is not. Defining structure first prevents you from arguing with the tape.",
        points: [
          "Mark the last three swing highs and lows before looking at any indicator.",
          "A trend is intact until a prior swing low breaks on a closing basis.",
          "Indicators confirm structure; they never replace it.",
        ],
      },
      {
        title: "The 200-day as a regime filter",
        minutes: 14,
        summary:
          "The 200-day average is a blunt instrument used badly by most retail traders. Used as a regime switch rather than a crossover signal, it removes the majority of catastrophic entries.",
        points: [
          "Above a rising 200-day: trade long bias, ignore short signals.",
          "Below a falling 200-day: rallies are counter-trend until proven otherwise.",
          "Flat 200-day means no regime — reduce size and wait.",
        ],
      },
      {
        title: "Momentum: rate of change over RSI",
        minutes: 13,
        summary:
          "RSI tells you how stretched price is, not where it is going. Rate of change tells you the direction and the speed. Use them together or not at all.",
        points: [
          "RSI above 70 is not a sell signal in a strong trend; it is a strength signal.",
          "Divergence matters only at extremes, and only with structure confirmation.",
          "Rate of change over 30 sessions is the most predictive single input in our model.",
        ],
      },
      {
        title: "Building one score you can defend",
        minutes: 16,
        summary:
          "A weighted composite beats five indicators giving contradictory advice. Here is the exact weighting we use and why each component earns its place.",
        points: [
          "Short-term positioning, medium-term trend, long-term regime — one weight each.",
          "Momentum gets the largest single weight because it leads.",
          "Any score must come with an invalidation level, or it is just an opinion.",
        ],
      },
    ],
  },
  {
    slug: "crypto-without-hype",
    title: "Crypto Without the Hype",
    level: "Intermediate",
    instructor: "Mara Lindqvist",
    instructorRole: "Digital Assets Strategist",
    summary:
      "A framework for allocating to digital assets when there are no cash flows to discount. Macro liquidity, on-chain flow and volatility sizing replace the story-telling that dominates crypto commentary.",
    outcomes: [
      "Map crypto exposure to liquidity conditions rather than narratives",
      "Read on-chain flow and float dynamics",
      "Size positions using realised volatility",
      "Separate protocol value from token value",
    ],
    lessons: [
      {
        title: "Liquidity is the only macro variable that matters",
        minutes: 12,
        summary:
          "Real yields and the dollar drive the marginal dollar's position on the risk curve. Crypto sits at the far end of it.",
        points: [
          "Falling real yields historically coincide with crypto expansion.",
          "Dollar strength is the most reliable headwind for the sector.",
          "Position for the regime, not for the halving calendar.",
        ],
      },
      {
        title: "Flows, float and market structure",
        minutes: 15,
        summary:
          "Who is buying, how much of the supply is actually available, and where the leverage sits. This is the entire fundamental case for most digital assets.",
        points: [
          "Spot vehicle flows are price-insensitive buyers at the margin.",
          "Float, not total supply, determines how fast price moves.",
          "Funding rates tell you who is crowded before the liquidation does.",
        ],
      },
      {
        title: "Sizing a 3x-volatility asset",
        minutes: 10,
        summary:
          "The maths of allocating to something that routinely draws down 40% without ending your portfolio.",
        points: [
          "Size to a risk contribution, not a dollar amount.",
          "Assume a 40% drawdown is normal and survive it without selling.",
          "Rebalance mechanically — conviction fails at extremes.",
        ],
      },
    ],
  },
  {
    slug: "meme-coin-risk",
    title: "Meme Coins: The Risk Module",
    level: "Advanced",
    instructor: "Daniel Okafor",
    instructorRole: "Head of Equity Strategy",
    summary:
      "Not a recommendation engine — a risk protocol. If you are going to participate in attention markets, the only defensible edge is sizing, exit discipline and honest labelling of what you own.",
    outcomes: [
      "Score a meme asset on concentration, depth and narrative decay",
      "Apply hard portfolio caps and mechanical profit-taking",
      "Recognise the distribution phase before it completes",
    ],
    lessons: [
      {
        title: "Three variables, no fundamentals",
        minutes: 12,
        summary:
          "Concentration, order-book depth and narrative half-life. Everything else is marketing.",
        points: [
          "Top-100 wallet concentration above 40% means the exit is narrow.",
          "Depth determines slippage; check it before, not after.",
          "Narrative half-life shortens as a sector matures.",
        ],
      },
      {
        title: "The distribution phase",
        minutes: 11,
        summary:
          "Volume diverging from price while the crowd celebrates is the most reliable warning in this sector.",
        points: [
          "Rising price on falling volume is a liquidity warning, not strength.",
          "Social volume peaks before price peaks, almost always.",
          "Take partials mechanically; nobody sells the top on purpose.",
        ],
      },
    ],
  },
  {
    slug: "portfolio-construction",
    title: "Portfolio Construction for Retail and Institutional",
    level: "Advanced",
    instructor: "Priya Raghunathan",
    instructorRole: "Software Analyst",
    summary:
      "From a list of good ideas to a portfolio that survives. Correlation clusters, risk budgets, rebalancing rules and the reporting discipline that keeps behaviour honest.",
    outcomes: [
      "Group holdings into risk clusters instead of sectors",
      "Set and enforce a risk budget across equities, crypto and cash",
      "Design a rebalancing rule you will actually follow",
    ],
    lessons: [
      {
        title: "Correlation clusters, not sectors",
        minutes: 13,
        summary:
          "Six AI names are one position. Building clusters prevents the illusion of diversification that blows up in a single-factor drawdown.",
        points: [
          "Group by the factor that actually drives returns.",
          "Cap total exposure per cluster, not per ticker.",
          "Review cluster weights after every large move.",
        ],
      },
      {
        title: "The risk budget",
        minutes: 14,
        summary:
          "Decide how much of your total risk goes to equities, crypto and cash before you pick a single name.",
        points: [
          "Risk contribution, not capital allocation, is the real constraint.",
          "High-volatility sleeves need proportionally smaller notional.",
          "Cash is a position with an expected return and a volatility of zero.",
        ],
      },
      {
        title: "Rebalancing you will actually do",
        minutes: 9,
        summary:
          "Calendar plus threshold beats pure optimisation. Simplicity is what makes a rule survive a drawdown.",
        points: [
          "Quarterly review with a 25% drift trigger.",
          "Rebalance into strength, never into a broken thesis.",
          "Write the rule down before you need it.",
        ],
      },
    ],
  },
];

export const COURSE_BY_SLUG: Record<string, Course> = Object.fromEntries(
  COURSES.map((c) => [c.slug, c]),
);

export const PLANS = [
  {
    id: "reader",
    name: "Reader",
    price: 0,
    cadence: "Free forever",
    tagline: "For learning the framework.",
    features: [
      "Daily trend scores across 26 tracked assets",
      "Two free research pieces per month",
      "Foundation course: Reading a Trend",
      "Weekly market pulse newsletter",
    ],
    cta: "Start free",
    highlight: false,
  },
  {
    id: "premium",
    name: "Lifetime Premium",
    price: 2497,
    cadence: "one-time payment",
    tagline: "One payment. Lifetime access.",
    features: [
      "Every research piece, uncut",
      "Stance, conviction and invalidation level on every asset",
      "Full crypto and meme-coin coverage with risk grading",
      "All four Academy courses",
      "Watchlist with score-change alerts",
      "Model portfolios: core, tactical, digital assets",
      "No recurring charges or renewal",
    ],
    cta: "Buy lifetime access",
    highlight: true,
  },
];
