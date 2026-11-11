import { NextRequest, NextResponse } from "next/server";
import { runFullMarketPipeline, getCachedPipeline } from "@/lib/market-pipeline";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const force = searchParams.get("force") === "true";

    const result = await runFullMarketPipeline(force);

    return NextResponse.json(
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
    return NextResponse.json(
      { status: "error", message: error?.message || "Pipeline execution failure" },
      { status: 500 },
    );
  }
}

export async function POST() {
  try {
    const result = await runFullMarketPipeline(true);
    return NextResponse.json({
      status: "ok",
      refreshed: true,
      pipeline: result.metrics,
    });
  } catch (error: any) {
    return NextResponse.json(
      { status: "error", message: error?.message || "Failed to trigger pipeline sync" },
      { status: 500 },
    );
  }
}
