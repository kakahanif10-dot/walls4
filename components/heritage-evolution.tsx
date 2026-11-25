import { Clock3, Globe2, History, ShieldCheck } from "lucide-react";

const milestones = [
  {
    period: "2001",
    chapter: "FOUNDATIONS",
    title: "Private Market Advisory",
    description:
      "Founded as an independent, community-driven market research and trading consultancy, focused on macroeconomic analysis and disciplined capital protection.",
    Icon: History,
    featured: true,
  },
  {
    period: "2010s",
    chapter: "QUANTITATIVE EVOLUTION",
    title: "Systematic Frameworks",
    description:
      "Transitioning from discretionary analysis to algorithmic models and rule-based risk management.",
    Icon: Clock3,
    featured: false,
  },
  {
    period: "2026",
    chapter: "DIGITAL ERA",
    title: "Launch of NextWallStreet",
    description:
      "Bringing these proprietary quantitative indicators, market intelligence, and analytics directly to the public web via our digital platform.",
    Icon: Globe2,
    featured: false,
  },
];

export default function HeritageEvolution() {
  return (
    <section aria-labelledby="heritage-heading" className="bg-[#0B0F17]">
      <div className="mx-auto max-w-7xl px-5 py-20 sm:py-24">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-gold">
            Built through market cycles
          </p>
          <h2
            id="heritage-heading"
            className="mt-3 font-display text-3xl text-bone sm:text-4xl"
          >
            Our Heritage
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Over Two Decades of Market Discipline, Now Accessible Online
          </p>
        </div>

        <div className="mx-auto mt-10 max-w-3xl rounded-2xl border border-gold/20 bg-gradient-to-br from-[#19170f] via-[#111722] to-[#10151e] p-5 sm:p-7">
          <div className="inline-flex rounded-full border border-gold/25 bg-gold/[0.08] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-gold-bright sm:text-[11px]">
            20+ Years Market Intelligence | Roots Since 2001
          </div>
          <h3 className="mt-5 font-display text-2xl leading-tight text-bone sm:text-3xl">
            Two Decades of Analytical Evolution
          </h3>
          <p className="mt-4 text-sm leading-relaxed text-muted sm:text-[15px]">
            Originating as an independent proprietary research desk in 2001, our quantitative models and market frameworks have navigated multiple market cycles—from the early 2000s tech transitions to the current digital asset era. In 2026, we unified and modernized our entire institutional toolset under the nextwallstreet.com terminal to bring high-conviction intelligence directly to modern investors.
          </p>
        </div>

        <div className="relative mx-auto mt-10 max-w-3xl">
          <div
            aria-hidden="true"
            className="absolute bottom-10 left-[19px] top-10 w-px bg-gradient-to-b from-gold/70 via-gold/30 to-gold/10 sm:left-6"
          />
          <ol className="space-y-5">
            {milestones.map(({ period, chapter, title, description, Icon, featured }) => (
              <li key={period} className="relative pl-14 sm:pl-16">
                <span
                  aria-hidden="true"
                  className={`absolute left-0 top-7 z-10 flex h-10 w-10 items-center justify-center rounded-full border ${
                    featured
                      ? "border-gold/70 bg-[#201b12] text-gold-bright shadow-[0_0_24px_rgba(190,150,76,0.14)]"
                      : "border-gold/25 bg-[#111722] text-gold/80"
                  } sm:left-1 sm:h-11 sm:w-11`}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                </span>
                <article
                  className={`rounded-2xl border p-5 sm:p-6 ${
                    featured
                      ? "border-gold/30 bg-gradient-to-br from-[#211c13] via-[#131923] to-[#10151e]"
                      : "border-white/[0.07] bg-[#10151e]"
                  }`}
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`font-luxury-num text-3xl font-medium tracking-[-0.04em] tabular-nums sm:text-4xl ${
                        featured ? "text-gold-bright" : "text-gold/90"
                      }`}
                    >
                      {period}
                    </span>
                    <span className="rounded-full border border-gold/20 bg-gold/[0.07] px-2.5 py-1 text-[9px] font-semibold tracking-[0.16em] text-gold-bright/90">
                      {chapter}
                    </span>
                  </div>
                  <h3 className="mt-3 font-display text-lg text-bone sm:text-xl">
                    {title}
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted">
                    {description}
                  </p>
                </article>
              </li>
            ))}
          </ol>
        </div>

        <div className="mx-auto mt-8 flex max-w-3xl gap-3 rounded-xl border border-white/[0.06] bg-[#10151e]/75 p-4 sm:p-5">
          <ShieldCheck
            className="mt-0.5 h-4 w-4 shrink-0 text-gold/80"
            aria-hidden="true"
          />
          <p className="text-xs leading-relaxed text-muted sm:text-[13px]">
            NextWallStreet has evolved from a private, traditional consultancy into a modern digital intelligence portal. Our market research and quantitative tools are provided for informational and educational purposes only; they do not constitute investment advice or a recommendation to buy or sell any security.
          </p>
        </div>
      </div>
    </section>
  );
}
