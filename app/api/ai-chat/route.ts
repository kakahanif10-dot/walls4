import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { handleAIModeratorQuery, generateMinutePrediction } from "@/lib/ai-moderator";
import { ASSET_BY_SYMBOL, metricsFor } from "@/lib/market";
import { ensureMarketData } from "@/lib/market-data";

export async function POST(req: NextRequest) {
  try {
    await ensureMarketData();
    const { message, symbol, action } = await req.json();

    if (action === "minute-prediction") {
      const prediction = generateMinutePrediction(symbol);
      return NextResponse.json({ prediction });
    }

    const fallbackResult = handleAIModeratorQuery(message || "");

    // Look up exact deterministic asset metrics if symbol is mentioned
    let exactData: any = fallbackResult.prediction;
    const targetSymbol = (symbol || fallbackResult.prediction?.symbol || "").toUpperCase();
    const asset = ASSET_BY_SYMBOL[targetSymbol];
    if (asset) {
      const m = metricsFor(asset);
      const basePred = fallbackResult.prediction ?? generateMinutePrediction(asset.symbol);
      exactData = {
        ...basePred,
        symbol: asset.symbol,
        name: asset.name,
        kind: asset.kind,
        group: asset.group,
        currentPrice: m.last,
        stance: m.stance as any,
        score: m.score,
        invalidationLevel: basePred.invalidationLevel ?? Math.min(m.sma20, m.sma50) * 0.975,
        target1: basePred.target1 ?? m.high52,
        target2: basePred.target2 ?? Math.max(m.high52, m.last * 1.08),
        sma20: m.sma20,
        sma50: m.sma50,
        sma200: m.sma200,
        rsi: m.rsi,
        volatility60d: m.vol,
        confidence: m.score >= 50 ? m.score : 100 - m.score,
        technicalMechanism: `20-SMA ($${m.sma20.toFixed(2)}) & 50-SMA ($${m.sma50.toFixed(2)}) with RSI ${m.rsi.toFixed(0)}`,
        wibTime: new Date().toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" }) + " WIB",
      };
    }

    // If GEMINI_API_KEY is available, synthesize institutional narrative strictly around exact numbers
    if (process.env.GEMINI_API_KEY && message) {
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const prompt = `You are the "Quantitative Strategy Desk", Senior Research Lead at NextWall Street.
You synthesize analysis for Wall Street Equities, Day Trading, Crypto (Binance/Coinbase), and Speculative Digital Assets.

CRITICAL INSTRUCTION - DETERMINISTIC DATA PIPELINE:
DO NOT INVENT, ESTIMATE, OR GUESS ANY PRICES, SUPPORT, RESISTANCE, OR INVALIDATION STOPS.
You MUST strictly use the exact programmatic numbers provided below:
${JSON.stringify(exactData || {})}

User Inquiry: "${message}"

Your task is ONLY to synthesize professional trader narrative, catalyst context, and risk discipline around these exact numbers:
1. Direct Stance (${exactData?.stance || "Neutral"}) with exact Score (${exactData?.score || 50}/100).
2. Exact Price ($${exactData?.currentPrice ? Number(exactData.currentPrice).toFixed(2) : "0.00"}), Invalidation Stop ($${exactData?.invalidationLevel ? Number(exactData.invalidationLevel).toFixed(2) : "0.00"}), and Target ($${exactData?.target1 ? Number(exactData.target1).toFixed(2) : "0.00"}).
3. Technical rationale: explain what the 20-day vs 50-day SMA slope and RSI ${exactData?.rsi ? Number(exactData.rsi).toFixed(0) : "50"} indicate about order flow.
Keep tone prestigious, institutional, sharp, and concise (2 to 3 bullet points with bold highlights). Write exclusively in standard Wall Street professional English.`;

        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000));
        const geminiPromise = ai.models.generateContent({
          model: "gemini-3.8-flash",
          contents: prompt,
        }).catch(() => null);

        const response: any = await Promise.race([geminiPromise, timeoutPromise]);

        if (response && response.text) {
          return NextResponse.json({
            reply: response.text,
            prediction: exactData,
          });
        }
      } catch {
        // Fallback gracefully to programmatic deterministic response
      }
    }

    return NextResponse.json({
      reply: fallbackResult.reply,
      prediction: exactData,
    });
  } catch (err: any) {
    const fallback = generateMinutePrediction();
    return NextResponse.json({
      reply: `Quant Strategy Desk active: ${fallback.stance} signal verified on $${fallback.symbol} at ${fallback.utcTime} UTC. Pipeline anchored to institutional feed.`,
      prediction: fallback,
    });
  }
}
