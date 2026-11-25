import { Clock3, Globe2, History, ShieldCheck } from "lucide-react";

const milestones = [
  {
    period: "2001",
    chapter: "FOUNDATIONS",
    title: "Private Market Advisory",
    description:
      "Founded in 2001 as an independent, community-driven market research and trading consultancy focused on macroeconomic analysis and disciplined capital protection.",
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
            OUR HERITAGE
          </p>
          <h2
            id="heritage-heading"
            className="mt-3 font-display text-3xl text-bone sm:text-4xl"
          >
            Built Through Market Cycles
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted sm:text-base">
            Over two decades of market discipline, now accessible on one digital terminal.
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

        <div className="mx-auto mt-8 max-w-3xl">
          <article className="relative overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-[#211b10] via-[#131923] to-[#10151e] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.22)] sm:p-8">
            <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full border border-gold/10" />
            <div aria-hidden="true" className="pointer-events-none absolute -right-8 -top-8 h-36 w-36 rounded-full border border-gold/[0.08]" />
            <div className="relative grid gap-6 sm:gap-8 md:grid-cols-[0.85fr_1.15fr] md:items-center">
              <div>
                <div className="inline-flex rounded-full border border-gold/30 bg-gold/[0.08] px-3 py-2 text-[10px] font-semibold uppercase leading-relaxed tracking-[0.12em] text-gold-bright sm:text-[11px]">
                  25 Years of Analytical Evolution | Roots Since 2001
                </div>
              </div>
              <div className="border-t border-gold/20 pt-5 md:border-l md:border-t-0 md:pl-8 md:pt-0">
                <p className="text-sm leading-relaxed text-muted sm:text-[15px]">
                  Founded in 2001 as an independent, community-driven market research and trading consultancy focused on macroeconomic analysis and disciplined capital protection, our frameworks have navigated multiple market cycles—from early-2000s market shifts and the 2008 financial crisis to modern digital asset cycles. After evolving into systematic quantitative models in the 2010s, we unified and modernized our analytics under NextWallStreet in 2026 to make structured market intelligence accessible on nextwallstreet.com.
                </p>
              </div>
            </div>
          </article>
        </div>

        <div className="mx-auto mt-8 flex max-w-3xl gap-3 rounded-xl border border-white/[0.06] bg-[#10151e]/75 p-4 sm:p-5">
          <ShieldCheck
            className="mt-0.5 h-4 w-4 shrink-0 text-gold/80"
            aria-hidden="true"
          />
          <p className="text-xs leading-relaxed text-muted sm:text-[13px]">
            NextWallStreet has evolved from a private, community-driven research practice into a modern digital intelligence portal. All market research, quantitative indicators, and analytics are provided for informational and educational purposes only; they do not constitute personalized investment advice or a recommendation to buy or sell any security.
          </p>
        </div>
      </div>
    </section>
  );
}
