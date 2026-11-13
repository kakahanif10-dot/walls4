import { NextRequest, NextResponse } from "next/server";
import { runFullMarketPipeline, getAssetDetailedBreakdown } from "@/lib/market-pipeline";
import { type Kind } from "@/lib/market";
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
    const symbolParam = searchParams.get("symbol");

    // Single asset audit mode
    if (symbolParam) {
      const detail = getAssetDetailedBreakdown(symbolParam);
      if (!detail) {
        return privateJson({ error: `Asset not found: ${symbolParam}` }, { status: 404 });
      }
      return privateJson({
        symbol: detail.asset.symbol,
        name: detail.asset.name,
        kind: detail.asset.kind,
        group: detail.asset.group,
        metrics: detail.metrics,
        invalidationLevel: detail.invalidationLevel,
        breakdown: detail.breakdown,
        formula: {
          weights: "22% c1 (SMA20) + 20% c2 (SMA20/50) + 18% c3 (SMA50/200) + 25% c4 (ROC30) + 15% c5 (RSI14)",
          stanceScale: "Buy (78-100), Accumulate (66-77), Hold (47-65), Trim (34-46), Avoid (0-33)",
        },
      });
    }

    // Universe search and filtering mode (across 2000+ assets)
    const q = (searchParams.get("q") || "").toLowerCase().trim();
    const kind = searchParams.get("kind") as Kind | null;
    const stance = searchParams.get("stance");
    const riskGrade = searchParams.get("riskGrade");
    const minScore = Number(searchParams.get("minScore")) || 0;
    const maxScore = Number(searchParams.get("maxScore")) || 100;
    const limit = Math.min(2038, Math.max(1, Number(searchParams.get("limit")) || 50));
    const page = Math.max(1, Number(searchParams.get("page")) || 1);

    const { scoredAssets, metrics } = await runFullMarketPipeline();

    let filtered = scoredAssets;

    if (q) {
      filtered = filtered.filter(
        (a) => a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q) || a.group.toLowerCase().includes(q),
      );
    }

    if (kind && (kind === "stock" || kind === "crypto" || kind === "meme")) {
      filtered = filtered.filter((a) => a.kind === kind);
    }

    if (stance) {
      filtered = filtered.filter((a) => a.stance.toLowerCase() === stance.toLowerCase());
    }

    if (riskGrade) {
      filtered = filtered.filter((a) => a.riskGrade.toLowerCase() === riskGrade.toLowerCase());
    }

    if (minScore > 0 || maxScore < 100) {
      filtered = filtered.filter((a) => a.score >= minScore && a.score <= maxScore);
    }

    const totalMatching = filtered.length;
    const startIndex = (page - 1) * limit;
    const pagedResults = filtered.slice(startIndex, startIndex + limit);

    return privateJson({
      meta: {
        totalAssetsInUniverse: metrics.totalAssets,
        totalMatching,
        page,
        limit,
        totalPages: Math.ceil(totalMatching / limit),
        breadthScore: metrics.breadthScore,
      },
      results: pagedResults,
    });
  } catch (error: any) {
    console.error("Scoring API error:", error);
    return privateJson(
      { error: error?.message || "Failed to query scoring universe" },
      { status: 500 },
    );
  }
}
