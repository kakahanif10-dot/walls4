import { Clock, Globe, History, Shield } from "lucide-react";

const milestones = [
  {
    date: "2001",
    era: "Foundations",
    title: "Private Market Advisory",
    description:
      "Founded as an independent family-run market research and trading consultancy, focused on macroeconomic analysis and disciplined capital protection.",
    Icon: Clock,
  },
  {
    date: "2010s",
    era: "Quantitative Evolution",
    title: "Systematic Frameworks",
    description:
      "Transitioning from discretionary analysis to algorithmic models and rule-based risk management.",
    Icon: History,
  },
  {
    date: "2026",
    era: "Digital Era",
    title: "Launch of NextWallStreet",
    description:
      "Bringing these proprietary quantitative indicators, market intelligence, and analytics directly to the public web via our digital platform.",
    Icon: Globe,
  },
];

export default function HeritageEvolution() {
  return (
    <section
      aria-labelledby="heritage-heading"
      className="relative overflow-hidden border-y border-white/[0.06] bg-[#0B0F17]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(176,133,68,0.09),transparent_58%)]" />
      <div className="relative mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20 lg:py-24">
        <header className="mx-auto mb-12 max-w-3xl text-center sm:mb-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#B58A4A]/30 bg-[#B58A4A]/[0.08] px-3.5 py-1.5 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#D6B477]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#C6A367]" aria-hidden="true" />
            Built on discipline
          </span>
          <h2
            id="heritage-heading"
            className="mt-5 font-display text-4xl leading-tight tracking-[-0.025em] text-bone sm:text-5xl"
          >
            Our Heritage
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-[#A7AFBC] sm:text-base">
            Over Two Decades of Market Discipline, Now Accessible Online
          </p>
        </header>

        <div className="relative mx-auto max-w-4xl">
          <div
            className="absolute bottom-12 left-[1.125rem] top-8 w-px bg-gradient-to-b from-[#C6A367]/60 via-[#C6A367]/30 to-transparent sm:left-[188px]"
            aria-hidden="true"
          />
          <ol>
            {milestones.map(({ date, era, title, description, Icon }) => (
              <li
                key={date}
                className="relative grid gap-4 pb-9 pl-12 last:pb-0 sm:grid-cols-[150px_1fr] sm:gap-8 sm:pl-0"
              >
                <div className="absolute left-0 top-0.5 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-[#C6A367]/35 bg-[#151923] text-[#D6B477] shadow-[0_0_0_6px_#0B0F17] sm:left-[calc(150px+1rem)] sm:h-11 sm:w-11">
                  <Icon className="h-4 w-4 sm:h-[18px] sm:w-[18px]" strokeWidth={1.6} aria-hidden="true" />
                </div>
                <div className="pt-1 sm:pr-4 sm:text-right">
                  <p className="font-mono text-sm font-semibold tracking-[0.08em] text-[#D6B477]">{date}</p>
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#808A99]">{era}</p>
                </div>
                <article className="rounded-xl border border-white/[0.07] bg-white/[0.025] px-5 py-5 transition-colors hover:border-[#C6A367]/25 hover:bg-white/[0.04] sm:px-6 sm:py-6">
                  <h3 className="font-display text-xl text-bone sm:text-[1.35rem]">{title}</h3>
                  <p className="mt-2.5 text-sm leading-7 text-[#A7AFBC]">{description}</p>
                </article>
              </li>
            ))}
          </ol>
        </div>

        <div className="mx-auto mt-12 flex max-w-4xl items-start gap-4 rounded-xl border border-[#C6A367]/20 bg-[#C6A367]/[0.045] px-5 py-5 sm:mt-14 sm:px-6 sm:py-6">
          <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#C6A367]/25 bg-[#C6A367]/[0.08] text-[#D6B477]">
            <Shield className="h-[18px] w-[18px]" strokeWidth={1.6} aria-hidden="true" />
          </span>
          <p className="text-sm leading-7 text-[#B4BBC6]">
            Our journey spans a private, traditional consultancy and a modern digital intelligence
            portal. Today, NextWallStreet brings that research heritage online with clear, systematic
            market analysis and a disciplined approach to risk.
          </p>
        </div>
      </div>
    </section>
  );
}
