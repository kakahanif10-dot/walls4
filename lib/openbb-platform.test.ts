import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateOpenBBVaR,
  generateMonteCarloPaths,
  computeOpenBBEfficientFrontier,
  executeOpenBBCommand,
  OPENBB_YIELD_CURVE,
  OPENBB_MACRO_INDICATORS,
  OPENBB_DARKPOOL_ITEMS,
} from "./openbb-platform";

test("Quant CLI Yield Curve and Macro Indicators have valid institutional data", () => {
  assert.ok(OPENBB_YIELD_CURVE.length >= 10, "Yield curve must have standard tenors");
  const tenYear = OPENBB_YIELD_CURVE.find((p) => p.tenor === "10Y");
  const twoYear = OPENBB_YIELD_CURVE.find((p) => p.tenor === "2Y");

  assert.ok(tenYear, "10Y Treasury must exist");
  assert.ok(twoYear, "2Y Treasury must exist");
  assert.ok(tenYear.rate > 0 && tenYear.rate < 15, "10Y yield must be realistic");
  assert.ok(twoYear.rate > 0 && twoYear.rate < 15, "2Y yield must be realistic");

  // Macro indicators
  assert.ok(OPENBB_MACRO_INDICATORS.length >= 5, "Macro indicators must be populated");
  const cpi = OPENBB_MACRO_INDICATORS.find((m) => m.metric.includes("CPI"));
  assert.ok(cpi, "CPI indicator must exist");
});

test("Quant CLI Risk calculates accurate VaR, Expected Shortfall, and Sharpe ratios", () => {
  const nvdaVaR = calculateOpenBBVaR("NVDA", 0.95);
  assert.equal(nvdaVaR.symbol, "NVDA");
  assert.ok(nvdaVaR.parametricVaRPercent > 0, "Parametric VaR must be positive");
  assert.ok(nvdaVaR.historicalVaRPercent >= nvdaVaR.parametricVaRPercent, "Historical fat-tailed VaR should exceed or equal Gaussian");
  assert.ok(nvdaVaR.expectedShortfallPercent > nvdaVaR.historicalVaRPercent, "CVaR must exceed VaR");
  assert.ok(nvdaVaR.annualizedVol > 0, "Volatility must be positive");
  assert.ok(typeof nvdaVaR.sharpeRatio === "number");

  // Crypto asset should have higher volatility than large-cap stock
  const btcVaR = calculateOpenBBVaR("BTC", 0.95);
  assert.ok(btcVaR.annualizedVol > nvdaVaR.annualizedVol, "BTC vol should be higher than NVDA vol");
  assert.ok(btcVaR.parametricVaRPercent > nvdaVaR.parametricVaRPercent);
});

test("Quant CLI Monte Carlo simulation generates consistent non-divergent 30-day price envelopes", () => {
  const paths = generateMonteCarloPaths("NVDA", 180, 30);
  assert.equal(paths.length, 31, "Should have 31 days (day 0 to 30)");

  const day0 = paths[0];
  assert.equal(day0.p50, 180);
  assert.equal(day0.p05, 180);
  assert.equal(day0.p95, 180);

  const day30 = paths[30];
  assert.ok(day30.p05 < day30.p25, "p05 must be less than p25");
  assert.ok(day30.p25 <= day30.p50, "p25 must be less than p50");
  assert.ok(day30.p50 <= day30.p75, "p50 must be less than p75");
  assert.ok(day30.p75 < day30.p95, "p75 must be less than p95");
});

test("Quant CLI Markowitz Efficient Frontier normalizes weights to 100% and calculates optimal tangency", () => {
  const res = computeOpenBBEfficientFrontier(["NVDA", "AAPL", "BTC", "SOL"]);
  assert.ok(res.frontier.length > 10, "Frontier points must be computed");
  assert.ok(res.allocations.length === 4, "Must have 4 asset allocations");

  const sumMinVar = res.allocations.reduce((acc, a) => acc + a.minVarianceWeight, 0);
  const sumMaxSharpe = res.allocations.reduce((acc, a) => acc + a.maxSharpeWeight, 0);

  // Floating point rounding tolerance ~100%
  assert.ok(Math.abs(sumMinVar - 100) < 1, `Min var sum ${sumMinVar} should be ~100%`);
  assert.ok(Math.abs(sumMaxSharpe - 100) < 1, `Max Sharpe sum ${sumMaxSharpe} should be ~100%`);
  assert.ok(res.maxSharpePoint.sharpe > 0, "Max Sharpe point must have positive Sharpe ratio");
});

test("Quant CLI interpreter handles commands, help, and Python SDK syntax", () => {
  // Help command
  const helpRes = executeOpenBBCommand("help");
  assert.equal(helpRes.type, "text");
  assert.ok(helpRes.content.includes("AVAILABLE QUANT CLI MODULES"));

  // Yield curve command
  const yieldRes = executeOpenBBCommand("/economy/yieldcurve");
  assert.equal(yieldRes.type, "table");
  assert.ok(yieldRes.tableData && yieldRes.tableData.length >= 10);

  // VaR command
  const varRes = executeOpenBBCommand("/quant/var NVDA");
  assert.equal(varRes.type, "table");
  assert.ok(varRes.title?.includes("NVDA"));

  // Python syntax
  const pyRes = executeOpenBBCommand('cli.equity.price.historical("AAPL")');
  assert.equal(pyRes.type, "table");
  assert.ok(pyRes.tableData);

  // Unknown command
  const errRes = executeOpenBBCommand("random_command_xyz");
  assert.equal(errRes.type, "error");
});
