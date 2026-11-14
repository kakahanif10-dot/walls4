import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";

export async function POST(req: NextRequest) {
  try {
    const { query } = await req.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "Search query is required" }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY is not configured. Live search grounding requires an active API key." },
        { status: 503 }
      );
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: `Provide an up-to-the-minute institutional market intelligence report based on real-time search data for: "${query}".
Focus on:
1. Exact latest news catalysts and macro developments.
2. Market reactions (equities, yields, commodities, or crypto).
3. Institutional consensus and critical price/risk levels.
Keep the style concise, professional, and clear with bold bullet points.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    const text = response.text || "No intelligence returned.";
    const searchQueries =
      response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];
    const groundingChunks =
      response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return NextResponse.json({
      text,
      searchQueries,
      groundingChunks,
    });
  } catch (error: any) {
    console.error("NWS AI Search Grounding Error:", error);
    return NextResponse.json(
      {
        error: "Live Google Search grounding service temporarily unavailable. Please retry.",
      },
      { status: 503 }
    );
  }
}
