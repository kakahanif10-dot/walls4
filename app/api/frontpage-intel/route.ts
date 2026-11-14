import { NextResponse } from "next/server";
import { getFrontpageIntelBundle } from "@/lib/live-frontpage-data";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const bundle = await getFrontpageIntelBundle();
    return NextResponse.json(bundle);
  } catch (err) {
    console.error("Frontpage intel error:", err);
    return NextResponse.json(
      { error: "Unable to load live market intelligence bundle." },
      { status: 500 },
    );
  }
}
