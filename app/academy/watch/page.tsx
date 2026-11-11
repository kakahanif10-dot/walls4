import type { Metadata } from "next";
import Link from "next/link";
import WatchableVideoPlayer from "@/components/watchable-video-player";
import WhopBadge from "@/components/whop-badge";
import WatchCurriculumGrid from "@/components/watch-curriculum-grid";
import { VIDEO_LESSONS_60 } from "@/lib/academy-videos";

export const metadata: Metadata = {
  title: "60 Watchable Video Masterclasses — NextWall Street Academy",
  description:
    "Watch 60 real playable video masterclasses across Wall Street & Day Trading, Crypto & Microstructure, and Meme Coins & pump.fun.",
};

export default function WatchStudioPage() {
  return (
    <div className="mx-auto max-w-7xl px-5 py-10 lg:py-14">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-2 text-xs text-muted">
        <Link href="/academy" className="hover:text-bone">Academy</Link>
        <span className="text-line">/</span>
        <span className="text-gold-bright">Video Tutorial Studio (60 Masterclasses)</span>
      </nav>

      {/* Main Video Player Section */}
      <WatchableVideoPlayer courseTitle="Institutional 60-Lesson Trading Architecture & Risk Masterclass" />

      {/* Video Curriculum Grid - 60 Comprehensive Lessons across 3 Desks */}
      <div className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line/60 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-gold">Comprehensive Curriculum</span>
              <span className="rounded-full bg-gold/15 border border-gold/40 px-2 py-0.5 text-[10px] font-mono font-bold text-gold-bright">
                60 Video Lessons
              </span>
            </div>
            <h3 className="mt-1 font-display text-2xl text-bone flex items-center">
              <span>All 60 Watchable Video Masterclasses</span>
              <WhopBadge size="xs" className="ml-2" />
            </h3>
            <p className="mt-1 text-xs text-muted">
              Pilih dari 3 menu desk: Wall Street &amp; Day Trading (22 video), Crypto &amp; Derivatives (20 video), atau Meme Coins pump.fun (18 video).
            </p>
          </div>
          <Link href="/academy" className="text-xs text-muted hover:text-gold-bright">
            Lihat silabus tertulis →
          </Link>
        </div>

        <div className="mt-8">
          <WatchCurriculumGrid lessons={VIDEO_LESSONS_60} />
        </div>
      </div>
    </div>
  );
}
