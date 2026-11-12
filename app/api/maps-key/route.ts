import { NextResponse } from "next/server";
import firebaseConfig from "@/firebase-applet-config.json";

export async function GET() {
  const apiKey =
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    firebaseConfig.apiKey ||
    "";

  return NextResponse.json({ apiKey });
}
