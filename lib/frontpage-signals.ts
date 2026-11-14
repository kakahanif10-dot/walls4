import type { Row } from "./market";

export interface RawWhaleEthTx {
  hash: string;
  from: string;
  to: string;
  valueEth: number;
}

export interface RawWhaleSpotTrade {
  id: string;
  asset: string;
  side: "BUY" | "SELL";
  price: number;
  notionalUsd: number;
  time: string;
}

export interface RawStablecoinFlow {
  symbol: string;
  name: string;
  supplyUsd: number;
  change24hUsd: number;
  chainsCount: number;
}

export interface WhaleAlertEntry {
  id: string;
  asset: string;
  channel: "ON-CHAIN ETH" | "SPOT BLOCK" | "STABLECOIN FLOW";
  direction: "ACCUMULATION" | "DISTRIBUTION" | "TRANSFER" | "MINT" | "BURN";
  amountLabel: string;
  usdValue: number;
  summary: string;
  timestamp: string;
  venue: string;
}

export interface WhaleAlertsReport {
  ethBlockNumber: number;
  ethPriceUsd: number;
  totalTrackedUsd: number;
  buyPressureUsd: number;
  sellPressureUsd: number;
  netFlowBias: "Accumulation" | "Distribution" | "Balanced";
  largestPrintUsd: number;
  items: WhaleAlertEntry[];
}

function shortAddr(addr: string): string {
  const clean = (addr || "").trim();
  if (clean.length <= 14) return clean || "Contract";
  return `${clean.slice(0, 6)}…${clean.slice(-4)}`;
}

function fmtUsdCompact(val: number): string {
  const abs = Math.abs(val);
  if (abs >= 1e9) return `$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `$${(abs / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `$${(abs / 1e3).toFixed(1)}K`;
  return `$${abs.toFixed(0)}`;
}

export function normalizeWhaleAlerts(input: {
  ethTxs: RawWhaleEthTx[];
  whaleTrades: RawWhaleSpotTrade[];
  stablecoins: RawStablecoinFlow[];
  ethPriceUsd: number;
  ethBlockNumber: number;
  asOfIso?: string;
}): WhaleAlertsReport {
  const ethPrice = input.ethPriceUsd > 0 ? input.ethPriceUsd : 2500;
  const fallbackTime = (input.asOfIso ?? new Date().toISOString()).slice(11, 19) + " UTC";
  const entries: WhaleAlertEntry[] = [];

  for (const tx of input.ethTxs) {
    if (!Number.isFinite(tx.valueEth) || tx.valueEth <= 0) continue;
    const usdValue = tx.valueEth * ethPrice;
    entries.push({
      id: `eth-${tx.hash}`,
      asset: "ETH",
      channel: "ON-CHAIN ETH",
      direction: "TRANSFER",
      amountLabel: `${tx.valueEth.toFixed(2)} ETH`,
      usdValue,
      summary: `Whale wallet ${shortAddr(tx.from)} transferred ${tx.valueEth.toFixed(2)} ETH (${fmtUsdCompact(usdValue)}) to ${shortAddr(tx.to)} on Ethereum Block #${input.ethBlockNumber.toLocaleString()}.`,
      timestamp: fallbackTime,
      venue: "Ethereum Mainnet",
    });
  }

  let buyPressureUsd = 0;
  let sellPressureUsd = 0;
  for (const trade of input.whaleTrades) {
    if (!Number.isFinite(trade.notionalUsd) || trade.notionalUsd <= 0) continue;
    const isBuy = trade.side === "BUY";
    if (isBuy) buyPressureUsd += trade.notionalUsd;
    else sellPressureUsd += trade.notionalUsd;
    entries.push({
      id: `spot-${trade.id}`,
      asset: trade.asset,
      channel: "SPOT BLOCK",
      direction: isBuy ? "ACCUMULATION" : "DISTRIBUTION",
      amountLabel: `${fmtUsdCompact(trade.notionalUsd)} ${trade.asset}`,
      usdValue: trade.notionalUsd,
      summary: `Large ${isBuy ? "taker buy" : "taker sell"} print of ${fmtUsdCompact(trade.notionalUsd)} in ${trade.asset}/USDT executed at $${trade.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}.`,
      timestamp: `${trade.time} UTC`,
      venue: "Binance Spot Tape",
    });
  }

  for (const st of input.stablecoins) {
    if (!Number.isFinite(st.change24hUsd) || Math.abs(st.change24hUsd) < 500_000) continue;
    const isMint = st.change24hUsd >= 0;
    const absUsd = Math.abs(st.change24hUsd);
    if (isMint) buyPressureUsd += absUsd * 0.05;
    else sellPressureUsd += absUsd * 0.05;
    entries.push({
      id: `stable-${st.symbol}`,
      asset: st.symbol,
      channel: "STABLECOIN FLOW",
      direction: isMint ? "MINT" : "BURN",
      amountLabel: `${isMint ? "+" : "-"}${fmtUsdCompact(absUsd)} ${st.symbol}`,
      usdValue: absUsd,
      summary: `${st.name} (${st.symbol}) recorded a 24h net ${isMint ? "treasury inflow / mint" : "redemption / contraction"} of ${fmtUsdCompact(absUsd)} across ${st.chainsCount} chains.`,
      timestamp: "24h Window",
      venue: "DeFiLlama Stablecoins",
    });
  }

  entries.sort((a, b) => b.usdValue - a.usdValue);

  const totalTrackedUsd = entries.reduce((sum, item) => sum + item.usdValue, 0);
  const largestPrintUsd = entries.length > 0 ? entries[0].usdValue : 0;
  const netRatio =
    buyPressureUsd + sellPressureUsd > 0
      ? (buyPressureUsd - sellPressureUsd) / (buyPressureUsd + sellPressureUsd)
      : 0;
  const netFlowBias: WhaleAlertsReport["netFlowBias"] =
    netRatio >= 0.12 ? "Accumulation" : netRatio <= -0.12 ? "Distribution" : "Balanced";

  return {
    ethBlockNumber: input.ethBlockNumber,
    ethPriceUsd: ethPrice,
    totalTrackedUsd,
    buyPressureUsd,
    sellPressureUsd,
    netFlowBias,
    largestPrintUsd,
    items: entries,
  };
}

export interface AiSentimentInput {
  fngValue: number | null;
  fngClassification: string | null;
  fngDelta24h: number | null;
  pulseScore: number;
  pulseBreadth: number;
  btcChange24h: number | null;
  ethChange24h: number | null;
  btcFunding8hPct: number | null;
  btcDominancePct: number | null;
}

export interface AiSentimentReport {
  compositeScore: number;
  regime: "Extreme Fear" | "Cautious" | "Neutral" | "Constructive" | "Extreme Greed";
  stanceBias: string;
  confidencePct: number;
  fngValue: number | null;
  fngClassification: string | null;
  fngDelta24h: number | null;
  equityPulseScore: number;
  equityBreadthPct: number;
  btcChange24h: number | null;
  ethChange24h: number | null;
  btcFunding8hPct: number | null;
  btcDominancePct: number | null;
  drivers: Array<{ label: string; value: string; tone: "bull" | "neutral" | "bear" }>;
  deskSummary: string;
}

export function computeAiMarketSentiment(input: AiSentimentInput): AiSentimentReport {
  const fng = typeof input.fngValue === "number" && Number.isFinite(input.fngValue)
    ? Math.max(0, Math.min(100, input.fngValue))
    : null;
  const pulse = Math.max(0, Math.min(100, Math.round(input.pulseScore)));
  const breadth = Math.max(0, Math.min(100, Math.round(input.pulseBreadth)));
  const btcChg = typeof input.btcChange24h === "number" && Number.isFinite(input.btcChange24h) ? input.btcChange24h : null;
  const funding = typeof input.btcFunding8hPct === "number" && Number.isFinite(input.btcFunding8hPct) ? input.btcFunding8hPct : null;

  const momentumScore = btcChg !== null ? Math.max(10, Math.min(90, 50 + btcChg * 4.5)) : pulse;
  const fundingScore = funding !== null ? Math.max(15, Math.min(85, 50 + funding * 700)) : 50;

  const rawComposite =
    fng !== null
      ? fng * 0.42 + pulse * 0.28 + breadth * 0.14 + momentumScore * 0.1 + fundingScore * 0.06
      : pulse * 0.52 + breadth * 0.28 + momentumScore * 0.2;

  const compositeScore = Math.max(1, Math.min(99, Math.round(rawComposite)));

  let regime: AiSentimentReport["regime"] = "Neutral";
  let stanceBias = "Tactical Balance & Selective Entries";
  if (compositeScore <= 25) {
    regime = "Extreme Fear";
    stanceBias = "Contrarian Accumulation Near Structural Support";
  } else if (compositeScore <= 44) {
    regime = "Cautious";
    stanceBias = "Defensive Sizing · Prioritize Quality Leaders";
  } else if (compositeScore <= 58) {
    regime = "Neutral";
    stanceBias = "Selective Rotation · Wait for Range Expansion";
  } else if (compositeScore <= 76) {
    regime = "Constructive";
    stanceBias = "Trend Continuation · Trail Invalidation Anchors";
  } else {
    regime = "Extreme Greed";
    stanceBias = "Trim Extended Beta · Tighten Volatility Stops";
  }

  const signalsAgreeing =
    (fng !== null ? 1 : 0) +
    (btcChg !== null ? 1 : 0) +
    (funding !== null ? 1 : 0) +
    2; // pulse + breadth always computed from 2,038-asset universe
  const confidencePct = Math.min(94, 58 + signalsAgreeing * 7);

  const drivers: AiSentimentReport["drivers"] = [
    {
      label: "Crypto Fear & Greed",
      value: fng !== null ? `${fng}/100 (${input.fngClassification ?? regime})` : "Feed Syncing",
      tone: fng === null ? "neutral" : fng >= 55 ? "bull" : fng <= 35 ? "bear" : "neutral",
    },
    {
      label: "Equities Composite Pulse",
      value: `${pulse}/100 (${breadth}% breadth ≥60)`,
      tone: pulse >= 58 ? "bull" : pulse <= 42 ? "bear" : "neutral",
    },
    {
      label: "BTC 24h Flow & Funding",
      value:
        btcChg !== null
          ? `${btcChg >= 0 ? "+" : ""}${btcChg.toFixed(2)}% · ${funding !== null ? `${funding >= 0 ? "+" : ""}${funding.toFixed(4)}% 8h` : "Spot Led"}`
          : "Live Spot Feed",
      tone: btcChg === null ? "neutral" : btcChg >= 0.5 ? "bull" : btcChg <= -0.5 ? "bear" : "neutral",
    },
  ];

  const deskSummary = `Cross-market AI sentiment reads ${compositeScore}/100 (${regime}). Equities breadth shows ${breadth}% of tracked names scoring 60+ with a composite pulse of ${pulse}/100${
    fng !== null ? `, while digital asset crowd sentiment sits at ${fng}/100 (${input.fngClassification ?? "Live"})` : ""
  }. Desk bias: ${stanceBias}.`;

  return {
    compositeScore,
    regime,
    stanceBias,
    confidencePct,
    fngValue: fng,
    fngClassification: input.fngClassification,
    fngDelta24h: input.fngDelta24h,
    equityPulseScore: pulse,
    equityBreadthPct: breadth,
    btcChange24h: btcChg,
    ethChange24h: input.ethChange24h,
    btcFunding8hPct: funding,
    btcDominancePct: input.btcDominancePct,
    drivers,
    deskSummary,
  };
}

export interface TopSignalItem {
  rank: number;
  symbol: string;
  name: string;
  kind: Row["kind"];
  group: string;
  price: number;
  change24h: number;
  change30d: number;
  score: number;
  stance: Row["stance"];
  risk: Row["risk"];
  horizonBias: string;
  targetPrice: number;
  invalidationPrice: number;
  riskReward: string;
  rationale: string;
}

function buildEnglishRationale(row: Row): string {
  const chgDir = row.change24h >= 0 ? "positive" : "pullback";
  return `${row.symbol} holds a ${row.score}/100 composite trend score (${row.stance}) with ${chgDir} 24h tape (${row.change24h >= 0 ? "+" : ""}${row.change24h.toFixed(2)}%) and ${row.swingLong.structure.toLowerCase()} structure; thesis invalidates cleanly below ${row.swingLong.macroInvalidation.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: row.swingLong.macroInvalidation < 1 ? 4 : 2 })}.`;
}

export function computeTopSignalsToday(rows: Row[], limit = 15): TopSignalItem[] {
  if (!rows || rows.length === 0) return [];

  // Rank by composite score + 30d momentum alignment + positive intraday stability
  const ranked = [...rows]
    .filter((r) => r.price > 0 && (r.stance === "Buy" || r.stance === "Accumulate" || r.score >= 60))
    .sort((a, b) => {
      const aQuality = a.score + Math.min(8, Math.max(-4, a.change30d * 0.25)) + (a.kind !== "meme" ? 3 : 0);
      const bQuality = b.score + Math.min(8, Math.max(-4, b.change30d * 0.25)) + (b.kind !== "meme" ? 3 : 0);
      return bQuality - aQuality;
    });

  const pool = ranked.length > 0 ? ranked : [...rows].sort((a, b) => b.score - a.score);

  // Ensure Top 3 includes diverse cross-market representation if available (top equity + top crypto + #3 overall)
  const chosen: Row[] = [];
  const seen = new Set<string>();
  const topEquity = pool.find((r) => r.kind === "stock");
  const topCrypto = pool.find((r) => r.kind === "crypto");

  if (topEquity) {
    chosen.push(topEquity);
    seen.add(topEquity.symbol);
  }
  if (topCrypto && !seen.has(topCrypto.symbol)) {
    chosen.push(topCrypto);
    seen.add(topCrypto.symbol);
  }
  for (const candidate of pool) {
    if (chosen.length >= limit) break;
    if (seen.has(candidate.symbol)) continue;
    chosen.push(candidate);
    seen.add(candidate.symbol);
  }

  return chosen.map((row, idx) => ({
    rank: idx + 1,
    symbol: row.symbol,
    name: row.name,
    kind: row.kind,
    group: row.group,
    price: row.price,
    change24h: row.change24h,
    change30d: row.change30d,
    score: row.score,
    stance: row.stance,
    risk: row.risk,
    horizonBias: row.dayTrade.bias,
    targetPrice: row.dayTrade.intradayTarget,
    invalidationPrice: row.dayTrade.intradayStop,
    riskReward: row.swingLong.riskReward,
    rationale: buildEnglishRationale(row),
  }));
}
