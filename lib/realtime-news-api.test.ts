import test from "node:test";
import assert from "node:assert/strict";
import {
  INITIAL_REALTIME_ARTICLES,
  NEWS_CATEGORIES,
  computeCategoryCounts,
  filterArticlesByCriteria,
  filterRealtimeArticles,
  normalizeCategoryMatch,
} from "./realtime-news-api";

test("NEWS_CATEGORIES includes Geopolitics, Earnings, and SEC Filings and every category has initial coverage", () => {
  assert.ok(NEWS_CATEGORIES.includes("Geopolitics"));
  assert.ok(NEWS_CATEGORIES.includes("Earnings"));
  assert.ok(NEWS_CATEGORIES.includes("SEC Filings"));

  const counts = computeCategoryCounts(INITIAL_REALTIME_ARTICLES);
  assert.equal(counts.ALL, INITIAL_REALTIME_ARTICLES.length);

  for (const cat of NEWS_CATEGORIES) {
    assert.ok((counts[cat] ?? 0) >= 1, `Expected at least 1 initial article for category ${cat}`);
  }
});

test("filterArticlesByCriteria refines feed accurately by Geopolitics, Earnings, and SEC Filings", () => {
  const geo = filterArticlesByCriteria(INITIAL_REALTIME_ARTICLES, { category: "Geopolitics" });
  assert.equal(geo.length, 2);
  assert.ok(geo.every((a) => a.category === "Geopolitics"));

  const earnings = filterArticlesByCriteria(INITIAL_REALTIME_ARTICLES, { category: "Earnings" });
  assert.equal(earnings.length, 2);
  assert.ok(earnings.every((a) => a.category === "Earnings"));

  const sec = filterArticlesByCriteria(INITIAL_REALTIME_ARTICLES, { category: "SEC Filings" });
  assert.equal(sec.length, 2);
  assert.ok(sec.every((a) => a.category === "SEC Filings"));
});

test("normalizeCategoryMatch supports singular/plural SEC Filing queries cleanly", () => {
  assert.equal(normalizeCategoryMatch("SEC Filings", "SEC Filing"), true);
  assert.equal(normalizeCategoryMatch("SEC Filings", "SEC Filings"), true);
  assert.equal(normalizeCategoryMatch("Geopolitics", "geopolitics"), true);
  assert.equal(normalizeCategoryMatch("Geopolitics", "Earnings"), false);

  const secLucene = filterRealtimeArticles('category:"SEC Filing"', INITIAL_REALTIME_ARTICLES);
  assert.equal(secLucene.length, 2);
});

test("filterArticlesByCriteria combines Lucene query, category, sentiment, and watchlist filters", () => {
  const nvdaGeo = filterArticlesByCriteria(INITIAL_REALTIME_ARTICLES, {
    queryString: "symbols:NVDA",
    category: "Geopolitics",
  });
  assert.equal(nvdaGeo.length, 1);
  assert.equal(nvdaGeo[0]?.id, "rt-012");

  const emptyBearishEarnings = filterArticlesByCriteria(INITIAL_REALTIME_ARTICLES, {
    category: "Earnings",
    sentiment: "BEARISH",
  });
  assert.equal(emptyBearishEarnings.length, 0);

  const watchlistSec = filterArticlesByCriteria(INITIAL_REALTIME_ARTICLES, {
    category: "SEC Filings",
    hasWatchlistSymbol: (sym) => sym === "MSFT",
  });
  assert.equal(watchlistSec.length, 1);
  assert.equal(watchlistSec[0]?.id, "rt-013");
});
