import type { Metadata } from "next";
import Link from "next/link";
import { COURSES } from "@/lib/content";
import AcademyFAQ from "@/components/academy-faq";

export const metadata: Metadata = {
  title: "Academy",
  description:
    "Four courses on trend reading, crypto liquidity, meme-coin risk and portfolio construction — written by the research desk.",
};

export default function AcademyPage() {
  const totalLessons = COURSES.reduce((a, c) => a + c.lessons.length, 0);
  const totalMinutes = COURSES.reduce((a, c) => a + c.lessons.reduce((x, l) => x + l.minutes, 0), 0);

  return (
    <div>
      <section className="grain border-b border-line/60">
        <div className="mx-auto max-w-7xl px-5 py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">The Academy</p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-bone sm:text-5xl">
            Learn the method, not the calls.
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted">
            A subscription gives you a view. The Academy gives you the skill to disagree with it. Four
            courses, {totalLessons} lessons and roughly {Math.round(totalMinutes / 60)} hours of
            material, written by the analysts who publish the scores.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-10 gap-y-4 border-t border-line/60 pt-6 text-xs text-muted">
            <span><span className="font-mono text-bone">{COURSES.length}</span> courses</span>
            <span><span className="font-mono text-bone">{totalLessons}</span> lessons</span>
            <span><span className="font-mono text-bone">{totalMinutes}</span> minutes</span>
            <span><span className="font-mono text-bone">1</span> foundation course free</span>
            <span className="text-gold-bright font-medium">★ 60 Watchable HD Video Masterclasses Available</span>
          </div>

          <div className="mt-8 rounded-xl border border-gold/40 bg-gold/[0.07] p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <span className="rounded-full border border-gold/50 bg-gold/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gold-bright">
                Now Streaming (3 Dedicated Desks)
              </span>
              <h2 className="mt-2 font-display text-xl text-bone">Watchable Video Tutorial Studio (60 Masterclasses)</h2>
              <p className="mt-1 max-w-xl text-xs text-muted leading-relaxed">
                Stream 60 high-definition interactive masterclasses divided into three specialized desks: Wall Street &amp; Equities (22 videos), Crypto Microstructure (20 videos), and pump.fun Bonding Curve Mechanics (18 videos).
              </p>
            </div>
            <Link
              href="/academy/watch"
              className="shrink-0 rounded-full bg-gold px-6 py-2.5 text-xs font-bold text-ink-950 transition-all hover:bg-gold-bright shadow-lg"
            >
              Enter Video Studio ▶
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <div className="grid gap-6 lg:grid-cols-2">
          {COURSES.map((course, index) => {
            const minutes = course.lessons.reduce((a, l) => a + l.minutes, 0);
            const free = index === 0;
            return (
              <Link
                key={course.slug}
                href={`/academy/${course.slug}`}
                className="group flex flex-col justify-between rounded-xl border border-line bg-ink-900/50 p-7 transition hover:border-gold/40"
              >
                <div>
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted">
                    <span className="text-gold">{course.level}</span>
                    <span className="text-line">·</span>
                    <span>{course.lessons.length} lessons</span>
                    <span className="text-line">·</span>
                    <span>{minutes} min</span>
                    {free && (
                      <span className="ml-auto rounded border border-up/40 px-1.5 py-0.5 text-[9px] text-up">
                        Free
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 font-display text-2xl leading-snug text-bone group-hover:text-gold-bright">
                    {course.title}
                  </h2>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{course.summary}</p>
                </div>
                <div className="mt-6 flex items-center justify-between border-t border-line/60 pt-4">
                  <p className="text-xs text-muted">
                    {course.instructor} · {course.instructorRole}
                  </p>
                  <span className="text-sm text-muted transition group-hover:translate-x-1 group-hover:text-gold-bright">
                    →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-6">
        <div className="rounded-xl border border-line bg-ink-900/40 p-7">
          <h2 className="font-display text-2xl text-bone">How we teach</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {[
              {
                t: "Rules over opinions",
                d: "Every lesson ends in a rule you can write down and apply. No 'feel the market' mysticism.",
              },
              {
                t: "Risk before returns",
                d: "Sizing, invalidation and drawdown tolerance are taught first, because they decide survival.",
              },
              {
                t: "No signals sold as certainty",
                d: "You learn the failure modes of each indicator, including ours. That is the point.",
              },
            ].map((item) => (
              <div key={item.t} className="border-t border-line/60 pt-4">
                <p className="text-sm font-medium text-bone">{item.t}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-muted">{item.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-16">
        <AcademyFAQ />
      </section>
    </div>
  );
}
