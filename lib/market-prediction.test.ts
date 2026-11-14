import test from "node:test";
import assert from "node:assert/strict";
import { ASSETS, ASSET_BY_SYMBOL, byKind } from "./market";
import { series, metricsFor, fmtPrice, fmtPct } from "./market";
import { formatTimeZones, generateMinutePrediction, handleAIModeratorQuery } from "./ai-moderator";

test("Asset Universe has 2,000+ instruments with 800 stocks, 831 cryptos, and 407 meme coins", () => {
  assert.ok(ASSETS.length >= 2000, `Expected at least 2000 assets, found ${ASSETS.length}`);

  const stocks = byKind("stock");
  const cryptos = byKind("crypto");
  const memes = byKind("meme");

  assert.equal(stocks.length, 800, `Expected exactly 800 stocks, got ${stocks.length}`);
  assert.equal(cryptos.length, 831, `Expected exactly 831 cryptos, got ${cryptos.length}`);
  assert.equal(memes.length, 407, `Expected exactly 407 meme coins, got ${memes.length}`);

  // Test S&P 500, Nasdaq, and growth leaders
  assert.ok(ASSET_BY_SYMBOL["NVDA"], "NVDA must exist");
  assert.ok(ASSET_BY_SYMBOL["AAPL"], "AAPL must exist");
  assert.ok(ASSET_BY_SYMBOL["CAVA"], "CAVA must exist");
  assert.ok(ASSET_BY_SYMBOL["BABA"], "BABA must exist");
  assert.ok(ASSET_BY_SYMBOL["RDDT"], "RDDT must exist");
  assert.ok(ASSET_BY_SYMBOL["RKLB"], "RKLB must exist");

  // Test Binance, Coinbase, and major cryptos
  assert.ok(ASSET_BY_SYMBOL["BTC"], "BTC must exist");
  assert.ok(ASSET_BY_SYMBOL["SOL"], "SOL must exist");
  assert.ok(ASSET_BY_SYMBOL["ALGO"], "ALGO must exist");
  assert.ok(ASSET_BY_SYMBOL["VET"], "VET must exist");
  assert.ok(ASSET_BY_SYMBOL["FIL"], "FIL must exist");
  assert.ok(ASSET_BY_SYMBOL["STRK"], "STRK must exist");

  // Test pump.fun and viral memes
  assert.ok(ASSET_BY_SYMBOL["FARTCOIN"], "FARTCOIN must exist");
  assert.ok(ASSET_BY_SYMBOL["GOAT"], "GOAT must exist");
  assert.ok(ASSET_BY_SYMBOL["PUMP"], "PUMP must exist");
  assert.ok(ASSET_BY_SYMBOL["VIRTUAL"], "VIRTUAL must exist");
  assert.ok(ASSET_BY_SYMBOL["GRIFFAIN"], "GRIFFAIN must exist");
  assert.ok(ASSET_BY_SYMBOL["CHILLGUY"], "CHILLGUY must exist");
});

test("Metrics and series calculation generate non-zero realistic metrics for all asset types", () => {
  for (const sym of ["NVDA", "BTC", "FARTCOIN"]) {
    const asset = ASSET_BY_SYMBOL[sym];
    assert.ok(asset, `Asset ${sym} must exist`);

    const pts = series(asset, 260);
    assert.ok(pts.length >= 30, `Expected series history length >= 30, got ${pts.length}`);

    const m = metricsFor(asset);
    assert.ok(m.last > 0, `Expected positive last price for ${sym}, got ${m.last}`);
    assert.ok(m.rsi >= 0 && m.rsi <= 100, `RSI must be between 0 and 100, got ${m.rsi}`);
    assert.ok(m.score >= 0 && m.score <= 100, `Score must be between 0 and 100, got ${m.score}`);
    assert.ok(m.high52 >= m.low52, `52w high must be >= low for ${sym}`);
  }
});

test("Live timezones format WIB, UTC, and EST properly", () => {
  const times = formatTimeZones();
  assert.ok(times.wibTime && times.wibTime.includes(":"), "WIB time must contain colon");
  assert.ok(times.utcTime && times.utcTime.includes(":"), "UTC time must contain colon");
  assert.ok(times.estTime && times.estTime.includes(":"), "EST time must contain colon");
  assert.ok(times.sessionStatus && times.sessionStatus.length > 0, "Market session must be defined");
});

test("Quant Desk generates valid structured predictions", () => {
  const pred = generateMinutePrediction("SOL");
  assert.equal(pred.symbol, "SOL");
  assert.ok(pred.currentPrice > 0, "Price must be positive");
  assert.ok(pred.target1 > 0, "Target 1 must be positive");
  assert.ok(pred.invalidationLevel > 0, "Invalidation level must be positive");
  assert.ok(pred.confidence >= 50 && pred.confidence <= 100, "Confidence in range");
  assert.ok(pred.technicalMechanism.length > 10, "Technical mechanism explanation provided");
  assert.ok(pred.estTime && pred.estTime.length > 0, "EST time timestamp provided");
});

test("Quant Desk Query handler answers /predict and clock commands", () => {
  const queryPred = handleAIModeratorQuery("/predict FARTCOIN");
  assert.ok(queryPred.prediction, "Prediction must be generated for FARTCOIN");
  assert.equal(queryPred.prediction?.symbol, "FARTCOIN");
  assert.ok(queryPred.reply.includes("Quant Strategy Desk Analysis"), "Includes analysis header");

  const queryClock = handleAIModeratorQuery("What are the current market session clocks?");
  assert.ok(queryClock.reply.includes("EST"), "Clock query must include EST time");
  assert.ok(queryClock.reply.includes("UTC"), "Clock query must include UTC time");
});
