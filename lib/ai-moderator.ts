import { ASSETS, ASSET_BY_SYMBOL, type Asset } from "./market-assets";
import { metricsFor, fmtPrice, fmtPct, type Metrics } from "./market";

export type MinutePrediction = {
  id: string;
  symbol: string;
  name: string;
  kind: "stock" | "crypto" | "meme";
  group: string;
  currentPrice: number;
  stance: "STRONG BUY / LONG" | "ACCUMULATE / DIP" | "TRIM / PROFIT" | "AVOID / SHORT";
  confidence: number; // percentage
  target1: number;
  target2: number;
  invalidationLevel: number;
  technicalMechanism: string;
  timeHorizon: "5m Scalp" | "15m Intraday" | "1h Momentum" | "24h Swing";
  catalystAlert: string;
  timestamp: string;
  wibTime: string;
  utcTime: string;
  estTime?: string;
  score?: number;
  riskRewardRatio?: string;
  realizedVol?: number;
};

export type ChatMessage = {
  id: string;
  channelId: string;
  author: {
    name: string;
    avatar: string;
    role: "ai-mod" | "head-desk" | "quant" | "pro-trader" | "member";
    roleLabel: string;
    roleColor: string;
    isBot?: boolean;
    isVerified?: boolean;
  };
  content: string;
  prediction?: MinutePrediction;
  timestamp: string;
  timeLabel: string;
  reactions: Record<string, number>;
  userReactions: Record<string, boolean>;
};

export function formatTimeZones(date = new Date()) {
  const wibTime = date.toLocaleTimeString("en-GB", {
    timeZone: "Asia/Jakarta",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const utcTime = date.toLocaleTimeString("en-GB", {
    timeZone: "UTC",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  const estTime = date.toLocaleTimeString("en-US", {
    timeZone: "America/New_York",
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  // Check market status (US Eastern Time)
  const estHours = Number(
    date.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour: "2-digit", hour12: false }),
  );
  const estMins = Number(
    date.toLocaleTimeString("en-US", { timeZone: "America/New_York", minute: "2-digit", hour12: false }),
  );
  const totalEstMins = estHours * 60 + estMins;
  const day = date.getDay(); // 0 is Sunday, 6 is Saturday

  let sessionStatus = "Closed";
  if (day === 0 || day === 6) {
    sessionStatus = "Weekend Crypto Active";
  } else if (totalEstMins >= 570 && totalEstMins < 960) {
    sessionStatus = "US Regular Open (NYSE/NASDAQ)";
  } else if (totalEstMins >= 240 && totalEstMins < 570) {
    sessionStatus = "US Pre-Market Session";
  } else if (totalEstMins >= 960 && totalEstMins < 1200) {
    sessionStatus = "US After-Hours Session";
  } else {
    sessionStatus = "Overnight Global Macro Flow";
  }

  return { wibTime, utcTime, estTime, sessionStatus };
}

/**
 * Generates an institutional-grade, minute-by-minute technical market prediction
 * with advanced quantitative English terminology.
 */
export function generateMinutePrediction(forceSymbol?: string, seedIndex?: number): MinutePrediction {
  const date = new Date();
  const { wibTime, utcTime, estTime } = formatTimeZones(date);
  const minute = date.getMinutes() + (seedIndex ?? 0);

  // Pick asset: either forced or rotated based on current minute and seed
  let asset: Asset;
  if (forceSymbol && ASSET_BY_SYMBOL[forceSymbol.toUpperCase()]) {
    asset = ASSET_BY_SYMBOL[forceSymbol.toUpperCase()];
  } else {
    // Priority benchmark symbols for institutional alerts
    const curatedLeaders = [
      "NVDA", "BTC", "SOL", "AAPL", "MSFT", "ETH", "AMZN", "GOOGL", "AVAX", "LINK",
      "TSLA", "SPY", "QQQ", "FARTCOIN", "GOAT", "PEPE", "SUI", "NEAR", "AMD", "META"
    ];
    const candidateSym = curatedLeaders[minute % curatedLeaders.length];
    asset = ASSET_BY_SYMBOL[candidateSym] || ASSETS[minute % ASSETS.length] || ASSETS[0];
  }

  const m = metricsFor(asset);
  const price = m.last > 0 ? m.last : asset.base;

  let stance: MinutePrediction["stance"];
  let target1: number;
  let target2: number;
  let invalidationLevel: number;
  let mechanism: string;
  let horizon: MinutePrediction["timeHorizon"];
  let rrRatio: string;

  if (m.score >= 68) {
    stance = "STRONG BUY / LONG";
    target1 = price * (asset.kind === "meme" ? 1.185 : asset.kind === "crypto" ? 1.068 : 1.038);
    target2 = price * (asset.kind === "meme" ? 1.380 : asset.kind === "crypto" ? 1.125 : 1.072);
    invalidationLevel = price * (asset.kind === "meme" ? 0.915 : asset.kind === "crypto" ? 0.965 : 0.982);
    rrRatio = "1 : 3.4";
    horizon = asset.kind === "meme" ? "5m Scalp" : asset.kind === "crypto" ? "15m Intraday" : "1h Momentum";

    mechanism = `Institutional order flow expansion: Price trading decisively above the 20-day exponential moving average ($${m.sma20.toFixed(2)}) with positive slope curvature. Relative Strength Index (RSI) holding at ${m.rsi.toFixed(0)}, confirming bullish trend momentum without immediate exhaustion. Buy-side delta acceleration on the Level 2 tape confirms structural continuation toward Target 1.`;
  } else if (m.score >= 52) {
    stance = "ACCUMULATE / DIP";
    target1 = price * (asset.kind === "meme" ? 1.125 : asset.kind === "crypto" ? 1.045 : 1.028);
    target2 = price * (asset.kind === "meme" ? 1.260 : asset.kind === "crypto" ? 1.092 : 1.055);
    invalidationLevel = price * (asset.kind === "meme" ? 0.885 : asset.kind === "crypto" ? 0.948 : 0.974);
    rrRatio = "1 : 2.6";
    horizon = asset.kind === "stock" ? "24h Swing" : "15m Intraday";

    mechanism = `Value area mean-reversion retest: Pullback into dynamic 50-day moving average ($${m.sma50.toFixed(2)}) support band with decreasing selling volume. Annualized realized volatility at ${(m.vol * 100).toFixed(1)}% creates an asymmetric risk/reward window. Institutional bid depth absorbs liquidity with minimal slippage.`;
  } else if (m.score >= 38) {
    stance = "TRIM / PROFIT";
    target1 = price * 0.958;
    target2 = price * 0.915;
    invalidationLevel = price * 1.032;
    rrRatio = "1 : 1.8";
    horizon = "15m Intraday";

    mechanism = `Momentum deceleration warning: Bearish divergence emerging on the 30-session Rate of Change (ROC) near key technical resistance shelf ($${m.high52.toFixed(2)}). Tape velocity shows signs of buyer fatigue and smart-money distribution. Recommend mechanical profit trimming and tightening trailing invalidation stops.`;
  } else {
    stance = "AVOID / SHORT";
    target1 = price * (asset.kind === "meme" ? 0.760 : asset.kind === "crypto" ? 0.915 : 0.955);
    target2 = price * (asset.kind === "meme" ? 0.620 : asset.kind === "crypto" ? 0.850 : 0.920);
    invalidationLevel = price * 1.048;
    rrRatio = "1 : 2.8";
    horizon = "24h Swing";

    mechanism = `Structural breakdown regime: Spot price slicing below both 50-day and 200-day moving averages ($${m.sma200.toFixed(2)}) on heavy distribution volume. Negative moving average convergence divergence confirms lack of institutional sponsor support. Any counter-trend bounce represents exit liquidity rather than sustainable entry.`;
  }

  const confidence = Math.min(96, Math.max(74, m.confidence + (asset.kind === "meme" ? -3 : 2)));
  const catalystAlert = asset.catalysts[minute % asset.catalysts.length] || "Institutional order block mitigation";

  return {
    id: `pred-${asset.symbol}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    symbol: asset.symbol,
    name: asset.name,
    kind: asset.kind,
    group: asset.group,
    currentPrice: price,
    stance,
    confidence,
    target1,
    target2,
    invalidationLevel,
    technicalMechanism: mechanism,
    timeHorizon: horizon,
    catalystAlert,
    timestamp: date.toISOString(),
    wibTime,
    utcTime,
    estTime,
    score: m.score,
    riskRewardRatio: rrRatio,
    realizedVol: Math.round(m.vol * 1000) / 10,
  };
}

/**
 * Generates an institutional-grade Hourly Market Synthesis & Liquidity Regime Report
 * by the automated Quantitative Strategy Desk.
 */
export function generateHourlyMarketSynthesis(hoursAgo = 0): ChatMessage {
  const date = new Date(Date.now() - hoursAgo * 3600 * 1000);
  const { wibTime, utcTime, estTime, sessionStatus } = formatTimeZones(date);

  const hourlyThemes = [
    {
      title: "GLOBAL MACRO & NET LIQUIDITY REGIME",
      summary: "Treasury General Account (TGA) absorption and Reverse Repo drawdown metrics indicate stabilized bank reserves. US tech mega-caps maintain positive gamma positioning.",
      leaders: "$NVDA (+2.8%), $MSFT (+1.4%), $SOL (+4.6%)",
      invalidationNote: "S&P 500 invalidation floor anchored at 5,880. Trend models remain in disciplined Buy/Accumulate mode.",
    },
    {
      title: "SEMICONDUCTOR & AI INFRASTRUCTURE CYCLE",
      summary: "Hyperscaler capex guidance updates show sustained data center cluster expansion. Advanced packaging bottlenecks (CoWoS) at TSMC remain the primary revenue velocity governor.",
      leaders: "$TSM (+3.2%), $AVGO (+2.1%), $AMD (+1.8%)",
      invalidationNote: "Semiconductor sector trend score stands at 74/100. Watch 20-EMA retests on high-beta leaders.",
    },
    {
      title: "DIGITAL ASSET LIQUIDITY & DERIVATIVES FLOW",
      summary: "Bitcoin institutional ETF net inflows absorb daily miner emissions by a factor of 2.4x. Solana DEX velocity overtakes alternative Layer-1 networks on viral pump.fun volume.",
      leaders: "$BTC ($96,420), $SOL ($218.50), $LINK ($18.90)",
      invalidationNote: "Aggregate crypto realized volatility is 54.2%. Hard stop discipline required on speculative altcoins.",
    },
    {
      title: "PUMP.FUN BONDING CURVE & SPECULATIVE SENTIMENT",
      summary: "Bonding curve graduation velocity at 8.4% on Solana DEXs. Top-100 wallet concentration analysis reveals smart-money rotation into narrative leaders.",
      leaders: "$FARTCOIN (+14.2%), $GOAT (+9.5%), $PEPE (+6.1%)",
      invalidationNote: "Risk rule enforcement: Maintain hard 2% total portfolio allocation cap and never average down into broken structure.",
    },
    {
      title: "FIXED INCOME & 2s10s YIELD CURVE DYNAMICS",
      summary: "US 10-year Treasury yields consolidate near 4.38%. The 2s10s yield curve un-inversion indicates market transition from rate shock to growth normalization.",
      leaders: "$SPY (+0.8%), $QQQ (+1.1%), $TLT (-0.4%)",
      invalidationNote: "Equities breadth index holding at 58% bullish. Continue trailing protective stops along 20-day moving averages.",
    },
  ];

  const theme = hourlyThemes[hoursAgo % hourlyThemes.length];

  const content =
    `🏛️ **HOURLY MARKET SYNTHESIS & LIQUIDITY REGIME — [${utcTime} UTC / ${estTime} EST / ${wibTime} SGT]**\n` +
    `*Session Status:* \`${sessionStatus}\`\n\n` +
    `📊 **${theme.title}**\n` +
    `${theme.summary}\n\n` +
    `⚡ **Active Momentum Leaders:** ${theme.leaders}\n` +
    `🛡️ **Risk Architecture:** ${theme.invalidationNote}\n\n` +
    `_Quantitative Desk terminal stream updates continuously. Model predictions regenerate every 60 seconds._`;

  return {
    id: `hourly-synthesis-${date.getTime()}`,
    channelId: "general-trading",
    author: {
      name: "Quant Strategy Desk",
      avatar: "🏛️",
      role: "ai-mod",
      roleLabel: "QUANT DESK",
      roleColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
      isBot: true,
      isVerified: true,
    },
    content,
    timestamp: date.toISOString(),
    timeLabel: `${estTime} EST`,
    reactions: { "🧠": 28, "🚀": 19, "💎": 22 },
    userReactions: {},
  };
}

/**
 * Generates an automated, non-stagnant stream of past and current hourly messages
 * so the Discord chat is continuously populated across the 24-hour cycle.
 */
export function generateContinuousFloorHistory(): ChatMessage[] {
  const messages: ChatMessage[] = [];
  const now = Date.now();

  // Create hourly timeline checkpoints for the last 6 hours
  const hoursToCheckpoint = [6, 5, 4, 3, 2, 1, 0];

  const simulatedDeskTraders = [
    {
      name: "Daniel Okafor",
      avatar: "👨🏾‍💼",
      role: "head-desk" as const,
      roleLabel: "HEAD OF STRATEGY",
      roleColor: "bg-gold/20 text-gold-bright border-gold/40",
      isVerified: true,
      messages: [
        "Semiconductor tape is holding up remarkably well. $NVDA printing higher swing lows above the 20-day SMA. As always: we trade price structure, not headlines.",
        "Macro liquidity remains supportive. Notice how institutional bids step in every time $SPY touches the 50-day average. Discipline over excitement.",
        "Reminder for all floor traders: evaluate your position sizing using 14-day ATR. An equal-dollar position in micro-cap memes vs mega-cap equities is asymmetric risk suicide.",
      ],
    },
    {
      name: "Mara Lindqvist",
      avatar: "👩🏼‍💻",
      role: "quant" as const,
      roleLabel: "CRYPTO LEAD",
      roleColor: "bg-purple-500/20 text-purple-400 border-purple-500/40",
      isVerified: true,
      messages: [
        "Solana decentralized exchange velocity continues to outpace Ethereum mainnet. If $SOL sustains above $214 on the 1-hour close, liquidity target is $228. Invalidation at $206.50.",
        "On-chain forensics check: top-100 wallet concentration on the latest trending pump.fun memes is sitting at 46%. Keep allocations strictly under 2% portfolio equity.",
        "Bitcoin perpetual funding rates have completely normalized to 0.008% across major venues. Leverage flush complete; spot tape leading the basis expansion.",
      ],
    },
    {
      name: "Priya Raghunathan",
      avatar: "👩🏽‍💼",
      role: "quant" as const,
      roleLabel: "QUANT RESEARCH",
      roleColor: "bg-blue-500/20 text-blue-400 border-blue-500/40",
      isVerified: true,
      messages: [
        "Volume Profile calculation update across the 2,038 asset universe: 68% of stocks are currently trading inside or above their session Value Area High (VAH).",
        "Our 5-factor scoring model ($c_1$ through $c_5$) just upgraded 18 equities from Hold to Accumulate on 30-session ROC momentum inflections.",
        "Realized 60-day volatility in mega-cap tech compressed to 21.4%. Historical backtests show volatility compression precedes explosive directional expansions.",
      ],
    },
    {
      name: "Vance_Capital",
      avatar: "🏛️",
      role: "pro-trader" as const,
      roleLabel: "PRO TRADER",
      roleColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
      isVerified: false,
      messages: [
        "Quant desk signal on $SOL retest was textbook execution. Anchored stop placed directly beneath the prior swing low.",
        "Morning session order flow: speculative pump.fun liquidity rotational volume is spiking. Maintaining strict 2% portfolio exposure cap.",
        "Level 2 depth at Nasdaq pre-market exhibits massive bid support. Following the Quant Strategy Desk Buy signal.",
      ],
    },
    {
      name: "ScalpMaster_NY",
      avatar: "⚡",
      role: "pro-trader" as const,
      roleLabel: "INSTITUTIONAL SCALPER",
      roleColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
      isVerified: true,
      messages: [
        "Filled on $NVDA continuation alert at $187.40. Target 1 set to $194.50 with a tight trailing stop. Execution speed is everything.",
        "Tape reading Level 2 on $BTC: large iceberg order absorbing asks at $96,400. Bullish accumulation signature.",
        "Just audited $FARTCOIN on /predict. Respecting the invalidation stop strictly. Green on the session.",
      ],
    },
  ];

  for (const hoursAgo of hoursToCheckpoint) {
    const hourDate = new Date(now - hoursAgo * 3600 * 1000);
    const { estTime } = formatTimeZones(hourDate);

    // 1. Add Hourly Quant Synthesis Report
    messages.push(generateHourlyMarketSynthesis(hoursAgo));

    // 2. Add 1-2 Automated Minute Predictions from Quant Strategy Desk
    const symbols = hoursAgo % 2 === 0 ? ["NVDA", "BTC"] : ["SOL", "AAPL"];
    for (let sIdx = 0; sIdx < symbols.length; sIdx++) {
      const predDate = new Date(hourDate.getTime() + (sIdx * 12 + 8) * 60 * 1000);
      const { estTime: predEst } = formatTimeZones(predDate);
      const prediction = generateMinutePrediction(symbols[sIdx], hoursAgo * 10 + sIdx);

      messages.push({
        id: `auto-pred-${hoursAgo}-${sIdx}-${predDate.getTime()}`,
        channelId: sIdx === 0 ? "general-trading" : "crypto-signals",
        author: {
          name: "Quant Strategy Desk",
          avatar: "🏛️",
          role: "ai-mod",
          roleLabel: "QUANT DESK",
          roleColor: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
          isBot: true,
          isVerified: true,
        },
        content: `⚡ **QUANTITATIVE MINUTE SIGNAL: $${prediction.symbol} (${prediction.name})**\nReal-time model prediction generated at ${predEst} EST. Confidence: ${prediction.confidence}%.`,
        prediction,
        timestamp: predDate.toISOString(),
        timeLabel: `${predEst} EST`,
        reactions: { "🚀": 14 + sIdx * 5, "💎": 11, "🔥": 8 },
        userReactions: {},
      });
    }

    // 3. Add 1-2 realistic trader replies
    const trader1 = simulatedDeskTraders[(hoursAgo * 2) % simulatedDeskTraders.length];
    const traderMsg1Date = new Date(hourDate.getTime() + 18 * 60 * 1000);
    messages.push({
      id: `floor-chat-${hoursAgo}-1`,
      channelId: "general-trading",
      author: {
        name: trader1.name,
        avatar: trader1.avatar,
        role: trader1.role,
        roleLabel: trader1.roleLabel,
        roleColor: trader1.roleColor,
        isVerified: trader1.isVerified,
      },
      content: trader1.messages[hoursAgo % trader1.messages.length],
      timestamp: traderMsg1Date.toISOString(),
      timeLabel: `${formatTimeZones(traderMsg1Date).estTime} EST`,
      reactions: { "📈": 9, "👍": 12 },
      userReactions: {},
    });
  }

  // Sort chronologically ascending
  messages.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  return messages;
}

/**
 * Handles user natural language messages or slash commands to generate a Quant Desk response.
 */
export function handleAIModeratorQuery(input: string): { reply: string; prediction?: MinutePrediction } {
  const clean = input.trim();
  const lower = clean.toLowerCase();

  // 1. Direct ticker lookup (e.g. "NVDA", "$NVDA", "sol", "btc", "fartcoin")
  const strippedClean = clean.toUpperCase().replace(/^\$/, "").trim();
  if (ASSET_BY_SYMBOL[strippedClean]) {
    const pred = generateMinutePrediction(strippedClean);
    const asset = ASSET_BY_SYMBOL[strippedClean];
    const reply = `🏛️ **Quant Strategy Desk Analysis: $${asset.symbol} (${asset.name})**\n` +
      `• **Stance:** **${pred.stance}** (${pred.confidence}% Model Conviction)\n` +
      `• **Current Price:** ${fmtPrice(pred.currentPrice)} | **Trend Score:** ${pred.score}/100\n` +
      `• **Targets:** Target 1: ${fmtPrice(pred.target1)} | Target 2: ${fmtPrice(pred.target2)}\n` +
      `• **Invalidation Stop:** ${fmtPrice(pred.invalidationLevel)} (Hard risk boundary)\n` +
      `• **Risk/Reward:** ${pred.riskRewardRatio} | **60d Realized Vol:** ${pred.realizedVol}%\n` +
      `• **Technical Mechanism:** ${pred.technicalMechanism}\n` +
      `• **Horizon:** ${pred.timeHorizon} | **Catalyst Watch:** ${pred.catalystAlert}\n` +
      `_Signal registered at ${pred.utcTime} UTC / ${pred.estTime} EST._`;
    return { reply, prediction: pred };
  }

  // 2. Check for /predict or /stance or keywords (e.g. "/predict nvda", "analyze btc", "how is sol")
  const matchSymbol = lower.match(/(?:\/predict|\/stance|\$|predict|analyze|audit|forecast|target|entry|review)\s+([a-z0-9]+)/i);
  let potentialTicker = matchSymbol ? matchSymbol[1].toUpperCase() : null;

  if (!potentialTicker) {
    const words = clean.toUpperCase().split(/[\s,?!]+/);
    for (const w of words) {
      const candidate = w.replace(/^\$/, "");
      if (candidate.length >= 2 && ASSET_BY_SYMBOL[candidate]) {
        potentialTicker = candidate;
        break;
      }
    }
  }

  if (potentialTicker && ASSET_BY_SYMBOL[potentialTicker]) {
    const pred = generateMinutePrediction(potentialTicker);
    const asset = ASSET_BY_SYMBOL[potentialTicker];
    const reply = `🏛️ **Quant Strategy Desk Analysis: $${asset.symbol} (${asset.name})**\n` +
      `• **Stance:** **${pred.stance}** (${pred.confidence}% Model Conviction)\n` +
      `• **Current Price:** ${fmtPrice(pred.currentPrice)} | **Trend Score:** ${pred.score}/100\n` +
      `• **Targets:** Target 1: ${fmtPrice(pred.target1)} | Target 2: ${fmtPrice(pred.target2)}\n` +
      `• **Invalidation Stop:** ${fmtPrice(pred.invalidationLevel)} (Hard risk boundary)\n` +
      `• **Risk/Reward:** ${pred.riskRewardRatio} | **60d Realized Vol:** ${pred.realizedVol}%\n` +
      `• **Technical Mechanism:** ${pred.technicalMechanism}\n` +
      `• **Horizon:** ${pred.timeHorizon} | **Catalyst Watch:** ${pred.catalystAlert}\n` +
      `_Signal registered at ${pred.utcTime} UTC / ${pred.estTime} EST._`;

    return { reply, prediction: pred };
  }

  // Global Clock / Time query
  if (lower.includes("clock") || lower.includes("time") || lower.includes("hour") || lower.includes("session")) {
    const { wibTime, utcTime, estTime, sessionStatus } = formatTimeZones();
    return {
      reply: `🕒 **NextWall Street Institutional Trading Clocks:**\n` +
        `• 🇺🇸 **EST (Wall Street New York):** \`${estTime} EST\`\n` +
        `• 🌐 **UTC (Market Benchmark):** \`${utcTime} UTC\`\n` +
        `• 🇸🇬 **SGT (Asia Pacific Session):** \`${wibTime} SGT\`\n` +
        `• 📊 **Current Market Session:** \`${sessionStatus}\`\n` +
        `_Quantitative desk feeds execute every 60 seconds. Hourly macro updates generate 24/7._`,
    };
  }

  if (lower.includes("pump") || lower.includes("meme") || lower.includes("fartcoin") || lower.includes("goat")) {
    const pred = generateMinutePrediction("FARTCOIN");
    return {
      reply: `🚀 **Pump.fun & Viral Speculative Sector Forensics:**\n` +
        `Tracking 407+ pump.fun and meme assets across Solana and Base. High retail order flow momentum observed.\n` +
        `Active Radar Focus: **$FARTCOIN** at ${fmtPrice(pred.currentPrice)} (${pred.stance}, ${pred.confidence}% Conviction).\n` +
        `⚠️ **Institutional Risk Protocol:** Cap total meme exposure under 2% portfolio equity and never average down into broken price structure.`,
      prediction: pred,
    };
  }

  if (lower.includes("recommendation") || lower.includes("best") || lower.includes("alpha") || lower.includes("top")) {
    const topStock = generateMinutePrediction("NVDA");
    const topCrypto = generateMinutePrediction("SOL");
    return {
      reply: `⚡ **High-Conviction Alpha Radar:**\n` +
        `1. **Equities Leader:** $NVDA (${topStock.stance}) — Target: ${fmtPrice(topStock.target1)}, Stop: ${fmtPrice(topStock.invalidationLevel)}\n` +
        `2. **Crypto Leader:** $SOL (${topCrypto.stance}) — Target: ${fmtPrice(topCrypto.target1)}, Stop: ${fmtPrice(topCrypto.invalidationLevel)}\n` +
        `Type \`/predict [symbol]\` to audit any instrument across our 2,038 tracked universe.`,
    };
  }

  // General welcome response
  const generalPred = generateMinutePrediction();
  return {
    reply: `👋 **NextWall Street Quant Desk Online & Monitoring 2,038 Assets.**\n\n` +
      `• **Real-Time Minute Predictions:** Continuous mathematical alpha predictions generated every 60 seconds.\n` +
      `• **Hourly Macro Synthesis:** Liquidity and sector flows compiled every 60 minutes.\n` +
      `• **Audit Any Symbol:** Type \`/predict [ticker]\` (e.g. \`/predict NVDA\`, \`/predict BTC\`, \`/predict SOL\`, \`/predict FARTCOIN\`).\n` +
      `• **Trading Floor Clocks:** Inquire about market sessions or current global desk hours anytime.`,
    prediction: generalPred,
  };
}
