import test from "node:test";
import assert from "node:assert/strict";
import {
  computeAiMarketSentiment,
  computeTopSignalsToday,
  normalizeWhaleAlerts,
} from "./frontpage-signals";
import type { Row } from "./market";

test("normalizeWhaleAlerts merges ETH, spot prints, and stablecoin flows sorted by USD value", () => {
  const report = normalizeWhaleAlerts({
    ethBlockNumber: 22000123,
    ethPriceUsd: 3000,
    asOfIso: "2026-05-01T14:30:00.000Z",
    ethTxs: [
      {
        hash: "0x1234567890abcdef",
        from: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
        to: "0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb",
        valueEth: 250,
      },
    ],
    whaleTrades: [
      {
        id: "BTC-1",
        asset: "BTC",
        side: "BUY",
        price: 95000,
        notionalUsd: 1_850_000,
        time: "14:29:50",
      },
      {
        id: "ETH-2",
        asset: "ETH",
        side: "SELL",
        price: 3000,
        notionalUsd: 420_000,
        time: "14:29:55",
      },
    ],
    stablecoins: [
      {
        symbol: "USDT",
        name: "Tether",
        supplyUsd: 140_000_000_000,
        change24hUsd: 85_000_000,
        chainsCount: 12,
      },
      {
        symbol: "TINY",
        name: "TinyUSD",
        supplyUsd: 1_000_000,
        change24hUsd: 100_000,
        chainsCount: 1,
      },
    ],
  });

  assert.equal(report.items.length, 4); // TINY below $500k threshold is filtered out
  assert.equal(report.items[0].asset, "USDT");
  assert.equal(report.items[0].channel, "STABLECOIN FLOW");
  assert.equal(report.items[0].direction, "MINT");
  assert.equal(report.items[1].asset, "BTC");
  assert.equal(report.items[1].direction, "ACCUMULATION");
  assert.equal(report.items[2].usdValue, 750_000);
  assert.equal(report.netFlowBias, "Accumulation");
  assert.ok(report.totalTrackedUsd > 87_000_000);
});

test("computeAiMarketSentiment blends Fear & Greed, equity pulse, and BTC momentum into clean English regimes", () => {
  const bullish = computeAiMarketSentiment({
    fngValue: 72,
    fngClassification: "Greed",
    fngDelta24h: 4,
    pulseScore: 68,
    pulseBreadth: 64,
    btcChange24h: 3.1,
    ethChange24h: 4.2,
    btcFunding8hPct: 0.012,
    btcDominancePct: 58.4,
  });

  assert.equal(bullish.regime, "Constructive");
  assert.ok(bullish.compositeScore >= 59 && bullish.compositeScore <= 76);
  assert.equal(bullish.drivers.length, 3);
  assert.match(bullish.deskSummary, /Cross-market AI sentiment reads/);

  const fearful = computeAiMarketSentiment({
    fngValue: 18,
    fngClassification: "Extreme Fear",
    fngDelta24h: -6,
    pulseScore: 30,
    pulseBreadth: 22,
    btcChange24h: -5.2,
    ethChange24h: -6.4,
    btcFunding8hPct: -0.02,
    btcDominancePct: 60.1,
  });

  assert.equal(fearful.regime, "Extreme Fear");
  assert.ok(fearful.compositeScore <= 25);
});

test("computeTopSignalsToday selects diverse top 3 real-time signals with targets and invalidations", () => {
  const sampleRows: Row[] = [
    {
      symbol: "NVDA",
      name: "NVIDIA Corp.",
      kind: "stock",
      group: "AI & Semiconductors",
      price: 142.5,
      change24h: 2.8,
      change30d: 14.5,
      score: 86,
      stance: "Buy",
      risk: "Moderate",
      spark: [120, 130, 142.5],
      dayTrade: {
        bias: "LONG SCALP",
        vwapBias: "Above VWAP",
        intradayTarget: 147.2,
        intradayStop: 138.9,
        invalidationDistancePct: 2.5,
        momentum15m: "Strong Bull",
      },
      swingLong: {
        bias: "STAGE 2 EXPANSION",
        structure: "Golden Cross Base",
        timeHorizon: "2–6 Weeks",
        macroInvalidation: 129.0,
        riskReward: "3.4 : 1",
      },
    },
    {
      symbol: "BTC",
      name: "Bitcoin",
      kind: "crypto",
      group: "Digital Macro Reserve",
      price: 94200,
      change24h: 3.1,
      change30d: 18.2,
      score: 84,
      stance: "Buy",
      risk: "Elevated",
      spark: [82000, 89000, 94200],
      dayTrade: {
        bias: "LONG SCALP",
        vwapBias: "Above VWAP",
        intradayTarget: 97800,
        intradayStop: 91500,
        invalidationDistancePct: 2.8,
        momentum15m: "Strong Bull",
      },
      swingLong: {
        bias: "STAGE 2 EXPANSION",
        structure: "Stage 2 Mark-up",
        timeHorizon: "2–6 Weeks",
        macroInvalidation: 86400,
        riskReward: "3.1 : 1",
      },
    },
    {
      symbol: "MSFT",
      name: "Microsoft Corp.",
      kind: "stock",
      group: "Enterprise Cloud",
      price: 448.1,
      change24h: 1.4,
      change30d: 9.0,
      score: 79,
      stance: "Buy",
      risk: "Low",
      spark: [420, 435, 448.1],
      dayTrade: {
        bias: "LONG SCALP",
        vwapBias: "Above VWAP",
        intradayTarget: 455.0,
        intradayStop: 441.0,
        invalidationDistancePct: 1.6,
        momentum15m: "Bullish Flow",
      },
      swingLong: {
        bias: "CORE ACCUMULATE",
        structure: "Stage 2 Mark-up",
        timeHorizon: "2–6 Weeks",
        macroInvalidation: 425.0,
        riskReward: "2.8 : 1",
      },
    },
  ];

  const top = computeTopSignalsToday(sampleRows, 3);
  assert.equal(top.length, 3);
  assert.equal(top[0].rank, 1);
  assert.equal(top[0].symbol, "NVDA");
  assert.equal(top[1].symbol, "BTC");
  assert.equal(top[2].symbol, "MSFT");
  assert.ok(top[0].targetPrice > top[0].price);
  assert.ok(top[0].invalidationPrice < top[0].price);
});
