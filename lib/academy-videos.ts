export type VideoChapter = {
  time: number; // in seconds
  title: string;
  description: string;
};

export type VideoVisualType =
  | "structure"
  | "moving_averages"
  | "invalidation"
  | "sr_flips"
  | "order_book"
  | "volume_profile"
  | "tape_reading"
  | "liquidity_sweeps"
  | "bonding_curve"
  | "wallet_clustering"
  | "scalp_playbook"
  | "narrative_cycle"
  | "position_sizing"
  | "drawdown_math"
  | "execution_checklist"
  | "hedging_beta"
  | "fed_liquidity"
  | "ai_capex"
  | "earnings_pead"
  | "premarket_flow";

export type VideoLesson = {
  id: string;
  title: string;
  category?: "markets" | "crypto" | "meme";
  module: string;
  level: "Beginner" | "Intermediate" | "Advanced";
  durationSeconds: number;
  durationLabel: string;
  videoUrl: string;
  instructor: string;
  instructorRole: string;
  instructorInitials: string;
  visualType: VideoVisualType;
  chapters: VideoChapter[];
  summary: string;
  takeaways: string[];
  quiz: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  };
};

export const ACADEMY_MODULES = [
  "All Modules",
  "Price Action & Structure",
  "Microstructure & Order Flow",
  "Crypto Microstructure & Derivatives",
  "Meme Coins & Pump.fun Alpha",
  "Risk Management & Sizing",
  "Macro & Tech Cycles",
] as const;

export { VIDEO_LESSONS_60, VIDEOS_BY_CATEGORY } from "./academy-videos-60";
import { VIDEO_LESSONS_60 } from "./academy-videos-60";
export const VIDEO_LESSONS_20: VideoLesson[] = VIDEO_LESSONS_60;
