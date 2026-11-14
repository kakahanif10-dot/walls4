import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_FX_RATES,
  calculateDcaLadder,
  calculateKellyMetrics,
  calculatePrecisionPosition,
  computeAtr14,
  computeRealizedVolatilityPct,
  computeSma,
  formatCurrencyValue,
} from "./precision-calculator";

test("computeAtr14, computeRealizedVolatilityPct, and computeSma evaluate OHLC bars accurately", () => {
  const bars = Array.from({ length: 25 }, (_, i) => ({
    high: 100 + i + 2,
    low: 100 + i - 2,
    close: 100 + i,
  }));
  const atr = computeAtr14(bars);
  assert.ok(atr >= 3.9 && atr <= 4.1, `Expected ATR ~4.0, got ${atr}`);

  const sma20 = computeSma(
    bars.map((b) => b.close),
    20,
  );
  // Last 20 closes: 105..124 -> mean 114.5
  assert.equal(Number(sma20.toFixed(2)), 114.5);

  const vol = computeRealizedVolatilityPct(bars.map((b) => b.close));
  assert.ok(vol > 0, "Realized volatility should be positive");
});

test("calculatePrecisionPosition computes exact spot/perp sizing, fees, and isolated liquidation", () => {
  const res = calculatePrecisionPosition({
    accountEquityUsd: 50000,
    riskPct: 1.0,
    entryPriceUsd: 100,
    stopPriceUsd: 95,
    targetRMultiple: 2,
    leverage: 5,
    marginMode: "isolated",
    feeRateBps: 5, // 0.05% per side = $0.10 per unit round-trip
    holdingDays: 2,
    fundingRate8hPct: 0.01,
    direction: "long",
  });

  assert.equal(res.isValid, true);
  assert.equal(res.stopDistanceUsd, 5);
  assert.equal(res.stopDistancePct, 5);
  // Risk budget = $500; unit risk = 5 + 0.10 = 5.10 -> qty = 98.0392
  assert.equal(Number(res.quantity.toFixed(2)), 98.04);
  assert.equal(Number(res.initialMarginUsd.toFixed(2)), Number((res.notionalUsd / 5).toFixed(2)));
  assert.ok(res.liquidationPriceUsd !== null && res.liquidationPriceUsd < 95 && res.liquidationPriceUsd > 75);
  assert.equal(res.targetPriceUsd, 110);
  assert.ok(res.netProfitAtTargetUsd > 0);
});

test("calculatePrecisionPosition rejects invalid stop direction", () => {
  const res = calculatePrecisionPosition({
    accountEquityUsd: 50000,
    riskPct: 1,
    entryPriceUsd: 100,
    stopPriceUsd: 105,
    targetRMultiple: 2,
    leverage: 1,
    marginMode: "spot",
    feeRateBps: 5,
    holdingDays: 0,
    fundingRate8hPct: 0,
    direction: "long",
  });
  assert.equal(res.isValid, false);
  assert.ok(res.error);
});

test("calculateKellyMetrics computes full/fractional Kelly, expectancy, and profit factor", () => {
  // 55% win rate, 2.0R avg win, 1.0R avg loss -> Kelly f* = 0.55 - 0.45/2 = 0.325 (32.5%)
  const res = calculateKellyMetrics({
    winRatePct: 55,
    avgWinR: 2.0,
    avgLossR: 1.0,
    fraction: 0.5,
    accountEquityUsd: 100000,
  });

  assert.equal(res.hasPositiveEdge, true);
  assert.equal(Number(res.fullKellyPct.toFixed(2)), 32.5);
  assert.equal(Number(res.recommendedRiskPct.toFixed(2)), 16.25);
  assert.equal(Number(res.expectancyR.toFixed(2)), 0.65);
  assert.ok(res.profitFactor > 2.4);
});

test("calculateDcaLadder lowers weighted average entry when scaled down", () => {
  const equal = calculateDcaLadder({
    totalBudgetUsd: 10000,
    topPriceUsd: 100,
    bottomPriceUsd: 80,
    tranches: 3,
    scheme: "equal",
    targetPriceUsd: 120,
    stopPriceUsd: 72,
    feeRateBps: 5,
  });
  const scaled = calculateDcaLadder({
    totalBudgetUsd: 10000,
    topPriceUsd: 100,
    bottomPriceUsd: 80,
    tranches: 3,
    scheme: "scale-down",
    targetPriceUsd: 120,
    stopPriceUsd: 72,
    feeRateBps: 5,
  });

  assert.equal(equal.isValid, true);
  assert.equal(scaled.isValid, true);
  assert.ok(scaled.weightedAvgEntryUsd < equal.weightedAvgEntryUsd);
  assert.ok(scaled.totalUnits > equal.totalUnits);
  assert.ok(scaled.projectedNetProfitUsd > equal.projectedNetProfitUsd);
});

test("formatCurrencyValue converts using live FX map", () => {
  const eur = formatCurrencyValue(1000, "EUR", DEFAULT_FX_RATES);
  assert.equal(eur, "€920.00");
  const jpy = formatCurrencyValue(1000, "JPY", DEFAULT_FX_RATES);
  assert.equal(jpy, "¥153,400");
});
