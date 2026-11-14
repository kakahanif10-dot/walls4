import test from "node:test";
import assert from "node:assert/strict";
import {
  TERMINAL_ASSETS,
  calculatePositionSizing,
  simulateWhatIfScore,
  sortAuditRows,
  formatTradePlanText,
  buildAuditCsv,
} from "./execution-risk-terminal";

test("TERMINAL_ASSETS contains NVDA, SOL, and PEPE with accurate weighted pillar scores", () => {
  assert.equal(TERMINAL_ASSETS.length, 3);
  assert.deepEqual(
    TERMINAL_ASSETS.map((a) => a.symbol),
    ["NVDA", "SOL", "PEPE"],
  );

  for (const asset of TERMINAL_ASSETS) {
    const weighted = Math.round(
      asset.pillars.structure.score * 0.4 +
        asset.pillars.momentum.score * 0.35 +
        asset.pillars.risk.score * 0.25,
    );
    assert.equal(weighted, asset.trendScore, `${asset.symbol} weighted score mismatch`);
    assert.equal(asset.auditTrail.length, 5, `${asset.symbol} should have 5 historical calls`);
  }
});

test("calculatePositionSizing matches exact NVDA baseline figures ($50k, 1.0%, $138.40, $126.50)", () => {
  const nvda = TERMINAL_ASSETS[0];
  const res = calculatePositionSizing({
    portfolioCapital: 50000,
    maxRiskPct: 1.0,
    entryPrice: nvda.price,
    invalidationPrice: nvda.invalidationPrice,
    asset: nvda,
  });

  assert.equal(res.isValid, true);
  assert.equal(res.exceedsRiskCap, false);
  assert.equal(Number(res.positionDollars.toFixed(2)), 5815.13);
  assert.equal(Number(res.quantity.toFixed(2)), 42.02);
  assert.equal(Number(res.portfolioWeightPct.toFixed(2)), 11.63);
  assert.equal(Number(res.distanceToInvalidationPct.toFixed(2)), -8.6);
  assert.equal(Number(res.maxDollarLoss.toFixed(2)), -500.0);

  // R-Multiple Targets: riskPerUnit = 11.90
  assert.equal(Number(res.targets[0].price.toFixed(2)), 150.3);
  assert.equal(Number(res.targets[1].price.toFixed(2)), 162.2);
  assert.equal(Number(res.targets[2].price.toFixed(2)), 174.1);
});

test("calculatePositionSizing enforces risk grade cap warning for Speculative/Meme PEPE", () => {
  const pepe = TERMINAL_ASSETS[2];
  const overCap = calculatePositionSizing({
    portfolioCapital: 50000,
    maxRiskPct: 1.0,
    entryPrice: pepe.price,
    invalidationPrice: pepe.invalidationPrice,
    asset: pepe,
  });
  assert.equal(overCap.exceedsRiskCap, true);

  const withinCap = calculatePositionSizing({
    portfolioCapital: 50000,
    maxRiskPct: 0.5,
    entryPrice: pepe.price,
    invalidationPrice: pepe.invalidationPrice,
    asset: pepe,
  });
  assert.equal(withinCap.exceedsRiskCap, false);
  assert.equal(Number(withinCap.maxDollarLoss.toFixed(2)), -250.0);
});

test("calculatePositionSizing rejects invalidation >= entryPrice cleanly", () => {
  const nvda = TERMINAL_ASSETS[0];
  const invalid = calculatePositionSizing({
    portfolioCapital: 50000,
    maxRiskPct: 1.0,
    entryPrice: 120,
    invalidationPrice: 126.5,
    asset: nvda,
  });
  assert.equal(invalid.isValid, false);
  assert.equal(invalid.positionDollars, 0);
  assert.ok(invalid.validationMessage);
});

test("simulateWhatIfScore preserves baseline at 0%, downgrades below 60 to NEUTRAL, and hits INVALIDATED at stop", () => {
  const nvda = TERMINAL_ASSETS[0];
  const base = simulateWhatIfScore(nvda, 0);
  assert.equal(base.compositeScore, nvda.trendScore);
  assert.equal(base.stance, "BUY");
  assert.equal(base.isInvalidated, false);

  const neutralDrop = simulateWhatIfScore(nvda, -7.5);
  assert.ok(neutralDrop.compositeScore < 60, `Expected < 60, got ${neutralDrop.compositeScore}`);
  assert.equal(neutralDrop.stance, "NEUTRAL");
  assert.equal(neutralDrop.isInvalidated, false);

  const stopHit = simulateWhatIfScore(nvda, -10);
  assert.equal(stopHit.isInvalidated, true);
  assert.equal(stopHit.stance, "INVALIDATED");
});

test("sortAuditRows sorts by returnPct and date correctly", () => {
  const nvda = TERMINAL_ASSETS[0];
  const byReturnDesc = sortAuditRows(nvda.auditTrail, "returnPct", "desc");
  assert.equal(byReturnDesc[0].returnPct, 31.4);
  assert.equal(byReturnDesc[byReturnDesc.length - 1].returnPct, -8.17);

  const byDateAsc = sortAuditRows(nvda.auditTrail, "date", "asc");
  assert.equal(byDateAsc[0].date, "2026-02-11");
});

test("formatTradePlanText and buildAuditCsv produce clean institutional outputs", () => {
  const nvda = TERMINAL_ASSETS[0];
  const sizing = calculatePositionSizing({
    portfolioCapital: 50000,
    maxRiskPct: 1.0,
    entryPrice: nvda.price,
    invalidationPrice: nvda.invalidationPrice,
    asset: nvda,
  });

  const plan = formatTradePlanText(
    nvda,
    { portfolioCapital: 50000, maxRiskPct: 1.0, entryPrice: nvda.price, invalidationPrice: nvda.invalidationPrice },
    sizing,
  );
  assert.match(plan, /NVDA/);
  assert.match(plan, /\$5,815\.13/);
  assert.match(plan, /-8\.60%/);

  const csv = buildAuditCsv(nvda);
  const lines = csv.split("\n");
  assert.equal(lines.length, 6);
  assert.match(lines[0], /"Signal Stance","Entry Price","Invalidation Level","Outcome","Return \(%\)"/);
});
