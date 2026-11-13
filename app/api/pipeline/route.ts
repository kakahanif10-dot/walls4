import { NextRequest, NextResponse } from "next/server";
import { runFullMarketPipeline } from "@/lib/market-pipeline";
import { getLifetimeAccess } from "@/lib/whop-access";

export const dynamic = "force-dynamic";

function privateJson(body: unknown, init?: ResponseInit) {
  const headers = new Headers(init?.headers);
  headers.set("Cache-Control", "private, no-store");
  return NextResponse.json(body, { ...init, headers });
}

export async function GET(req: NextRequest) {
  const access = await getLifetimeAccess();
  if (access.status !== "member") {
    const status = access.status === "unauthenticated" ? 401 : access.status === "unpaid" ? 403 : 503;
    return privateJson({ error: "Lifetime access required." }, { status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "true";

    const result = await runFullMarketPipeline(force);

    return privateJson(
      {
        status: "ok",
        pipeline: result.metrics,
        topRanked: result.scoredAssets.slice(0, 10),
        bottomRanked: result.scoredAssets.slice(-10).reverse(),
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
        },
      },
    );
  } catch (error: any) {
    console.error("Pipeline API error:", error);
    return privateJson(
      { status: "error", message: error?.message || "Pipeline execution failure" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).origin !== req.nextUrl.origin) {
    return privateJson({ error: "Invalid origin." }, { status: 403 });
  }

  const access = await getLifetimeAccess();
  if (access.status !== "member") {
    const status = access.status === "unauthenticated" ? 401 : access.status === "unpaid" ? 403 : 503;
    return privateJson({ error: "Lifetime access required." }, { status });
  }

  try {
    const result = await runFullMarketPipeline(true);
    return privateJson({
      status: "ok",
      refreshed: true,
      pipeline: result.metrics,
    });
  } catch (error: any) {
    return privateJson(
      { status: "error", message: error?.message || "Failed to trigger pipeline sync" },
      { status: 500 },
    );
  }
}
