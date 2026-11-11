import { NextRequest, NextResponse } from "next/server";
import { searchGlobalCatalog, type SearchScope } from "@/lib/global-search";

const VALID_SCOPES = new Set<SearchScope>(["all", "assets", "articles", "desks"]);

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";
  const rawScope = (searchParams.get("scope") || "all") as SearchScope;
  const scope: SearchScope = VALID_SCOPES.has(rawScope) ? rawScope : "all";
  const rawLimit = Number(searchParams.get("limit") || "6");
  const limit = Number.isFinite(rawLimit) ? rawLimit : 6;

  const result = searchGlobalCatalog(q, { scope, limit });
  return NextResponse.json(result);
}
