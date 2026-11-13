import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      unlocked: false,
      error: "Membership verification is not configured. No purchase or license has been verified, so access remains locked.",
    },
    { status: 503 },
  );
}

export async function GET() {
  return NextResponse.json({ connected: false });
}
