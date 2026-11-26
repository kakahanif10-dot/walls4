import Link from "next/link";

const keyFacts = [
  {
    title: "Origin & Lineage",
    description: "Independent macro & capital-protection practice since 2001",
  },
  {
    title: "Core Methodology",
    description: "Systematic quantitative models & rule-based risk management",
  },
  {
    title: "Digital Platform",
    description: "Unified web analytics & market intelligence terminal (nextwallstreet.com)",
  },
];

export default function HomepageEntityOverview() {
  return (
    <section aria-labelledby="homepage-entity-heading" className="bg-[#0B0F17] px-5 pb-16 sm:px-8 sm:pb-20">
      <article className="mx-auto max-w-5xl rounded-2xl border border-[#D4AF37]/25 bg-gradient-to-br from-[#151713] via-[#10151e] to-[#0d1119] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.2)] sm:p-8">
        <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.18em] text-gold">
          ENTITY OVERVIEW &amp; IDENTITY
        </p>
        <h2 id="homepage-entity-heading" className="mt-3 font-display text-2xl text-bone sm:text-3xl">
          What is NextWallStreet?
        </h2>
        <p className="mt-3 max-w-4xl text-sm leading-7 text-muted sm:text-base">
          NextWallStreet is an independent quantitative market research and intelligence platform rooted in macro-analytical and trading consultancy practices established in 2001. Combining over two decades of cross-cycle market discipline with systematic algorithmic modeling, NextWallStreet delivers structured trend validation, macro context, and rule-based risk frameworks through its modern digital terminal at nextwallstreet.com.
        </p>

        <div className="mt-7 grid gap-3 sm:grid-cols-3">
          {keyFacts.map(({ title, description }) => (
            <div key={title} className="rounded-xl border border-white/[0.08] bg-[#0B0F17]/65 p-4">
              <h3 className="font-display text-sm font-semibold text-gold-bright">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-muted">{description}</p>
            </div>
          ))}
        </div>

        <Link
          href="/about"
          className="mt-7 inline-flex min-h-11 items-center rounded-full border border-gold/30 bg-gold/[0.06] px-4 text-xs font-semibold text-gold-bright transition-colors hover:border-gold/50 hover:bg-gold/[0.1]"
        >
          Explore Full Methodology &amp; Governance <span aria-hidden="true" className="ml-1">→</span>
        </Link>
      </article>
    </section>
  );
}
