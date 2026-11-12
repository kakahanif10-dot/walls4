"use client";

import React, { useState } from "react";
import DiscordLiveChat from "@/components/discord-live-chat";
import GeminiQuantTerminal from "@/components/gemini-quant-terminal";
import WhopBadge from "@/components/whop-badge";
import { Sparkles, Users, Columns2 } from "lucide-react";

export type FloorMode = "nws-ai" | "split" | "discord";

interface ChatViewContainerProps {
  initialFloor?: FloorMode;
}

export default function ChatViewContainer({ initialFloor = "discord" }: ChatViewContainerProps) {
  const [activeFloor, setActiveFloor] = useState<FloorMode>(initialFloor);

  return (
    <div className="space-y-5">
      {/* View Selector Toggle Banner: NWS AI on left, Community Chat on right */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-line/80 bg-ink-900/80 p-3 sm:px-5 text-xs">
        <div className="flex items-center gap-3">
          <span className="live-dot h-2.5 w-2.5 rounded-full bg-emerald-400 shrink-0 animate-ping" />
          <div>
            <div className="font-semibold text-bone text-sm flex items-center gap-2">
              <span>NextWall Street Community &amp; NWS AI Workspace</span>
              <WhopBadge size="xs" />
            </div>
            <p className="text-muted text-[11px] mt-0.5">
              NWS AI reasoning on the left (as an option) with the 1,840+ member Community Chat on the right.
            </p>
          </div>
        </div>

        {/* Floor Switcher: NWS AI on Left, Community Chat on Right */}
        <div className="flex items-center gap-1.5 rounded-xl border border-line bg-ink-950 p-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveFloor("nws-ai")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
              activeFloor === "nws-ai"
                ? "bg-gold text-ink-950 shadow-sm"
                : "text-muted hover:text-bone"
            }`}
            title="NWS AI Quantitative Terminal (Option on left)"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>NWS AI (Option)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFloor("split")}
            className={`hidden md:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
              activeFloor === "split"
                ? "bg-gold text-ink-950 shadow-sm"
                : "text-muted hover:text-bone"
            }`}
            title="Split View: NWS AI on Left, Community Chat on Right"
          >
            <Columns2 className="h-3.5 w-3.5" />
            <span>Split View</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFloor("discord")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
              activeFloor === "discord"
                ? "bg-gold text-ink-950 shadow-sm"
                : "text-muted hover:text-bone"
            }`}
            title="Community Chat Floor (on right)"
          >
            <Users className="h-3.5 w-3.5" />
            <span>Community Chat</span>
          </button>
        </div>
      </div>

      {activeFloor === "split" ? (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-start">
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-gold/30 bg-gold/[0.05] px-3 py-1.5">
              <span className="font-mono text-xs font-semibold text-gold-bright flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-gold" />
                NWS AI Quantitative Intelligence (Option · Left)
              </span>
              <button
                type="button"
                onClick={() => setActiveFloor("nws-ai")}
                className="text-[10px] font-mono text-muted hover:text-gold transition-colors"
              >
                Expand Full ↗
              </button>
            </div>
            <GeminiQuantTerminal />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-500/[0.05] px-3 py-1.5">
              <span className="font-mono text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-emerald-400" />
                Community Chat Floor (1,840+ Traders · Right)
              </span>
              <button
                type="button"
                onClick={() => setActiveFloor("discord")}
                className="text-[10px] font-mono text-muted hover:text-emerald-300 transition-colors"
              >
                Expand Full ↗
              </button>
            </div>
            <DiscordLiveChat />
          </div>
        </div>
      ) : activeFloor === "nws-ai" ? (
        <GeminiQuantTerminal />
      ) : (
        <DiscordLiveChat />
      )}
    </div>
  );
}
