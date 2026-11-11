import { NextRequest, NextResponse } from "next/server";
import { filterRealtimeArticles, INITIAL_REALTIME_ARTICLES } from "@/lib/realtime-news-api";

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

    const filtered = filterRealtimeArticles(queryString || "", INITIAL_REALTIME_ARTICLES);

    return NextResponse.json(filtered, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Internal Server Error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json(
    {
      service: "Real-Time Financial News Stream & Query API",
      status: "online",
      sourcesCount: "10,000+",
      supportedTypes: ["filterArticles"],
      sampleQueries: [
        'title:"FDA Approval" OR description:"FDA Approval"',
        "symbols:NVDA OR symbols:AAPL",
        "category:Crypto",
      ],
    },
    { status: 200 }
  );
}
