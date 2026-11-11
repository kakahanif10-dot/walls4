import test from "node:test";
import assert from "node:assert/strict";
import { searchGlobalCatalog } from "./global-search";

test("Empty query returns curated featured items across assets, articles, and desks", () => {
  const result = searchGlobalCatalog("");
  assert.equal(result.isFeatured, true);
  assert.ok(result.assets.length > 0, "Should return featured assets");
  assert.ok(result.articles.length > 0, "Should return featured articles");
  assert.ok(result.desks.length > 0, "Should return featured analyst desks");
  assert.equal(result.assets[0].symbol, "NVDA");
});

test("Exact symbol search ranks exact asset match first and finds related articles and desks", () => {
  const result = searchGlobalCatalog("nvda");
  assert.equal(result.isFeatured, false);
  assert.ok(result.assets.length > 0, "Should match NVDA asset");
  assert.equal(result.assets[0].symbol, "NVDA");
  assert.equal(result.assets[0].href, "/ticker/NVDA");
  assert.ok(result.desks.some((d) => d.focusTickers.includes("NVDA")), "Should match AI desk focusing on NVDA");
});

test("Search by asset name, article topic, or analyst desk name returns relevant results", () => {
  const apple = searchGlobalCatalog("Apple");
  assert.ok(apple.assets.some((a) => a.symbol === "AAPL"), "Should match Apple by name");

  const semi = searchGlobalCatalog("Semiconductor");
  assert.ok(semi.desks.some((d) => d.name.includes("Semiconductor")), "Should match Semiconductor desk");
  assert.ok(semi.assets.length > 0, "Should match semiconductor assets");
});

test("Scope filtering restricts results to the requested category", () => {
  const assetsOnly = searchGlobalCatalog("BTC", { scope: "assets" });
  assert.ok(assetsOnly.assets.length > 0);
  assert.equal(assetsOnly.articles.length, 0);
  assert.equal(assetsOnly.desks.length, 0);

  const desksOnly = searchGlobalCatalog("Crypto", { scope: "desks" });
  assert.equal(desksOnly.assets.length, 0);
  assert.equal(desksOnly.articles.length, 0);
  assert.ok(desksOnly.desks.length > 0);
});

test("Unknown query returns empty arrays and zero total count", () => {
  const none = searchGlobalCatalog("zzzznonexistent999");
  assert.equal(none.isFeatured, false);
  assert.equal(none.counts.total, 0);
  assert.equal(none.assets.length, 0);
  assert.equal(none.articles.length, 0);
  assert.equal(none.desks.length, 0);
});
