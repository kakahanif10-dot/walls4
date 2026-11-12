import type { Metadata } from "next";
import ChatViewContainer from "@/components/chat-view-container";

export const metadata: Metadata = {
  title: "NWS AI Quantitative Terminal & Trading Floor Community — NextWall Street",
  description:
    "Institutional live trading desk featuring NWS AI multi-turn reasoning (NWS Titan 4.0, NWS Olympus 4.0, NWS Mercury, NWS Velocity), real-time search grounding, 24kHz voice interaction, and 1,840+ trader community.",
};

export default function NwsAiPage() {
  return (
    <div className="mx-auto max-w-[1560px] px-3 py-4 sm:px-6 sm:py-6">
      <ChatViewContainer initialFloor="nws-ai" />
    </div>
  );
}
