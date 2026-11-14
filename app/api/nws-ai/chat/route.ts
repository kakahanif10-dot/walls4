import { NextRequest, NextResponse } from "next/server";
import { GoogleGenAI } from "@google/genai";
import { ASSET_BY_SYMBOL, fmtPct, fmtPrice, metricsFor } from "@/lib/market";
import { ensureMarketData } from "@/lib/market-data";

const ROLE_CONFIGS: Record<string, { model: string; systemInstruction: string; title: string; displayName: string }> = {
  carbon: {
    model: "gemini-4-carbon",
    displayName: "NWS Titan 4.0",
    title: "NWS Titan 4.0 — Deep Quantitative Reasoning & Auditing Desk",
    systemInstruction: `You are the Senior Quantitative Research Auditor at NextWall Street (NWS AI).
Your mandate is deep mathematical and statistical scrutiny:
- Audit financial models, portfolio risk matrices, Black-Scholes volatility surfaces, and algorithmic alpha factors.
- Formulate precise mathematical equations, risk bounds, Sharpe ratio limits, and drawdown tolerances.
- Scrutinize potential model flaws, overfitting hazards, covariance stationarity assumptions, and tail-risk fat tails.
- Use prestigious, academic, and Wall Street institutional tone. Deliver step-by-step rigorous analytical proofs and conclusions.`,
  },
  argon: {
    model: "gemini-4-argon",
    displayName: "NWS Olympus 4.0",
    title: "NWS Olympus 4.0 — Multi-Asset Derivatives & Structuring Desk",
    systemInstruction: `You are the Head of Multi-Asset Derivatives & Portfolio Structuring at NextWall Street (NWS AI).
Your mandate is complex cross-asset financial engineering:
- Structure multi-leg options spreads (Iron Condors, Calendars, Ratio Diagonals, Straddles, Box Spreads).
- Calculate and explain Greeks (Delta, Gamma, Vega, Theta, Rho, Charm, Vanna) and dynamic delta hedging rules.
- Design portfolio overlays across US equities, crypto perpetual futures, precious metals, and FX swaps.
- Keep recommendations actionable, disciplined, and strictly risk-hedged with explicit stop-out and invalidation levels.`,
  },
  flash: {
    model: "gemini-3.8-flash",
    displayName: "NWS Mercury 3.8",
    title: "NWS Mercury 3.8 — Flow Desk & Market Intelligence Specialist",
    systemInstruction: `You are the Chief Market Flow Strategist at NextWall Street (NWS AI).
Your mandate is real-time cross-asset market intelligence:
- Provide rapid, institutional syntheses of global market flows, macroeconomic catalysts (FOMC, CPI, NFP, ECB), and earnings releases.
- Analyze institutional order book depth, block trade sentiment, dark pool activity, and ETF creation/redemption trends.
- Deliver concise, highly legible insights with clear bullish/bearish stances, key technical pivot points, and tactical gameplans.`,
  },
  "flash-lite": {
    model: "gemini-3.1-flash-lite",
    displayName: "NWS Velocity 3.1",
    title: "NWS Velocity 3.1 — Execution Alerts & Sub-Second Tape Reader",
    systemInstruction: `You are the Ultra-Fast Execution Algorithms & Tape Reader at NextWall Street (NWS AI).
Your mandate is rapid tactical execution and immediate tape interpretation:
- Interpret price quotes, bid-ask spreads, Level 2 depth velocity, and sudden volume breakouts with minimal latency.
- Give instant execution checklists: Entry Zone, Invalidation Stop, Primary Take-Profit Target, and R/R Ratio.
- Use brief bullet points, sharp quantitative callouts, and decisive directives. Zero fluff.`,
  },
};

// Map public NWS AI model keys to backend models and display names
const NWS_MODEL_MAP: Record<string, { backendModel: string; displayName: string; roleId: string }> = {
  "nws-titan-4.0": { backendModel: "gemini-4-carbon", displayName: "NWS Titan 4.0", roleId: "carbon" },
  "nws-olympus-4.0": { backendModel: "gemini-4-argon", displayName: "NWS Olympus 4.0", roleId: "argon" },
  "nws-mercury-3.8": { backendModel: "gemini-3.8-flash", displayName: "NWS Mercury 3.8", roleId: "flash" },
  "nws-velocity-3.1": { backendModel: "gemini-3.1-flash-lite", displayName: "NWS Velocity 3.1", roleId: "flash-lite" },
  // Backward compatibility aliases
  "gemini-4-carbon": { backendModel: "gemini-4-carbon", displayName: "NWS Titan 4.0", roleId: "carbon" },
  "gemini-4-argon": { backendModel: "gemini-4-argon", displayName: "NWS Olympus 4.0", roleId: "argon" },
  "gemini-3.8-flash": { backendModel: "gemini-3.8-flash", displayName: "NWS Mercury 3.8", roleId: "flash" },
  "gemini-3.1-flash-lite": { backendModel: "gemini-3.1-flash-lite", displayName: "NWS Velocity 3.1", roleId: "flash-lite" },
};

export async function POST(req: NextRequest) {
  let messages: { role: string; text: string }[] = [];
  let role = "flash";
  let requestedKey = "nws-mercury-3.8";

  try {
    const body = await req.json();
    messages = body.messages || [];
    role = body.role || "flash";
    requestedKey = body.model || body.modelOverride || role;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Invalid messages array" }, { status: 400 });
    }

    const mapping = NWS_MODEL_MAP[requestedKey] || NWS_MODEL_MAP["nws-mercury-3.8"];
    const selectedRole = ROLE_CONFIGS[mapping.roleId] || ROLE_CONFIGS[role] || ROLE_CONFIGS.flash;
    const backendModel = mapping.backendModel || selectedRole.model;
    const publicDisplayName = mapping.displayName || selectedRole.displayName;

    await ensureMarketData();
    const lastUserMsg = messages[messages.length - 1]?.text || "Market inquiry";
    const tokens = lastUserMsg.toUpperCase().replace(/[^A-Z0-9\s$]/g, " ").split(/\s+/);
    const detectedSym = tokens.map((t) => t.replace(/^\$/, "")).find((t) => t.length >= 2 && Boolean(ASSET_BY_SYMBOL[t]));
    const liveContextAssets = [detectedSym ?? "NVDA", "BTC", "SPY"]
      .filter((s, idx, arr) => arr.indexOf(s) === idx && Boolean(ASSET_BY_SYMBOL[s]))
      .map((s) => {
        const asset = ASSET_BY_SYMBOL[s];
        const m = metricsFor(asset);
        return { symbol: s, name: asset.name, m };
      });
    const liveSnapshotLine = liveContextAssets
      .map(({ symbol, m }) => `$${symbol}: ${fmtPrice(m.last)} (${fmtPct(m.change24h)}, Score ${m.score}/100, RSI ${m.rsi.toFixed(0)}, SMA20 ${fmtPrice(m.sma20)}, SMA50 ${fmtPrice(m.sma50)})`)
      .join(" | ");

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      const primary = liveContextAssets[0];
      const invStop = primary ? fmtPrice(Math.min(primary.m.sma20, primary.m.sma50) * 0.975) : "live volume shelf";
      const tgt = primary ? fmtPrice(Math.max(primary.m.high52, primary.m.last * 1.05)) : "session extension";
      return NextResponse.json({
        reply: `**[${selectedRole.title} — Real-Time Market Telemetry]**\n\n*Live Analysis for "${lastUserMsg}"*:\n\n- **Live Tape Snapshot**: ${liveSnapshotLine}\n- **Primary Anchor**: ${primary ? `$${primary.symbol} trading at ${fmtPrice(primary.m.last)} with stance **${primary.m.stance}** (Score ${primary.m.score}/100, RSI ${primary.m.rsi.toFixed(0)}).` : "Multi-asset telemetry synchronized."}\n- **Risk Protocol**: Invalidation stop anchored at ${invStop}; primary target extension ${tgt}.`,
        modelUsed: publicDisplayName,
        fallback: true,
      });
    }

    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const enrichedInstruction = `${selectedRole.systemInstruction}\n\nLIVE REAL-TIME MARKET TELEMETRY (USE ONLY THESE LIVE QUOTES WHEN CITING PRICES):\n${liveSnapshotLine}`;

    // Map conversation history to contents format: [{ role: 'user' | 'model', parts: [{ text: '...' }] }]
    const contents = messages.map((m: { role: string; text: string }) => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: m.text }],
    }));

    let actualBackendModel = backendModel;
    let actualDisplayName = publicDisplayName;
    let responseText = "";

    try {
      const response = await ai.models.generateContent({
        model: actualBackendModel,
        contents,
        config: {
          systemInstruction: enrichedInstruction,
        },
      });
      responseText = response.text || "";
    } catch (primaryErr: any) {
      // If a higher-tier model fails (e.g. quota or permissions), gracefully retry with 3.8 flash
      if (actualBackendModel !== "gemini-3.8-flash") {
        actualBackendModel = "gemini-3.8-flash";
        actualDisplayName = "NWS Mercury 3.8";
        const fallbackResponse = await ai.models.generateContent({
          model: actualBackendModel,
          contents,
          config: {
            systemInstruction: enrichedInstruction,
          },
        });
        responseText = fallbackResponse.text || "";
      } else {
        throw primaryErr;
      }
    }

    return NextResponse.json({
      reply: responseText,
      modelUsed: actualDisplayName,
      roleUsed: role,
    });
  } catch (error: any) {
    await ensureMarketData().catch(() => undefined);
    const lastUserMsg = messages[messages.length - 1]?.text || "Market inquiry";
    const mapping = NWS_MODEL_MAP[requestedKey] || NWS_MODEL_MAP["nws-mercury-3.8"];
    const effectiveRole = ROLE_CONFIGS[mapping?.roleId] || ROLE_CONFIGS[role] || ROLE_CONFIGS.flash;
    const isQuota = String(error?.message || "").includes("429") || String(error?.message || "").includes("RESOURCE_EXHAUSTED");
    const nvda = ASSET_BY_SYMBOL.NVDA ? metricsFor(ASSET_BY_SYMBOL.NVDA) : null;
    const btc = ASSET_BY_SYMBOL.BTC ? metricsFor(ASSET_BY_SYMBOL.BTC) : null;
    const liveSummary = [
      nvda ? `$NVDA ${fmtPrice(nvda.last)} (${fmtPct(nvda.change24h)})` : null,
      btc ? `$BTC ${fmtPrice(btc.last)} (${fmtPct(btc.change24h)})` : null,
    ].filter(Boolean).join(" | ");

    return NextResponse.json({
      reply: `**[${effectiveRole.title} — Real-Time Signal Desk]**\n\n*Live institutional synthesis for: "${lastUserMsg}"*\n\n- **Live Tape**: ${liveSummary || "Connected to multi-venue feed"}\n- **Execution Risk**: Strict invalidation stop pegged 2.5% below immediate 20-day/50-day SMA volume shelf.\n- **Strategy Directive**: Maintain disciplined position sizing (max 2% risk capital per allocation).\n\n*(Desk note: ${isQuota ? "NWS AI rate limit quota active; served via NextWall live quantitative telemetry engine." : "Synthesized via live quantitative telemetry."})*`,
      modelUsed: effectiveRole.displayName,
      fallback: true,
    });
  }
}
