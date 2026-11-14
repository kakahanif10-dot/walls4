import test from "node:test";
import assert from "node:assert/strict";
import {
  SENTIMENT_BANDS,
  buildFallbackHistory,
  clampScore,
  classifySentiment,
  computeSentimentStats,
  normalizeAlternativeMeEntries,
} from "./crypto-fear-greed";

test("clampScore bounds values to [0, 100] and handles non-finite inputs", () => {
  assert.equal(clampScore(-12), 0);
  assert.equal(clampScore(135), 100);
  assert.equal(clampScore(44.6), 45);
  assert.equal(clampScore(Number.NaN), 50);
});

test("classifySentiment maps all 5 sentiment regimes cleanly", () => {
  assert.equal(classifySentiment(13).zone, "Extreme Fear");
  assert.equal(classifySentiment(24).zone, "Extreme Fear");
  assert.equal(classifySentiment(25).zone, "Fear");
  assert.equal(classifySentiment(45).zone, "Fear");
  assert.equal(classifySentiment(50).zone, "Neutral");
  assert.equal(classifySentiment(62).zone, "Greed");
  assert.equal(classifySentiment(75).zone, "Extreme Greed");
  assert.equal(classifySentiment(94).zone, "Extreme Greed");
  assert.equal(SENTIMENT_BANDS.length, 5);
});

test("normalizeAlternativeMeEntries sorts chronologically and deduplicates dates", () => {
  const raw = [
    { value: "13", value_classification: "Extreme Fear", timestamp: "1731542400" }, // 2024-11-14
    { value: "28", value_classification: "Fear", timestamp: "1731369600" }, // 2024-11-12
    { value: "20", value_classification: "Extreme Fear", timestamp: "1731456000" }, // 2024-11-13
    { value: "21", value_classification: "Extreme Fear", timestamp: "1731456000" }, // duplicate date
  ];
  const normalized = normalizeAlternativeMeEntries(raw);
  assert.equal(normalized.length, 3);
  assert.equal(normalized[0].value, 28);
  assert.equal(normalized[1].value, 21);
  assert.equal(normalized[2].value, 13);
});

test("computeSentimentStats computes deltas, averages, extreme day counts, and streaks", () => {
  const baseTs = 1730000000;
  const pts = Array.from({ length: 35 }, (_, i) => {
    const val = i >= 32 ? 18 : i < 3 ? 80 : 40;
    return {
      timestamp: baseTs + i * 86400,
      date: new Date((baseTs + i * 86400) * 1000).toISOString().slice(0, 10),
      value: val,
      classification: classifySentiment(val).zone,
    };
  });

  const stats = computeSentimentStats(pts);
  assert.equal(stats.current.value, 18);
  assert.equal(stats.meta.zone, "Extreme Fear");
  assert.equal(stats.streakDays, 3);
  assert.equal(stats.streakZone, "Extreme Fear");
  assert.equal(stats.extremeFearDays30d, 3);
  assert.equal(stats.delta24h, 0);
  assert.equal(stats.delta7d, 18 - 40);
  assert.equal(stats.min30d, 18);
  assert.equal(stats.max30d, 40);
  assert.ok(stats.zScore30d < -1.5);
});

test("buildFallbackHistory generates requested chronological day count", () => {
  const series = buildFallbackHistory(60);
  assert.equal(series.length, 60);
  assert.ok(series[0].timestamp < series[59].timestamp);
  assert.ok(series.every((p) => p.value >= 0 && p.value <= 100));
});
