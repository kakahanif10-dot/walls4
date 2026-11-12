"use client";

import React, { useState } from "react";
import DiscordLiveChat from "@/components/discord-live-chat";
import GeminiQuantTerminal from "@/components/gemini-quant-terminal";
import WhopBadge from "@/components/whop-badge";
import { Sparkles, Users, MessageSquare, Bot, Mic, Search, Globe } from "lucide-react";

interface ChatViewContainerProps {
  initialFloor?: "nws-ai" | "discord";
}

export default function ChatViewContainer({ initialFloor = "nws-ai" }: ChatViewContainerProps) {
  const [activeFloor, setActiveFloor] = useState<"nws-ai" | "discord">(initialFloor);

  return (
    <div className="space-y-5">
      {/* View Selector Toggle Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border border-line/80 bg-ink-900/80 p-3 sm:px-5 text-xs">
        <div className="flex items-center gap-3">
          <span className="live-dot h-2.5 w-2.5 rounded-full bg-emerald-400 shrink-0 animate-ping" />
          <div>
            <div className="font-semibold text-bone text-sm flex items-center gap-2">
              <span>NextWall Street NWS AI Desk &amp; Floor Community</span>
              <WhopBadge size="xs" />
            </div>
            <p className="text-muted text-[11px] mt-0.5">
              Select between multi-turn NWS AI reasoning (NWS Titan 4.0, NWS Olympus 4.0, NWS Mercury 3.8, NWS Velocity 3.1) with search grounding &amp; 24kHz voice, or the community floor.
            </p>
          </div>
        </div>

        {/* Floor Switcher */}
        <div className="flex items-center gap-1.5 rounded-xl border border-line bg-ink-950 p-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveFloor("nws-ai")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
              activeFloor === "nws-ai"
                ? "bg-gold text-ink-950 shadow-sm"
                : "text-muted hover:text-bone"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            NWS AI Terminal
          </button>
          <button
            type="button"
            onClick={() => setActiveFloor("discord")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-mono font-semibold transition-all ${
              activeFloor === "discord"
                ? "bg-gold text-ink-950 shadow-sm"
                : "text-muted hover:text-bone"
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Live Floor (1,840+)
          </button>
        </div>
      </div>

      {activeFloor === "nws-ai" ? (
        <GeminiQuantTerminal />
      ) : (
        <DiscordLiveChat />
      )}
    </div>
  );
}
