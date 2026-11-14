import test from "node:test";
import assert from "node:assert/strict";
import {
  INSTITUTIONAL_TOOL_SPECS,
  WORKFLOW_COMPARISON_MATRIX,
  computeAmlRiskScore,
  computeDcfModel,
  computeOrderbookSlippage,
  computeTechnicalIndicators,
  computeWacc,
} from "./institutional-tools-data";

test("catalog defines exactly 15 institutional tools (7 Traditional + 8 Digital Assets)", () => {
  assert.equal(INSTITUTIONAL_TOOL_SPECS.length, 15);
  const tradfi = INSTITUTIONAL_TOOL_SPECS.filter((t) => t.stack === "traditional");
  const digital = INSTITUTIONAL_TOOL_SPECS.filter((t) => t.stack === "digital");
  assert.equal(tradfi.length, 7);
  assert.equal(digital.length, 8);
  assert.equal(WORKFLOW_COMPARISON_MATRIX.length, 4);
});

test("computeWacc derives CAPM cost of equity and weighted after-tax cost of capital", () => {
  const res = computeWacc({
    riskFreeRatePct: 4.2,
    equityRiskPremiumPct: 5.0,
    beta: 1.4,
    costOfDebtPct: 6.0,
    taxRatePct: 20,
    debtWeightPct: 10,
  });
  // Ke = 4.2 + 1.4*5 = 11.2%
  assert.ok(Math.abs(res.costOfEquityPct - 11.2) < 1e-6);
  // Kd after tax = 6 * 0.8 = 4.8%
  assert.ok(Math.abs(res.afterTaxCostOfDebtPct - 4.8) < 1e-6);
  // WACC = 0.9*11.2 + 0.1*4.8 = 10.56%
  assert.ok(Math.abs(res.waccPct - 10.56) < 1e-6);
});

test("computeDcfModel produces 5-year FCF projections and monotonic sensitivity grid", () => {
  const out = computeDcfModel({
    baseRevenueM: 100000,
    revenueGrowthPct: 18,
    ebitdaMarginPct: 55,
    taxRatePct: 16,
    daPctOfRev: 3,
    capexPctOfRev: 4,
    nwcPctOfRev: 2,
    waccPct: 9.5,
    terminalGrowthPct: 3.0,
    netDebtM: -25000, // net cash
    sharesOutM: 24500,
    currentPriceUsd: 140,
  });

  assert.equal(out.projections.length, 5);
  assert.ok(out.enterpriseValueM > out.sumPvFcfM);
  assert.ok(out.equityValueM > out.enterpriseValueM); // net cash adds to equity value
  assert.ok(out.impliedSharePriceUsd > 0);
  assert.equal(out.sensitivityGrid.length, 5);
  assert.equal(out.sensitivityGrid[0].cells.length, 5);

  // Higher WACC -> lower implied share price at fixed terminal growth
  const lowWaccPrice = out.sensitivityGrid[0].cells[2].impliedPriceUsd;
  const highWaccPrice = out.sensitivityGrid[4].cells[2].impliedPriceUsd;
  assert.ok(lowWaccPrice > highWaccPrice);
});

test("computeTechnicalIndicators computes RSI(14), SMAs, and MACD", () => {
  const uptrend = Array.from({ length: 60 }, (_, i) => 100 + i * 1.5);
  const res = computeTechnicalIndicators(uptrend);
  assert.ok(res.rsi14 > 90);
  assert.ok(res.sma20 > res.sma50);
  assert.ok(res.macdLine > 0);
  assert.equal(res.trendBias, "Overbought");

  const flat = Array.from({ length: 50 }, () => 100);
  const flatRes = computeTechnicalIndicators(flat);
  assert.equal(flatRes.rsi14, 50);
  assert.equal(flatRes.trendBias, "Consolidation");
});

test("computeOrderbookSlippage calculates VWAP and basis-point slippage accurately", () => {
  const asks = [
    { price: 100, size: 500 }, // $50,000
    { price: 101, size: 1000 }, // $101,000
  ];
  const res = computeOrderbookSlippage(asks, 100000);
  assert.equal(res.filledUsd, 100000);
  assert.equal(res.bestPrice, 100);
  assert.ok(res.vwapPrice > 100 && res.vwapPrice < 101);
  assert.ok(res.slippageBps > 40 && res.slippageBps < 60);
  assert.equal(res.exhaustedBook, false);
});

test("computeAmlRiskScore escalates risk tiers for high velocity and sanctioned heuristics", () => {
  const clean = computeAmlRiskScore({
    chain: "bitcoin",
    balanceNative: 2.5,
    txCount: 12,
    isContract: false,
    unconfirmedCount: 0,
    highVelocityCount: 0,
  });
  assert.equal(clean.tier, "Low Risk");

  const flagged = computeAmlRiskScore({
    chain: "ethereum",
    balanceNative: 420,
    txCount: 9500,
    isContract: true,
    unconfirmedCount: 4,
    highVelocityCount: 10,
    knownSanctionedMatch: true,
  });
  assert.equal(flagged.tier, "High Risk Flag");
  assert.equal(flagged.score, 100);
});
