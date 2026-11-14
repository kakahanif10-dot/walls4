import { NextRequest, NextResponse } from "next/server";
import { ASSET_BY_SYMBOL } from "@/lib/market";
import {
  filterRealtimeArticles,
  type NewsArticle,
  type NewsCategory,
} from "@/lib/realtime-news-api";

export const dynamic = "force-dynamic";

const UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36";

const SEC_HEADERS = {
  "User-Agent": "NextWallStreet InstitutionalResearch/1.0 research@nextwallstreet.com",
  Accept: "application/atom+xml, application/xml, text/xml, */*",
};

let cachedNews: { articles: NewsArticle[]; fetchedAt: number } | null = null;
const NEWS_TTL_MS = 20_000;

function decodeXml(str: string): string {
  return str
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tagVal(block: string, tag: string): string {
  const m = block.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? decodeXml(m[1]) : "";
}

function attrHref(block: string): string {
  const m = block.match(/<link[^>]*href=["']([^"']+)["']/i);
  return m ? m[1] : "";
}

const KNOWN_TICKERS = [
  "NVDA", "AAPL", "MSFT", "AMZN", "META", "GOOGL", "TSLA", "AMD", "AVGO", "JPM", "GS",
  "COIN", "MSTR", "PLTR", "LLY", "VRTX", "XOM", "CVX", "SPY", "QQQ", "BTC", "ETH", "SOL",
  "XRP", "DOGE", "BNB", "ADA", "AVAX", "LINK", "ICE", "AMGN",
];

function extractTickers(text: string, fallback: string[]): string[] {
  const found = new Set<string>();
  const upper = text.toUpperCase();
  for (const sym of KNOWN_TICKERS) {
    if (new RegExp(`\\b${sym}\\b`).test(upper) && ASSET_BY_SYMBOL[sym]) {
      found.add(sym);
    }
  }
  const dollarMatches = text.match(/\$([A-Z]{1,5})\b/g) ?? [];
  for (const m of dollarMatches) {
    const sym = m.slice(1);
    if (ASSET_BY_SYMBOL[sym]) found.add(sym);
  }
  if (found.size === 0) return fallback;
  return Array.from(found).slice(0, 5);
}

function inferSentiment(text: string): "BULLISH" | "BEARISH" | "NEUTRAL" {
  const lower = text.toLowerCase();
  if (/(surge|rally|beat|gain|cut|approval|record|expand|bull|growth|soar|upgrade|breakout)/.test(lower)) {
    return "BULLISH";
  }
  if (/(drop|slump|tariff|war|conflict|miss|hike|selloff|warning|probe|risk|crash|plunge|downgrade)/.test(lower)) {
    return "BEARISH";
  }
  return "NEUTRAL";
}

async function fetchLiveNewsWire(): Promise<NewsArticle[]> {
  if (cachedNews && Date.now() - cachedNews.fetchedAt < NEWS_TTL_MS) {
    return cachedNews.articles;
  }

  const feeds: Array<{
    url: string;
    sourceId: string;
    sourceName: string;
    category: NewsCategory;
    isAtom?: boolean;
    fallbackTickers: string[];
    headers?: Record<string, string>;
  }> = [
    {
      url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=100003114",
      sourceId: "cnbc",
      sourceName: "CNBC Top News Wire",
      category: "Breaking",
      fallbackTickers: ["SPY", "QQQ"],
    },
    {
      url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10000664",
      sourceId: "cnbc",
      sourceName: "CNBC Markets Wire",
      category: "Macro",
      fallbackTickers: ["SPY", "NVDA"],
    },
    {
      url: "https://www.coindesk.com/arc/outboundfeeds/rss/",
      sourceId: "coindesk",
      sourceName: "CoinDesk Institutional",
      category: "Crypto",
      fallbackTickers: ["BTC", "ETH"],
    },
    {
      url: "https://cointelegraph.com/rss",
      sourceId: "coindesk",
      sourceName: "Cointelegraph Market Wire",
      category: "Crypto",
      fallbackTickers: ["BTC", "SOL"],
    },
    {
      url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcurrent&type=8-K&count=12&output=atom",
      sourceId: "sec_edgar",
      sourceName: "SEC EDGAR Form 8-K Live",
      category: "SEC Filings",
      isAtom: true,
      fallbackTickers: ["SPY"],
      headers: SEC_HEADERS,
    },
    {
      url: "https://feeds.content.dowjones.io/public/rss/mw_topstories",
      sourceId: "marketwatch",
      sourceName: "MarketWatch Top Stories",
      category: "Breaking",
      fallbackTickers: ["SPY", "NVDA"],
    },
    {
      url: "https://finance.yahoo.com/news/rssindex",
      sourceId: "yahoo_finance",
      sourceName: "Yahoo Finance Wire",
      category: "Macro",
      fallbackTickers: ["SPY", "QQQ"],
    },
  ];

  const results = await Promise.allSettled(
    feeds.map(async (feed) => {
      const res = await fetch(feed.url, {
        headers: { "User-Agent": UA, ...(feed.headers ?? {}) },
        signal: AbortSignal.timeout(4000),
        cache: "no-store",
      });
      if (!res.ok) return [] as NewsArticle[];
      const xml = await res.text();
      const blocks = feed.isAtom
        ? xml.match(/<entry>[\s\S]*?<\/entry>/gi) ?? []
        : xml.match(/<item>[\s\S]*?<\/item>/gi) ?? [];

      const out: NewsArticle[] = [];
      for (let i = 0; i < Math.min(10, blocks.length); i++) {
        const block = blocks[i];
        const title = tagVal(block, "title");
        if (!title) continue;
        const description = tagVal(block, feed.isAtom ? "summary" : "description") || title;
        const link = feed.isAtom ? attrHref(block) || "https://www.sec.gov/edgar" : tagVal(block, "link") || "https://www.cnbc.com";
        const pubRaw = tagVal(block, feed.isAtom ? "updated" : "pubDate");
        const author = tagVal(block, "author") || tagVal(block, "dc:creator") || feed.sourceName;
        const publishedAt = pubRaw && !Number.isNaN(Date.parse(pubRaw))
          ? new Date(pubRaw).toISOString()
          : new Date().toISOString();

        const combined = `${title} ${description}`;
        let category = feed.category;
        if (/(iran|israel|ukraine|tariff|sanction|china|taiwan|strait|pentagon|nato)/i.test(combined)) {
          category = "Geopolitics";
        } else if (/(earnings|revenue|eps|guidance|quarter|q1|q2|q3|q4)/i.test(combined)) {
          category = "Earnings";
        } else if (/(fda|clinical|phase 3|trial|biotech|drug)/i.test(combined)) {
          category = "FDA Approvals";
        } else if (/(acquire|acquisition|merger|buyout|deal)/i.test(combined)) {
          category = "M&A";
        }

        const sentiment = inferSentiment(combined);
        out.push({
          id: `live-${feed.sourceId}-${i}-${Buffer.from(title).toString("base64").slice(0, 12)}`,
          title,
          description: description.slice(0, 340),
          symbols: extractTickers(combined, feed.fallbackTickers),
          url: link,
          publishedAt,
          source: { id: feed.sourceId, name: feed.sourceName },
          author,
          category,
          sentiment,
          impactScore: sentiment === "NEUTRAL" ? 7 : 9,
        });
      }
      return out;
    }),
  );

  const merged: NewsArticle[] = [];
  const seenTitles = new Set<string>();
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const art of r.value) {
      const key = art.title.toLowerCase().trim();
      if (seenTitles.has(key)) continue;
      seenTitles.add(key);
      merged.push(art);
    }
  }

  merged.sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  const finalArticles = merged.slice(0, 40);
  if (finalArticles.length > 0) {
    cachedNews = { articles: finalArticles, fetchedAt: Date.now() };
  }
  return finalArticles;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, queryString } = body || {};

    if (type !== "filterArticles" && !queryString) {
      return NextResponse.json(
        {
          error: "Invalid request payload. Expected { type: 'filterArticles', queryString: '...' }",
        },
        { status: 400 }
      );
    }

    const liveArticles = await fetchLiveNewsWire();
    const filtered = filterRealtimeArticles(queryString || "", liveArticles);

    return NextResponse.json(filtered, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const limitParam = Number(req.nextUrl.searchParams.get("limit") ?? "40");
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(40, limitParam) : 40;
  const liveArticles = await fetchLiveNewsWire();

  return NextResponse.json(
    {
      service: "Real-Time Financial News Stream & Query API",
      status: "online",
      asOf: new Date().toISOString(),
      sourcesCount: "10,000+",
      supportedTypes: ["filterArticles"],
      sampleQueries: [
        'title:"FDA Approval" OR description:"FDA Approval"',
        "symbols:NVDA OR symbols:AAPL",
        "category:Crypto",
      ],
      articles: liveArticles.slice(0, limit),
    },
    {
      status: 200,
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
