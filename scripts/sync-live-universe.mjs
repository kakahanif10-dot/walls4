import fs from "node:fs";
import path from "node:path";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

function stripMeta(text) {
  return String(text || "").replace(/\s+/g, " ").trim();
}

function makeStockEntry(symbol, name, group, price) {
  return {
    symbol,
    name: stripMeta(name) || symbol,
    kind: "stock",
    group: group || "US Equities",
    base: Number(price.toFixed(price >= 10 ? 2 : 4)),
    blurb: `${name} (${symbol}) is a publicly traded US equity in ${group || "US Equities"}, tracked with live exchange pricing, moving-average structure, and rules-based trend scoring.`,
    bull: [
      `Institutional liquidity and active order-book depth on major US exchanges.`,
      `Sustained relative strength against sector peers and major US equity benchmarks.`,
      `Disciplined capital allocation and operating leverage supporting multi-quarter trend durability.`,
    ],
    bear: [
      `Sensitive to broader macro rate expectations and risk-off index rotations.`,
      `Valuation multiple compression risk if forward guidance decelerates.`,
      `Sector-specific competitive pressures and quarterly earnings volatility.`,
    ],
    catalysts: [
      `Quarterly earnings release and forward revenue guidance`,
      `Institutional fund rebalancing and sector ETF flows`,
      `Macro interest-rate and liquidity shifts`,
    ],
  };
}

function makeCryptoEntry(symbol, name, group, price) {
  return {
    symbol,
    name: stripMeta(name) || symbol,
    kind: "crypto",
    group: group || "Digital Assets / Spot",
    base: Number(price >= 1 ? price.toFixed(4) : price.toPrecision(4)),
    blurb: `${name} (${symbol}) is a live exchange-traded digital asset on ${group || "major global spot venues"}, tracked continuously via real-time spot order books and 24/7 momentum indicators.`,
    bull: [
      `Continuous 24/7 global liquidity across tier-1 centralized spot exchanges.`,
      `Growing ecosystem participation, on-chain settlement velocity, and cross-venue depth.`,
      `High beta responsiveness to broader digital asset liquidity expansion cycles.`,
    ],
    bear: [
      `Amplified drawdowns during macro risk-off de-leveraging events across crypto derivatives.`,
      `Circulating supply emissions and token unlock schedules can create overhead supply.`,
      `Regulatory developments and shifting market structure across global jurisdictions.`,
    ],
    catalysts: [
      `Protocol network upgrades and ecosystem developer milestones`,
      `Exchange spot volume expansion and perpetual open-interest shifts`,
      `Bitcoin dominance rotations and macro dollar liquidity trends`,
    ],
  };
}

function makeMemeEntry(symbol, name, group, price) {
  return {
    symbol,
    name: stripMeta(name) || symbol,
    kind: "meme",
    group: group || "Meme / Community Tokens",
    base: Number(price >= 1 ? price.toFixed(4) : price.toPrecision(4)),
    blurb: `${name} (${symbol}) is an exchange-traded community & meme token tracked across real-time spot and DEX venues with strict volatility-adjusted position sizing.`,
    bull: [
      `High organic retail mindshare and continuous 24/7 spot exchange liquidity.`,
      `Reflexive upside momentum during risk-on speculative market rotations.`,
      `Deep community distribution across active Solana, Ethereum, and Base trading venues.`,
    ],
    bear: [
      `Elevated realized volatility requires tight invalidation levels and reduced position sizing.`,
      `Narrative-driven flows rotate rapidly between viral community themes.`,
      `Severe drawdown risk when market-wide risk appetite contracts.`,
    ],
    catalysts: [
      `Major centralized exchange spot and perpetual listings`,
      `Viral community campaigns and social attention surges`,
      `Altcoin & meme sector capital rotation waves`,
    ],
  };
}

async function fetchLiveStocks() {
  const cols = [
    "name",
    "close",
    "change",
    "volume",
    "market_cap_basic",
    "sector",
    "exchange",
    "type",
    "description",
  ];
  const [r1, r2] = await Promise.all([
    fetch("https://scanner.tradingview.com/america/scan", {
      method: "POST",
      headers: { "User-Agent": UA, "Content-Type": "application/json" },
      body: JSON.stringify({
        filter: [
          {
            left: "exchange",
            operation: "in_range",
            right: ["NASDAQ", "NYSE", "AMEX", "ARCA", "BATS", "CBOE"],
          },
        ],
        columns: cols,
        sort: { sortBy: "volume", sortOrder: "desc" },
        range: [0, 6000],
      }),
    }).then((r) => r.json()),
    fetch("https://scanner.tradingview.com/america/scan", {
      method: "POST",
      headers: { "User-Agent": UA, "Content-Type": "application/json" },
      body: JSON.stringify({
        filter: [
          {
            left: "exchange",
            operation: "in_range",
            right: ["NASDAQ", "NYSE", "AMEX", "ARCA", "BATS", "CBOE"],
          },
        ],
        columns: cols,
        sort: { sortBy: "volume", sortOrder: "desc" },
        range: [6000, 12000],
      }),
    }).then((r) => r.json()),
  ]);

  const map = new Map();
  for (const row of [...(r1.data ?? []), ...(r2.data ?? [])]) {
    const [sym, close, , vol, mcap, sector, exchange, type, desc] = row.d;
    if (!sym || typeof close !== "number" || close <= 0) continue;
    if (!map.has(sym)) {
      map.set(sym, {
        symbol: sym,
        price: close,
        volume: vol ?? 0,
        mcap: mcap ?? 0,
        sector: sector || "US Equities",
        exchange: exchange || "US",
        type: type || "stock",
        name: desc || sym,
      });
    }
  }
  return map;
}

async function fetchLiveCoins() {
  const [bn, okx, gate, cg1, cg2, cg3, cg4, cgM1, cgM2, cgM3] = await Promise.all([
    fetch("https://api.binance.com/api/v3/ticker/24hr", { headers: { "User-Agent": UA } })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
    fetch("https://www.okx.com/api/v5/market/tickers?instType=SPOT", { headers: { "User-Agent": UA } })
      .then((r) => (r.ok ? r.json() : { data: [] }))
      .catch(() => ({ data: [] })),
    fetch("https://api.gateio.ws/api/v4/spot/tickers", { headers: { "User-Agent": UA } })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
    fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=1", {
      headers: { "User-Agent": UA },
    })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
    fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=2", {
      headers: { "User-Agent": UA },
    })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
    fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=3", {
      headers: { "User-Agent": UA },
    })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
    fetch("https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=250&page=4", {
      headers: { "User-Agent": UA },
    })
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
    fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=meme-token&order=market_cap_desc&per_page=250&page=1",
      { headers: { "User-Agent": UA } },
    )
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
    fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=meme-token&order=market_cap_desc&per_page=250&page=2",
      { headers: { "User-Agent": UA } },
    )
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
    fetch(
      "https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&category=meme-token&order=market_cap_desc&per_page=250&page=3",
      { headers: { "User-Agent": UA } },
    )
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),
  ]);

  const coins = new Map();
  const addCoin = (rawSym, name, price, provider, volUsd = 0, isMeme = false, mcap = 0) => {
    const symbol = String(rawSym || "")
      .toUpperCase()
      .replace(/[^A-Z0-9]/g, "");
    if (!symbol || symbol.length < 2 || symbol.length > 14) return;
    if (!Number.isFinite(price) || price <= 0) return;
    const prev = coins.get(symbol);
    if (!prev) {
      coins.set(symbol, {
        symbol,
        name: stripMeta(name) || symbol,
        price,
        provider,
        volUsd,
        isMeme,
        mcap,
      });
    } else {
      if (isMeme) prev.isMeme = true;
      if (name && prev.name === prev.symbol) prev.name = stripMeta(name);
      if (mcap > prev.mcap) prev.mcap = mcap;
      if (volUsd > prev.volUsd) prev.volUsd = volUsd;
    }
  };

  for (const r of Array.isArray(bn) ? bn : []) {
    if (r.symbol?.endsWith("USDT")) {
      const sym = r.symbol.slice(0, -4);
      addCoin(sym, sym, Number(r.lastPrice), "Binance Spot", Number(r.quoteVolume) || 0);
    }
  }
  for (const r of okx?.data ?? []) {
    if (r.instId?.endsWith("-USDT")) {
      const sym = r.instId.slice(0, -5);
      addCoin(sym, sym, Number(r.last), "OKX Spot", Number(r.volCcy24h) || 0);
    }
  }
  for (const r of Array.isArray(gate) ? gate : []) {
    if (r.currency_pair?.endsWith("_USDT")) {
      const sym = r.currency_pair.slice(0, -5);
      addCoin(sym, sym, Number(r.last), "Gate.io Spot", Number(r.quote_volume) || 0);
    }
  }
  for (const list of [cg1, cg2, cg3, cg4]) {
    for (const r of Array.isArray(list) ? list : []) {
      addCoin(
        r.symbol,
        r.name,
        Number(r.current_price),
        "CoinGecko Markets",
        Number(r.total_volume) || 0,
        false,
        Number(r.market_cap) || 0,
      );
    }
  }
  for (const list of [cgM1, cgM2, cgM3]) {
    for (const r of Array.isArray(list) ? list : []) {
      addCoin(
        r.symbol,
        r.name,
        Number(r.current_price),
        "CoinGecko Meme Markets",
        Number(r.total_volume) || 0,
        true,
        Number(r.market_cap) || 0,
      );
    }
  }

  return coins;
}

async function main() {
  const { ASSETS } = await import("../lib/market-assets.ts");
  const { SP500_NASDAQ_ASSETS } = await import("../lib/sp500-nasdaq-assets.ts");
  const { ADDITIONAL_STOCKS } = await import("../lib/additional-stocks.ts");
  const { ADDITIONAL_CRYPTOS } = await import("../lib/additional-cryptos.ts");
  const { ADDITIONAL_MEMECOINS } = await import("../lib/additional-memecoins.ts");

  console.log("Fetching live stocks & live coins...");
  const [liveStocks, liveCoins] = await Promise.all([fetchLiveStocks(), fetchLiveCoins()]);
  console.log(`Live stocks: ${liveStocks.size}, Live coins: ${liveCoins.size}`);

  // Track all used symbols globally across all 2,038 assets (zero duplicates)
  const baseCount = ASSETS.length - SP500_NASDAQ_ASSETS.length - ADDITIONAL_STOCKS.length - ADDITIONAL_CRYPTOS.length - ADDITIONAL_MEMECOINS.length;
  const baseAssets = ASSETS.slice(0, baseCount);

  const usedSymbols = new Set();
  for (const a of baseAssets) {
    usedSymbols.add(a.symbol);
  }

  // Note: Check BASE_ASSETS memes AI16Z, BULLY, LUCE
  console.log(
    "BASE_ASSETS non-live check:",
    baseAssets
      .filter((a) => (a.kind === "stock" ? !liveStocks.has(a.symbol) : !liveCoins.has(a.symbol)))
      .map((a) => `${a.kind}:${a.symbol}`),
  );

  // Build liquid replacement pool for stocks
  const stockPool = [...liveStocks.values()]
    .filter(
      (s) =>
        /^[A-Z]{1,5}$/.test(s.symbol) &&
        s.price >= 5 &&
        s.volume >= 300_000 &&
        (s.type === "stock" || s.type === "dr") &&
        !usedSymbols.has(s.symbol),
    )
    .sort((a, b) => (b.mcap || 0) - (a.mcap || 0) || b.volume - a.volume);

  const reserveUsed = new Set(usedSymbols);
  for (const s of [...SP500_NASDAQ_ASSETS, ...ADDITIONAL_STOCKS]) {
    if (liveStocks.has(s.symbol)) reserveUsed.add(s.symbol);
  }
  const availableStockReplacements = stockPool.filter((s) => !reserveUsed.has(s.symbol));
  let stockPoolIdx = 0;

  const nextStockReplacement = () => {
    while (stockPoolIdx < availableStockReplacements.length) {
      const cand = availableStockReplacements[stockPoolIdx++];
      if (!usedSymbols.has(cand.symbol)) {
        usedSymbols.add(cand.symbol);
        return makeStockEntry(cand.symbol, cand.name, cand.sector, cand.price);
      }
    }
    throw new Error("Ran out of stock replacements");
  };

  // Process SP500_NASDAQ_ASSETS
  const newSp500 = SP500_NASDAQ_ASSETS.map((a) => {
    const live = liveStocks.get(a.symbol);
    if (live && !usedSymbols.has(a.symbol)) {
      usedSymbols.add(a.symbol);
      return { ...a, base: Number(live.price.toFixed(live.price >= 10 ? 2 : 4)) };
    }
    return nextStockReplacement();
  });

  // Process ADDITIONAL_STOCKS
  const newAddStocks = ADDITIONAL_STOCKS.map((a) => {
    const live = liveStocks.get(a.symbol);
    if (live && !usedSymbols.has(a.symbol)) {
      usedSymbols.add(a.symbol);
      return { ...a, base: Number(live.price.toFixed(live.price >= 10 ? 2 : 4)) };
    }
    return nextStockReplacement();
  });

  // Also ensure we replace the 3 dead BASE_ASSETS meme coins in market-assets.ts manually after logging replacements
  const baseCoinsSet = new Set(baseAssets.map((a) => a.symbol));
  const liveMemePool = [...liveCoins.values()]
    .filter((c) => c.isMeme && !usedSymbols.has(c.symbol))
    .sort((a, b) => (b.mcap || 0) - (a.mcap || 0) || b.volUsd - a.volUsd);

  const liveCryptoPool = [...liveCoins.values()]
    .filter((c) => !c.isMeme && !usedSymbols.has(c.symbol))
    .sort((a, b) => (b.mcap || 0) - (a.mcap || 0) || b.volUsd - a.volUsd);

  // Reserve already live symbols in additional cryptos/memes so we don't duplicate them
  const keepCrypto = new Set();
  for (const a of ADDITIONAL_CRYPTOS) {
    if (!/^CR\d+$/.test(a.symbol) && liveCoins.has(a.symbol) && !usedSymbols.has(a.symbol) && !keepCrypto.has(a.symbol)) {
      keepCrypto.add(a.symbol);
    }
  }
  const keepMeme = new Set();
  for (const a of ADDITIONAL_MEMECOINS) {
    if (!/^MEME\d+$/.test(a.symbol) && liveCoins.has(a.symbol) && !usedSymbols.has(a.symbol) && !keepCrypto.has(a.symbol) && !keepMeme.has(a.symbol)) {
      keepMeme.add(a.symbol);
    }
  }

  // Reserve 3 top memes for BASE_ASSETS AI16Z/BULLY/LUCE replacements
  const baseMemeReplacements = liveMemePool
    .filter((c) => !keepCrypto.has(c.symbol) && !keepMeme.has(c.symbol) && !baseCoinsSet.has(c.symbol))
    .slice(0, 3);
  for (const r of baseMemeReplacements) usedSymbols.add(r.symbol);
  console.log(
    "Suggested BASE meme replacements for AI16Z, BULLY, LUCE:",
    baseMemeReplacements.map((r) => `${r.symbol} (${r.name}, $${r.price})`),
  );

  // Build replacements for ADDITIONAL_MEMECOINS (all dead/MEME* get replaced)
  const availMemes = liveMemePool.filter((c) => !usedSymbols.has(c.symbol) && !keepCrypto.has(c.symbol) && !keepMeme.has(c.symbol));
  const extraFromSpot = [...liveCoins.values()]
    .filter((c) => !usedSymbols.has(c.symbol) && !keepCrypto.has(c.symbol) && !keepMeme.has(c.symbol) && !availMemes.some((m) => m.symbol === c.symbol))
    .sort((a, b) => (b.volUsd || 0) - (a.volUsd || 0));

  let memeIdx = 0;
  let spotFallbackIdx = 0;
  const nextMeme = () => {
    while (memeIdx < availMemes.length) {
      const c = availMemes[memeIdx++];
      if (!usedSymbols.has(c.symbol)) {
        usedSymbols.add(c.symbol);
        return makeMemeEntry(c.symbol, c.name, `${c.provider} Meme Markets`, c.price);
      }
    }
    while (spotFallbackIdx < extraFromSpot.length) {
      const c = extraFromSpot[spotFallbackIdx++];
      if (!usedSymbols.has(c.symbol)) {
        usedSymbols.add(c.symbol);
        return makeMemeEntry(c.symbol, c.name, `${c.provider} Speculative`, c.price);
      }
    }
    throw new Error("Ran out of memes");
  };

  // Build replacements for ADDITIONAL_CRYPTOS
  const availCryptos = [...liveCryptoPool, ...liveCoins.values()]
    .filter((c) => !usedSymbols.has(c.symbol) && !keepCrypto.has(c.symbol) && !keepMeme.has(c.symbol));
  let cryptoIdx = 0;
  const nextCrypto = () => {
    while (cryptoIdx < availCryptos.length) {
      const c = availCryptos[cryptoIdx++];
      if (!usedSymbols.has(c.symbol)) {
        usedSymbols.add(c.symbol);
        return makeCryptoEntry(c.symbol, c.name, `${c.provider} Digital Assets`, c.price);
      }
    }
    throw new Error("Ran out of cryptos");
  };

  const newAddCryptos = ADDITIONAL_CRYPTOS.map((a) => {
    if (!/^CR\d+$/.test(a.symbol) && liveCoins.has(a.symbol) && !usedSymbols.has(a.symbol)) {
      usedSymbols.add(a.symbol);
      const c = liveCoins.get(a.symbol);
      return { ...a, base: Number(c.price >= 1 ? c.price.toFixed(4) : c.price.toPrecision(4)) };
    }
    return nextCrypto();
  });

  const newAddMemes = ADDITIONAL_MEMECOINS.map((a) => {
    if (!/^MEME\d+$/.test(a.symbol) && liveCoins.has(a.symbol) && !usedSymbols.has(a.symbol)) {
      usedSymbols.add(a.symbol);
      const c = liveCoins.get(a.symbol);
      return { ...a, base: Number(c.price >= 1 ? c.price.toFixed(4) : c.price.toPrecision(4)) };
    }
    return nextMeme();
  });

  // Write the 4 data files cleanly
  fs.writeFileSync(
    path.resolve("lib/sp500-nasdaq-assets.ts"),
    `import { type Asset } from "./market-assets";\n\n/**\n * S&P 500 & Nasdaq verified live equities dataset.\n */\nexport const SP500_NASDAQ_ASSETS: Asset[] = ${JSON.stringify(newSp500, null, 2)};\n`,
  );
  fs.writeFileSync(
    path.resolve("lib/additional-stocks.ts"),
    `import type { Asset } from "./market-assets";\n\n/**\n * Additional verified NYSE & Nasdaq live equities dataset.\n */\nexport const ADDITIONAL_STOCKS: Asset[] = ${JSON.stringify(newAddStocks, null, 2)};\n`,
  );
  fs.writeFileSync(
    path.resolve("lib/additional-cryptos.ts"),
    `import type { Asset } from "./market-assets";\n\n/**\n * Verified live exchange-traded digital assets across Binance, OKX, Gate.io, and CoinGecko.\n */\nexport const ADDITIONAL_CRYPTOS: Asset[] = ${JSON.stringify(newAddCryptos, null, 2)};\n`,
  );
  fs.writeFileSync(
    path.resolve("lib/additional-memecoins.ts"),
    `import type { Asset } from "./market-assets";\n\n/**\n * Verified live exchange-traded meme & community tokens across Binance, OKX, Gate.io, and CoinGecko.\n */\nexport const ADDITIONAL_MEMECOINS: Asset[] = ${JSON.stringify(newAddMemes, null, 2)};\n`,
  );

  console.log("Wrote updated datasets successfully!");
  console.log("Counts:", {
    sp500: newSp500.length,
    addStocks: newAddStocks.length,
    addCryptos: newAddCryptos.length,
    addMemes: newAddMemes.length,
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
