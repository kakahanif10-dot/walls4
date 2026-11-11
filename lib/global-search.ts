import { ASSETS, type Asset, type Kind } from "./market-assets";
import { ARTICLES, type Article } from "./content";
import { ANALYST_DESKS_44, CATEGORY_LABELS, type AnalystDesk } from "./analyst-desks";

export type SearchScope = "all" | "assets" | "articles" | "desks";

export interface GlobalSearchAssetResult {
  symbol: string;
  name: string;
  kind: Kind;
  group: string;
  base: number;
  href: string;
}

export interface GlobalSearchArticleResult {
  slug: string;
  title: string;
  dek: string;
  category: string;
  author: string;
  readMinutes: number;
  tickers: string[];
  tags: string[];
  premium: boolean;
  href: string;
}

export interface GlobalSearchDeskResult {
  id: string;
  name: string;
  category: AnalystDesk["category"];
  categoryLabel: string;
  leadAnalyst: string;
  role: string;
  focusTickers: string[];
  keyMetric: string;
  status: AnalystDesk["status"];
  proOnly: boolean;
  href: string;
}

export interface GlobalSearchResponse {
  query: string;
  scope: SearchScope;
  isFeatured: boolean;
  assets: GlobalSearchAssetResult[];
  articles: GlobalSearchArticleResult[];
  desks: GlobalSearchDeskResult[];
  counts: {
    assets: number;
    articles: number;
    desks: number;
    total: number;
  };
}

const FEATURED_SYMBOLS = ["NVDA", "BTC", "AAPL", "SOL", "PEPE", "SPY"];

function toAssetResult(asset: Asset): GlobalSearchAssetResult {
  return {
    symbol: asset.symbol,
    name: asset.name,
    kind: asset.kind,
    group: asset.group,
    base: asset.base,
    href: `/ticker/${encodeURIComponent(asset.symbol)}`,
  };
}

function toArticleResult(article: Article): GlobalSearchArticleResult {
  return {
    slug: article.slug,
    title: article.title,
    dek: article.dek,
    category: article.category || "markets",
    author: article.author,
    readMinutes: article.readMinutes,
    tickers: article.tickers,
    tags: article.tags,
    premium: article.premium,
    href: `/research/${encodeURIComponent(article.slug)}`,
  };
}

function toDeskResult(desk: AnalystDesk): GlobalSearchDeskResult {
  return {
    id: desk.id,
    name: desk.name,
    category: desk.category,
    categoryLabel: CATEGORY_LABELS[desk.category],
    leadAnalyst: desk.leadAnalyst,
    role: desk.role,
    focusTickers: desk.focusTickers,
    keyMetric: desk.keyMetric,
    status: desk.status,
    proOnly: desk.proOnly,
    href: `/desks?q=${encodeURIComponent(desk.name)}#${encodeURIComponent(desk.id)}`,
  };
}

function scoreAsset(asset: Asset, q: string): number {
  const sym = asset.symbol.toLowerCase();
  const name = asset.name.toLowerCase();
  const group = asset.group.toLowerCase();
  const kind = asset.kind.toLowerCase();

  if (sym === q) return 100;
  if (sym.startsWith(q)) return 85;
  if (name.startsWith(q)) return 70;
  if (sym.includes(q)) return 55;
  if (name.includes(q)) return 45;
  if (group.includes(q)) return 30;
  if (kind === q || kind.includes(q)) return 20;
  return 0;
}

function scoreArticle(article: Article, q: string): number {
  const title = article.title.toLowerCase();
  const dek = article.dek.toLowerCase();
  const author = article.author.toLowerCase();
  const category = (article.category || "").toLowerCase();
  const tickers = article.tickers.map((t) => t.toLowerCase());
  const tags = article.tags.map((t) => t.toLowerCase());

  if (tickers.some((t) => t === q)) return 95;
  if (title.startsWith(q)) return 85;
  if (title.includes(q)) return 65;
  if (tickers.some((t) => t.includes(q))) return 55;
  if (tags.some((t) => t.includes(q))) return 45;
  if (author.includes(q) || category.includes(q)) return 35;
  if (dek.includes(q)) return 25;
  return 0;
}

function scoreDesk(desk: AnalystDesk, q: string): number {
  const name = desk.name.toLowerCase();
  const lead = desk.leadAnalyst.toLowerCase();
  const role = desk.role.toLowerCase();
  const summary = desk.summary.toLowerCase();
  const metric = desk.keyMetric.toLowerCase();
  const cat = desk.category.toLowerCase();
  const catLabel = CATEGORY_LABELS[desk.category].toLowerCase();
  const tickers = desk.focusTickers.map((t) => t.toLowerCase());

  if (tickers.some((t) => t === q || t.replace("-perp", "") === q)) return 95;
  if (name.startsWith(q)) return 85;
  if (name.includes(q)) return 70;
  if (lead.includes(q) || role.includes(q)) return 55;
  if (tickers.some((t) => t.includes(q))) return 50;
  if (metric.includes(q) || cat.includes(q) || catLabel.includes(q)) return 40;
  if (summary.includes(q)) return 25;
  return 0;
}

export function searchGlobalCatalog(
  rawQuery: string,
  options?: { scope?: SearchScope; limit?: number }
): GlobalSearchResponse {
  const query = rawQuery.trim();
  const q = query.toLowerCase();
  const scope: SearchScope = options?.scope ?? "all";
  const limit = Math.max(1, Math.min(options?.limit ?? 8, 25));

  if (!q) {
    const featuredAssets = FEATURED_SYMBOLS.map((sym) => ASSETS.find((a) => a.symbol === sym))
      .filter((a): a is Asset => Boolean(a))
      .slice(0, limit)
      .map(toAssetResult);
    const featuredArticles = ARTICLES.slice(0, Math.min(4, limit)).map(toArticleResult);
    const featuredDesks = ANALYST_DESKS_44.slice(0, Math.min(4, limit)).map(toDeskResult);

    const assets = scope === "all" || scope === "assets" ? featuredAssets : [];
    const articles = scope === "all" || scope === "articles" ? featuredArticles : [];
    const desks = scope === "all" || scope === "desks" ? featuredDesks : [];

    return {
      query,
      scope,
      isFeatured: true,
      assets,
      articles,
      desks,
      counts: {
        assets: assets.length,
        articles: articles.length,
        desks: desks.length,
        total: assets.length + articles.length + desks.length,
      },
    };
  }

  const matchedAssets =
    scope === "all" || scope === "assets"
      ? ASSETS.map((asset) => ({ asset, score: scoreAsset(asset, q) }))
          .filter((entry) => entry.score > 0)
          .sort((a, b) => b.score - a.score || a.asset.symbol.localeCompare(b.asset.symbol))
      : [];

  const matchedArticles =
    scope === "all" || scope === "articles"
      ? ARTICLES.map((article) => ({ article, score: scoreArticle(article, q) }))
          .filter((entry) => entry.score > 0)
          .sort((a, b) => b.score - a.score || b.article.date.localeCompare(a.article.date))
      : [];

  const matchedDesks =
    scope === "all" || scope === "desks"
      ? ANALYST_DESKS_44.map((desk) => ({ desk, score: scoreDesk(desk, q) }))
          .filter((entry) => entry.score > 0)
          .sort((a, b) => b.score - a.score || a.desk.name.localeCompare(b.desk.name))
      : [];

  const assets = matchedAssets.slice(0, limit).map((e) => toAssetResult(e.asset));
  const articles = matchedArticles.slice(0, limit).map((e) => toArticleResult(e.article));
  const desks = matchedDesks.slice(0, limit).map((e) => toDeskResult(e.desk));

  return {
    query,
    scope,
    isFeatured: false,
    assets,
    articles,
    desks,
    counts: {
      assets: matchedAssets.length,
      articles: matchedArticles.length,
      desks: matchedDesks.length,
      total: matchedAssets.length + matchedArticles.length + matchedDesks.length,
    },
  };
}
