export type TerminalAssetFramework = "Equity" | "Digital Asset" | "Speculative/Meme";

export type TerminalStance = "BUY" | "SPECULATIVE BUY" | "NEUTRAL" | "INVALIDATED";

export type OutcomeStatus = "Valid" | "Invalidated";

export interface MovingAverageSlope {
  period: "20D SMA" | "50D SMA" | "200D SMA";
  value: number;
  slopePct: number;
  direction: "up" | "flat" | "down";
}

export interface SignalAuditRow {
  id: string;
  date: string;
  stance: "BUY" | "SPECULATIVE BUY" | "HOLD";
  entryPrice: number;
  invalidationLevel: number;
  outcome: OutcomeStatus;
  returnPct: number;
}

export interface TerminalAsset {
  symbol: string;
  name: string;
  framework: TerminalAssetFramework;
  price: number;
  priceDecimals: number;
  unitLabel: string;
  trendScore: number;
  confidencePct: number;
  confidenceLabel: string;
  stance: "BUY" | "SPECULATIVE BUY";
  invalidationPrice: number;
  riskGrade: "Moderate" | "Elevated" | "Extreme - Hard Cap";
  maxRiskCapPct: number;
  maxWeightCapPct: number;
  pillars: {
    structure: {
      score: number;
      weightPct: 40;
      smas: MovingAverageSlope[];
    };
    momentum: {
      score: number;
      weightPct: 35;
      roc30dPct: number;
      rsi14: number;
      rsiZoneLabel: string;
    };
    risk: {
      score: number;
      weightPct: 25;
      realizedVolPct: number;
      low52w: number;
      high52w: number;
    };
  };
  performanceSummary: {
    winRatePct: number;
    avgGainPct: number;
    avgLossPct: number;
    profitFactor: number;
  };
  auditTrail: SignalAuditRow[];
}

export const TERMINAL_ASSETS: TerminalAsset[] = [
  {
    symbol: "NVDA",
    name: "NVIDIA Corp.",
    framework: "Equity",
    price: 138.4,
    priceDecimals: 2,
    unitLabel: "shares",
    trendScore: 84,
    confidencePct: 88,
    confidenceLabel: "Low Noise",
    stance: "BUY",
    invalidationPrice: 126.5,
    riskGrade: "Moderate",
    maxRiskCapPct: 2.0,
    maxWeightCapPct: 25.0,
    pillars: {
      structure: {
        score: 88,
        weightPct: 40,
        smas: [
          { period: "20D SMA", value: 134.8, slopePct: 2.4, direction: "up" },
          { period: "50D SMA", value: 129.1, slopePct: 3.8, direction: "up" },
          { period: "200D SMA", value: 114.6, slopePct: 6.2, direction: "up" },
        ],
      },
      momentum: {
        score: 82,
        weightPct: 35,
        roc30dPct: 14.8,
        rsi14: 63.4,
        rsiZoneLabel: "Trend Persistence (55–72)",
      },
      risk: {
        score: 79,
        weightPct: 25,
        realizedVolPct: 34.2,
        low52w: 75.6,
        high52w: 144.2,
      },
    },
    performanceSummary: {
      winRatePct: 68.4,
      avgGainPct: 24.2,
      avgLossPct: -7.8,
      profitFactor: 2.41,
    },
    auditTrail: [
      {
        id: "nvda-5",
        date: "2026-10-14",
        stance: "BUY",
        entryPrice: 124.8,
        invalidationLevel: 114.2,
        outcome: "Valid",
        returnPct: 10.9,
      },
      {
        id: "nvda-4",
        date: "2026-08-29",
        stance: "BUY",
        entryPrice: 119.4,
        invalidationLevel: 110.5,
        outcome: "Invalidated",
        returnPct: -7.45,
      },
      {
        id: "nvda-3",
        date: "2026-06-18",
        stance: "BUY",
        entryPrice: 103.6,
        invalidationLevel: 95.1,
        outcome: "Valid",
        returnPct: 26.8,
      },
      {
        id: "nvda-2",
        date: "2026-04-08",
        stance: "BUY",
        entryPrice: 88.2,
        invalidationLevel: 80.9,
        outcome: "Valid",
        returnPct: 31.4,
      },
      {
        id: "nvda-1",
        date: "2026-02-11",
        stance: "HOLD",
        entryPrice: 84.5,
        invalidationLevel: 77.6,
        outcome: "Invalidated",
        returnPct: -8.17,
      },
    ],
  },
  {
    symbol: "SOL",
    name: "Solana",
    framework: "Digital Asset",
    price: 214.2,
    priceDecimals: 2,
    unitLabel: "SOL",
    trendScore: 76,
    confidencePct: 79,
    confidenceLabel: "Moderate Noise",
    stance: "BUY",
    invalidationPrice: 189.0,
    riskGrade: "Elevated",
    maxRiskCapPct: 1.5,
    maxWeightCapPct: 12.0,
    pillars: {
      structure: {
        score: 80,
        weightPct: 40,
        smas: [
          { period: "20D SMA", value: 204.5, slopePct: 3.1, direction: "up" },
          { period: "50D SMA", value: 188.4, slopePct: 4.6, direction: "up" },
          { period: "200D SMA", value: 159.2, slopePct: 5.4, direction: "up" },
        ],
      },
      momentum: {
        score: 76,
        weightPct: 35,
        roc30dPct: 18.4,
        rsi14: 61.2,
        rsiZoneLabel: "Trend Persistence (55–72)",
      },
      risk: {
        score: 69,
        weightPct: 25,
        realizedVolPct: 58.5,
        low52w: 98.4,
        high52w: 238.0,
      },
    },
    performanceSummary: {
      winRatePct: 61.5,
      avgGainPct: 31.8,
      avgLossPct: -11.4,
      profitFactor: 2.12,
    },
    auditTrail: [
      {
        id: "sol-5",
        date: "2026-10-09",
        stance: "BUY",
        entryPrice: 176.4,
        invalidationLevel: 156.8,
        outcome: "Valid",
        returnPct: 21.43,
      },
      {
        id: "sol-4",
        date: "2026-08-21",
        stance: "BUY",
        entryPrice: 162.0,
        invalidationLevel: 143.5,
        outcome: "Invalidated",
        returnPct: -11.42,
      },
      {
        id: "sol-3",
        date: "2026-06-12",
        stance: "BUY",
        entryPrice: 141.2,
        invalidationLevel: 124.0,
        outcome: "Valid",
        returnPct: 34.7,
      },
      {
        id: "sol-2",
        date: "2026-04-02",
        stance: "HOLD",
        entryPrice: 138.9,
        invalidationLevel: 121.8,
        outcome: "Invalidated",
        returnPct: -12.31,
      },
      {
        id: "sol-1",
        date: "2026-01-27",
        stance: "BUY",
        entryPrice: 102.5,
        invalidationLevel: 90.4,
        outcome: "Valid",
        returnPct: 48.2,
      },
    ],
  },
  {
    symbol: "PEPE",
    name: "Pepe",
    framework: "Speculative/Meme",
    price: 0.0000185,
    priceDecimals: 7,
    unitLabel: "PEPE",
    trendScore: 68,
    confidencePct: 64,
    confidenceLabel: "Elevated Noise",
    stance: "SPECULATIVE BUY",
    invalidationPrice: 0.0000142,
    riskGrade: "Extreme - Hard Cap",
    maxRiskCapPct: 0.5,
    maxWeightCapPct: 2.0,
    pillars: {
      structure: {
        score: 74,
        weightPct: 40,
        smas: [
          { period: "20D SMA", value: 0.0000171, slopePct: 4.8, direction: "up" },
          { period: "50D SMA", value: 0.0000149, slopePct: 5.2, direction: "up" },
          { period: "200D SMA", value: 0.0000112, slopePct: 3.1, direction: "up" },
        ],
      },
      momentum: {
        score: 72,
        weightPct: 35,
        roc30dPct: 29.6,
        rsi14: 66.8,
        rsiZoneLabel: "High-Beta Impulse (60–75)",
      },
      risk: {
        score: 53,
        weightPct: 25,
        realizedVolPct: 112.4,
        low52w: 0.0000052,
        high52w: 0.0000248,
      },
    },
    performanceSummary: {
      winRatePct: 52.0,
      avgGainPct: 46.5,
      avgLossPct: -18.9,
      profitFactor: 1.74,
    },
    auditTrail: [
      {
        id: "pepe-5",
        date: "2026-10-19",
        stance: "SPECULATIVE BUY",
        entryPrice: 0.0000138,
        invalidationLevel: 0.000011,
        outcome: "Valid",
        returnPct: 34.06,
      },
      {
        id: "pepe-4",
        date: "2026-09-05",
        stance: "SPECULATIVE BUY",
        entryPrice: 0.0000152,
        invalidationLevel: 0.0000121,
        outcome: "Invalidated",
        returnPct: -20.39,
      },
      {
        id: "pepe-3",
        date: "2026-07-11",
        stance: "SPECULATIVE BUY",
        entryPrice: 0.0000094,
        invalidationLevel: 0.0000075,
        outcome: "Valid",
        returnPct: 68.1,
      },
      {
        id: "pepe-2",
        date: "2026-05-03",
        stance: "HOLD",
        entryPrice: 0.0000118,
        invalidationLevel: 0.0000096,
        outcome: "Invalidated",
        returnPct: -18.64,
      },
      {
        id: "pepe-1",
        date: "2026-03-14",
        stance: "SPECULATIVE BUY",
        entryPrice: 0.0000068,
        invalidationLevel: 0.0000054,
        outcome: "Valid",
        returnPct: 54.41,
      },
    ],
  },
];

export interface PositionSizingInput {
  portfolioCapital: number;
  maxRiskPct: number;
  entryPrice: number;
  invalidationPrice: number;
  asset: TerminalAsset;
}

export interface RMultipleTarget {
  multiple: 1 | 2 | 3;
  price: number;
  gainPct: number;
  profitDollars: number;
}

export interface PositionSizingOutput {
  isValid: boolean;
  validationMessage: string | null;
  positionDollars: number;
  quantity: number;
  portfolioWeightPct: number;
  distanceToInvalidationPct: number;
  maxDollarLoss: number;
  riskPerUnit: number;
  exceedsRiskCap: boolean;
  exceedsWeightCap: boolean;
  targets: RMultipleTarget[];
}

export function calculatePositionSizing(input: PositionSizingInput): PositionSizingOutput {
  const capital = Number.isFinite(input.portfolioCapital) && input.portfolioCapital > 0 ? input.portfolioCapital : 0;
  const riskPct = Number.isFinite(input.maxRiskPct) && input.maxRiskPct > 0 ? input.maxRiskPct : 0;
  const entry = Number.isFinite(input.entryPrice) && input.entryPrice > 0 ? input.entryPrice : 0;
  const stop = Number.isFinite(input.invalidationPrice) && input.invalidationPrice > 0 ? input.invalidationPrice : 0;

  const exceedsRiskCap = riskPct > input.asset.maxRiskCapPct + 1e-9;

  if (capital <= 0 || entry <= 0 || stop <= 0) {
    return {
      isValid: false,
      validationMessage: "Enter positive portfolio capital, entry price, and invalidation level.",
      positionDollars: 0,
      quantity: 0,
      portfolioWeightPct: 0,
      distanceToInvalidationPct: 0,
      maxDollarLoss: 0,
      riskPerUnit: 0,
      exceedsRiskCap,
      exceedsWeightCap: false,
      targets: [
        { multiple: 1, price: entry, gainPct: 0, profitDollars: 0 },
        { multiple: 2, price: entry, gainPct: 0, profitDollars: 0 },
        { multiple: 3, price: entry, gainPct: 0, profitDollars: 0 },
      ],
    };
  }

  if (stop >= entry) {
    return {
      isValid: false,
      validationMessage: "Invalidation level must sit strictly below the entry price for long trend sizing.",
      positionDollars: 0,
      quantity: 0,
      portfolioWeightPct: 0,
      distanceToInvalidationPct: ((stop - entry) / entry) * 100,
      maxDollarLoss: -(capital * (riskPct / 100)),
      riskPerUnit: 0,
      exceedsRiskCap,
      exceedsWeightCap: false,
      targets: [
        { multiple: 1, price: entry, gainPct: 0, profitDollars: 0 },
        { multiple: 2, price: entry, gainPct: 0, profitDollars: 0 },
        { multiple: 3, price: entry, gainPct: 0, profitDollars: 0 },
      ],
    };
  }

  const maxRiskAmount = capital * (riskPct / 100);
  const riskPerUnit = entry - stop;
  const quantity = maxRiskAmount / riskPerUnit;
  const positionDollars = quantity * entry;
  const portfolioWeightPct = (positionDollars / capital) * 100;
  const distanceToInvalidationPct = ((stop - entry) / entry) * 100;

  const targets: RMultipleTarget[] = ([1, 2, 3] as const).map((multiple) => {
    const targetPrice = entry + multiple * riskPerUnit;
    const gainPct = ((targetPrice - entry) / entry) * 100;
    return {
      multiple,
      price: targetPrice,
      gainPct,
      profitDollars: maxRiskAmount * multiple,
    };
  });

  return {
    isValid: true,
    validationMessage: null,
    positionDollars,
    quantity,
    portfolioWeightPct,
    distanceToInvalidationPct,
    maxDollarLoss: -maxRiskAmount,
    riskPerUnit,
    exceedsRiskCap,
    exceedsWeightCap: portfolioWeightPct > input.asset.maxWeightCapPct,
    targets,
  };
}

export interface WhatIfSimulationResult {
  deltaPct: number;
  simulatedPrice: number;
  compositeScore: number;
  structureScore: number;
  momentumScore: number;
  riskScore: number;
  stance: TerminalStance;
  isInvalidated: boolean;
  neutralDowngradePrice: number;
  neutralDowngradePct: number;
  invalidationPct: number;
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

/**
 * Deterministic sensitivity model anchored at deltaPct = 0 matching the asset's
 * current 40/35/25 pillar scores and invalidation boundary.
 */
export function simulateWhatIfScore(asset: TerminalAsset, deltaPct: number): WhatIfSimulationResult {
  const clampedDelta = Math.max(-20, Math.min(20, deltaPct));
  const simulatedPrice = asset.price * (1 + clampedDelta / 100);

  // Calibrated slopes so composite drop crosses < 60 (NEUTRAL) cleanly prior to hard invalidation.
  const structureSensitivity = clampedDelta >= 0 ? 0.55 : 3.8;
  const momentumSensitivity = clampedDelta >= 0 ? 0.85 : 4.2;
  const riskSensitivity = clampedDelta >= 0 ? 0.25 : 2.6;

  const structureScore = clampScore(asset.pillars.structure.score + clampedDelta * structureSensitivity);
  const momentumScore = clampScore(asset.pillars.momentum.score + clampedDelta * momentumSensitivity);
  const riskScore = clampScore(asset.pillars.risk.score + clampedDelta * riskSensitivity);

  const compositeScore = clampScore(
    structureScore * 0.4 + momentumScore * 0.35 + riskScore * 0.25,
  );

  const isInvalidated = simulatedPrice <= asset.invalidationPrice;
  let stance: TerminalStance;
  if (isInvalidated) {
    stance = "INVALIDATED";
  } else if (compositeScore >= 60) {
    stance = asset.stance;
  } else {
    stance = "NEUTRAL";
  }

  // Exact downgrade delta where weighted composite falls below 60 (< 60, i.e., 59.49 boundary).
  const downsideSlope = 3.8 * 0.4 + 4.2 * 0.35 + 2.6 * 0.25; // 3.64 pts per -1% move
  const rawNeutralDeltaPct = -((asset.trendScore - 59.49) / downsideSlope);
  const neutralDowngradePrice = asset.price * (1 + rawNeutralDeltaPct / 100);
  const invalidationPct = ((asset.invalidationPrice - asset.price) / asset.price) * 100;

  return {
    deltaPct: clampedDelta,
    simulatedPrice,
    compositeScore,
    structureScore,
    momentumScore,
    riskScore,
    stance,
    isInvalidated,
    neutralDowngradePrice,
    neutralDowngradePct: rawNeutralDeltaPct,
    invalidationPct,
  };
}

export function formatAssetPrice(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  if (decimals <= 2) {
    return `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }
  return `$${value.toFixed(decimals)}`;
}

export function formatUsd(value: number): string {
  if (!Number.isFinite(value)) return "$0.00";
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatQuantity(value: number, unitLabel: string): string {
  if (!Number.isFinite(value) || value <= 0) return `0 ${unitLabel}`;
  if (value >= 10000) {
    return `${Math.round(value).toLocaleString("en-US")} ${unitLabel}`;
  }
  return `${value.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} ${unitLabel}`;
}

export type AuditSortField = "date" | "stance" | "entryPrice" | "invalidationLevel" | "outcome" | "returnPct";
export type SortDirection = "asc" | "desc";

export function sortAuditRows(
  rows: SignalAuditRow[],
  field: AuditSortField,
  direction: SortDirection,
): SignalAuditRow[] {
  const mult = direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    switch (field) {
      case "date":
        return a.date.localeCompare(b.date) * mult;
      case "stance":
        return a.stance.localeCompare(b.stance) * mult;
      case "entryPrice":
        return (a.entryPrice - b.entryPrice) * mult;
      case "invalidationLevel":
        return (a.invalidationLevel - b.invalidationLevel) * mult;
      case "outcome":
        return a.outcome.localeCompare(b.outcome) * mult;
      case "returnPct":
        return (a.returnPct - b.returnPct) * mult;
    }
  });
}

export function formatTradePlanText(
  asset: TerminalAsset,
  input: {
    portfolioCapital: number;
    maxRiskPct: number;
    entryPrice: number;
    invalidationPrice: number;
  },
  sizing: PositionSizingOutput,
): string {
  const lines = [
    `NEXTWALLSTREET EXECUTION & RISK PLAN — ${asset.symbol} (${asset.name})`,
    `Framework: ${asset.framework} | Model Score: ${asset.trendScore}/100 | Stance: ${asset.stance} | Risk Grade: ${asset.riskGrade}`,
    `Portfolio Capital: ${formatUsd(input.portfolioCapital)} | Risk Budget: ${input.maxRiskPct.toFixed(2)}% (${formatUsd(sizing.maxDollarLoss)})`,
    `Entry Price: ${formatAssetPrice(input.entryPrice, asset.priceDecimals)} | Invalidation: ${formatAssetPrice(input.invalidationPrice, asset.priceDecimals)} (${sizing.distanceToInvalidationPct.toFixed(2)}%)`,
    `Position Size: ${formatUsd(sizing.positionDollars)} (${formatQuantity(sizing.quantity, asset.unitLabel)}) | Portfolio Weight: ${sizing.portfolioWeightPct.toFixed(2)}%`,
    `R-Multiple Ladder: 1R ${formatAssetPrice(sizing.targets[0].price, asset.priceDecimals)} | 2R ${formatAssetPrice(sizing.targets[1].price, asset.priceDecimals)} | 3R ${formatAssetPrice(sizing.targets[2].price, asset.priceDecimals)}`,
  ];
  return lines.join("\n");
}

export function buildAuditCsv(asset: TerminalAsset): string {
  const header = ["Asset", "Framework", "Date", "Signal Stance", "Entry Price", "Invalidation Level", "Outcome", "Return (%)"];
  const rows = asset.auditTrail.map((r) => [
    asset.symbol,
    asset.framework,
    r.date,
    r.stance,
    r.entryPrice.toFixed(asset.priceDecimals),
    r.invalidationLevel.toFixed(asset.priceDecimals),
    r.outcome,
    `${r.returnPct >= 0 ? "+" : ""}${r.returnPct.toFixed(2)}%`,
  ]);
  return [header, ...rows].map((cols) => cols.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
}
