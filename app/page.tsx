import Link from "next/link";
import AuthButton from "@/components/auth-button";
import TickerTape from "@/components/ticker-tape";
import DisclaimerMarquee from "@/components/disclaimer-marquee";
import Sparkline from "@/components/sparkline";
import { LivePrice, LiveChange } from "@/components/live-price";
import FrontpageTriplePoster from "@/components/frontpage-triple-poster";
import { LockedLink } from "@/components/locked-action";
import { ARTICLES, COURSES } from "@/lib/content";
import { ASSETS, byKind, marketPulse, rowsFor, stanceColor, type Row } from "@/lib/market";
import { ensureMarketData } from "@/lib/market-data";
import { getFrontpageIntelBundle } from "@/lib/live-frontpage-data";

const TAPE_SYMBOLS = [
  "ICE",
  "AMGN",
  "CARR",
  "NVDA",
  "AAPL",
  "MSFT",
  "AMZN",
  "GOOGL",
  "META",
  "TSLA",
  "JPM",
  "AVGO",
  "AMD",
  "BTC",
  "ETH",
  "SOL",
  "AVAX",
  "LINK",
];

const BOARD_SYMBOLS = ["ICE", "NVDA", "JPM", "MSFT", "TSLA"];

function BoardRow({ row }: { row: Row }) {
  return (
    <LockedLink
      href={`/ticker/${row.symbol}`}
      deskLabel={`${row.symbol} Trend Dossier`}
      className="font-institutional group flex items-center justify-between gap-4 rounded-xl px-3.5 py-3 transition hover:bg-ink-900/55"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="w-14 shrink-0 text-sm font-bold tracking-[0.03em] text-bone group-hover:text-gold-bright">
          {row.symbol}
        </span>
        <span className="hidden truncate text-xs text-muted sm:block">{row.group}</span>
      </div>
      <div className="flex items-center gap-4">
        <Sparkline values={row.spark} width={70} height={22} className="hidden sm:block" />
        <span className="w-24 text-right">
          <LivePrice
            symbol={row.symbol}
            base={row.price}
            kind={row.kind}
            className="text-sm font-semibold text-bone tabular-nums"
          />
        </span>
        <span className="w-16 text-right">
          <LiveChange
            symbol={row.symbol}
            change={row.change24h}
            className="text-xs font-semibold tabular-nums"
          />
        </span>
        <span
          className={`hidden w-24 rounded-full px-2.5 py-1 text-center text-[11px] font-semibold tracking-[0.02em] sm:inline-block ${stanceColor(row.stance)}`}
        >
          {row.stance}
        </span>
      </div>
    </LockedLink>
  );
}

export default async function HomePage() {
  const [, frontpageBundle] = await Promise.all([
    ensureMarketData(),
    getFrontpageIntelBundle(),
  ]);
  const pulse = marketPulse();
  const allRows = rowsFor();
  const rowBySymbol = new Map(allRows.map((row) => [row.symbol, row]));
  const tapeRows = TAPE_SYMBOLS.map((sym) => rowBySymbol.get(sym)).filter((r): r is Row => Boolean(r));
  const board = BOARD_SYMBOLS.map((sym) => rowBySymbol.get(sym))
    .filter((r): r is Row => Boolean(r))
    .sort((a, b) => b.score - a.score);
  const featured = ARTICLES.slice(0, 3);
  const courses = COURSES;

  const equityCount = byKind("stock").length;
  const cryptoCount = byKind("crypto").length;
  const speculativeCount = byKind("meme").length;

  return (
    <div>
      <section className="grain relative overflow-hidden">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-16 lg:grid-cols-[1.15fr_0.85fr] lg:gap-16 lg:py-24">
          <div className="rise">
            <div className="inline-flex items-center gap-2 rounded-full bg-ink-900/80 px-3.5 py-1.5 text-[11px] text-muted">
              <span className="h-1.5 w-1.5 rounded-full bg-up" />
              LIFETIME ACCESS ONLY · $1,487 USD ONE-TIME
            </div>

            <h1 className="mt-6 font-display text-[2.75rem] leading-[1.05] text-bone sm:text-6xl">
              Know which
              <br />
              trends are real.
            </h1>

            <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-muted">
              NextWallStreet scores the trend, names the stance and publishes the invalidation
              level — across equities, digital assets and speculative markets. Lifetime Access Only ($1,487 USD one-time) unlocks all 2,038+ daily trend scores, exact invalidation
              levels, 70 Research Desks, 60 Academy Lessons, 32 Trade Tools, and 1,100+ Community
              Members. One lifetime plan only — no monthly or annual service.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3.5">
              <Link
                href="/pricing"
                className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink-950 transition hover:bg-gold-bright"
              >
                One Lifetime Plan Only — $1,487 USD
              </Link>
              <AuthButton />
              <LockedLink
                href="/markets"
                deskLabel="US Equities Board"
                className="rounded-full bg-ink-900/80 px-6 py-3 text-sm text-bone transition hover:bg-ink-850 hover:text-gold-bright"
              >
                See today&apos;s board
              </LockedLink>
            </div>

            <p className="mt-5 text-xs text-muted/70">
              Analysis and education only. Not investment advice. Real-time quotes across equities,
              digital assets, and speculative markets.
            </p>

            <dl className="mt-12 grid max-w-2xl grid-cols-2 gap-x-8 gap-y-6 pt-2 sm:grid-cols-3 lg:flex lg:items-start lg:justify-between lg:gap-x-6">
              {[
                { k: ASSETS.length.toLocaleString(), v: "Assets Tracked" },
                { k: "70", v: "Research Desks" },
                { k: "60", v: "Academy Lessons" },
                { k: "32", v: "Trade Tools" },
                { k: "1,100+", v: "Community Members" },
              ].map((item) => (
                <div key={item.v}>
                  <dt className="font-display text-2xl sm:text-3xl text-bone">{item.k}</dt>
                  <dd className="mt-1 text-xs text-muted">{item.v}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="rise w-full rounded-2xl bg-ink-900/60 p-6 sm:p-7 backdrop-blur lg:max-w-[440px] lg:justify-self-end">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                  Market pulse
                </p>
                <p className="font-institutional mt-1 text-xs text-muted">
                  Composite of equity trend scores
                </p>
              </div>
              <span className="font-institutional rounded-full bg-gold/15 px-3 py-1 text-[11px] font-semibold tracking-[0.04em] text-gold-bright">
                {pulse.label}
              </span>
            </div>

            <div className="mt-5 flex items-baseline gap-2.5">
              <span className="font-luxury-num text-5xl font-medium tracking-[-0.02em] text-bone tabular-nums">
                {pulse.score}
              </span>
              <span className="font-institutional text-xs font-medium tracking-[0.06em] text-muted">
                / 100
              </span>
            </div>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-ink-950/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-gold/60 to-up"
                style={{ width: `${pulse.score}%` }}
              />
            </div>

            <div className="font-institutional mt-5 grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-ink-950/75 px-4 py-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Breadth
                </p>
                <p className="font-luxury-num mt-1 text-xl font-medium tracking-[-0.01em] text-bone tabular-nums">
                  {pulse.breadth}%
                </p>
                <p className="text-[10px] text-muted/70">names scoring 60+</p>
              </div>
              <div className="rounded-xl bg-ink-950/75 px-4 py-3.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">
                  Risk regime
                </p>
                <p className="font-luxury-num mt-1 text-xl font-medium tracking-[-0.01em] text-bone">
                  Elevated
                </p>
                <p className="text-[10px] text-muted/70">size down, not out</p>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-ink-950/55 px-4 py-3.5 transition hover:bg-ink-950/80">
              <LockedLink
                href="/research/the-breadth-divergence-playbook-when-five-mega-caps-carry-the-index"
                deskLabel="Breadth Divergence Playbook Research"
                className="group flex items-start gap-3"
              >
                <span className="mt-0.5 shrink-0 text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">
                  Latest
                </span>
                <span className="text-sm leading-snug text-bone/90 group-hover:text-gold-bright">
                  The Breadth Divergence Playbook: When Five Mega-Caps Carry the Index.
                </span>
              </LockedLink>
            </div>
          </div>
        </div>
      </section>

      <TickerTape rows={tapeRows} />

      <DisclaimerMarquee />

      <div className="pt-24 sm:pt-36">
        <FrontpageTriplePoster initialData={frontpageBundle} />
      </div>

      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="grid items-start gap-12 lg:grid-cols-[1fr_1.1fr] lg:gap-16">
          <div>
            <h2 className="font-display text-3xl leading-tight text-bone sm:text-4xl">
              One score. One stance. One invalidation level.
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
              Most market commentary gives you a direction without a mechanism. We publish the
              composite math behind every score, the exact level at which the call is wrong, and a
              confidence figure that shrinks when the tape gets noisy.
            </p>

            <div className="mt-8 space-y-3.5">
              {[
                {
                  n: "01",
                  t: "Structure",
                  d: "Price relative to the 20-, 50- and 200-day averages, with the slope of each.",
                },
                {
                  n: "02",
                  t: "Momentum",
                  d: "Thirty-session rate of change and RSI positioning, weighted for trend persistence.",
                },
                {
                  n: "03",
                  t: "Risk",
                  d: "Realized volatility, position in the 52-week range and a risk grade that drives sizing.",
                },
              ].map((step) => (
                <div key={step.n} className="flex gap-4 rounded-xl bg-ink-900/50 px-5 py-4">
                  <span className="font-mono text-xs text-gold">{step.n}</span>
                  <div>
                    <p className="text-sm font-medium text-bone">{step.t}</p>
                    <p className="mt-1 text-sm leading-relaxed text-muted">{step.d}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-ink-900/55 p-6 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-sm font-medium text-bone">Today&apos;s board — equities</h3>
              <LockedLink
                href="/markets"
                deskLabel="US Equities Board"
                className="text-xs text-muted transition hover:text-gold-bright"
              >
                View all →
              </LockedLink>
            </div>
            <div className="mt-4 space-y-1.5 rounded-xl bg-ink-950/55 p-2">
              {board.map((row) => (
                <BoardRow key={row.symbol} row={row} />
              ))}
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-muted/70">
              Ranked by live composite trend score across core US leaders. Stances are objective model
              output, not personal recommendations.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-ink-900/30">
        <div className="mx-auto max-w-7xl px-5 py-20">
          <h2 className="font-display text-3xl text-bone sm:text-4xl">Three markets. Three honest frameworks.</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                href: "/markets",
                eyebrow: "Equities",
                title: "S&P 500, Nasdaq & growth leaders",
                body: "AI infrastructure, software, financials, energy and consumer staples — scored on structure and momentum with fundamentals as context.",
                meta: `${equityCount} names · daily updates`,
              },
              {
                href: "/crypto",
                eyebrow: "Digital assets",
                title: "Flow, float and liquidity",
                body: "No cash flow to discount, so we price the regime instead: real yields, dollar direction, ETF flow and on-chain activity.",
                meta: `${cryptoCount} assets · volatility sized`,
              },
              {
                href: "/crypto?tab=speculative",
                eyebrow: "Speculative Risk Models",
                title: "Attention markets, graded as risk",
                body: "Concentration, order-book depth and narrative half-life. Hard position caps and mechanical exits, not conviction plays.",
                meta: `${speculativeCount} assets · risk-first`,
              },
            ].map((card) => (
              <LockedLink
                key={card.href}
                href={card.href}
                deskLabel={card.eyebrow}
                className="group flex flex-col justify-between rounded-2xl bg-ink-950/75 p-7 transition hover:bg-ink-900/90"
              >
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-gold">
                    {card.eyebrow}
                  </p>
                  <h3 className="mt-3 font-display text-xl text-bone group-hover:text-gold-bright">
                    {card.title}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{card.body}</p>
                </div>
                <p className="mt-6 text-[11px] uppercase tracking-[0.12em] text-muted/60">{card.meta}</p>
              </LockedLink>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20">
        <div className="flex items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Research</p>
            <h2 className="mt-3 font-display text-3xl text-bone sm:text-4xl">This week from the desk</h2>
          </div>
          <LockedLink
            href="/research"
            deskLabel="Institutional Research Archive"
            className="hidden text-sm text-muted transition hover:text-gold-bright sm:block"
          >
            All research →
          </LockedLink>
        </div>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {featured.map((article) => (
            <LockedLink
              key={article.slug}
              href={`/research/${article.slug}`}
              deskLabel={article.title}
              className="group flex flex-col rounded-2xl bg-ink-900/55 p-7 transition hover:bg-ink-900/85"
            >
              <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.14em] text-muted">
                <span className="text-gold">{article.tags[0]}</span>
                <span className="text-muted/40">·</span>
                <span>{article.readMinutes} min</span>
              </div>
              <h3 className="mt-4 font-display text-xl leading-snug text-bone group-hover:text-gold-bright">
                {article.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted">{article.dek}</p>
              <p className="mt-6 text-xs text-muted/70">
                {article.author} · {article.role}
              </p>
            </LockedLink>
          ))}
        </div>
      </section>

      <section className="bg-ink-900/30">
        <div className="mx-auto grid max-w-7xl items-center gap-12 px-5 py-20 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">The Academy</p>
            <h2 className="mt-3 font-display text-3xl leading-tight text-bone sm:text-4xl">
              Signals fade. Process compounds.
            </h2>
            <p className="mt-5 max-w-md text-[15px] leading-relaxed text-muted">
              Lifetime Access Only unlocks the complete 60-lesson Academy curriculum across 4 courses:
              structure reading, momentum interpretation, crypto liquidity, portfolio sizing and
              speculative risk traps. Written by the same desk that publishes the scores — no
              recycled course content.
            </p>
            <LockedLink
              href="/academy"
              deskLabel="NextWallStreet Academy"
              className="mt-8 inline-block rounded-full bg-ink-950/80 px-6 py-3 text-sm text-bone transition hover:bg-ink-850 hover:text-gold-bright"
            >
              Explore the curriculum
            </LockedLink>
          </div>

          <div className="space-y-3.5">
            {courses.map((course) => (
              <LockedLink
                key={course.slug}
                href={`/academy/${course.slug}`}
                deskLabel={course.title}
                className="group flex items-center justify-between gap-4 rounded-xl bg-ink-950/75 px-6 py-4.5 transition hover:bg-ink-900/90"
              >
                <div>
                  <p className="text-[10px] uppercase tracking-[0.14em] text-gold">{course.level}</p>
                  <p className="mt-1 text-sm font-medium text-bone group-hover:text-gold-bright">
                    {course.title}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {course.lessons.length} lessons ·{" "}
                    {course.lessons.reduce((a, l) => a + l.minutes, 0)} min · {course.instructor}
                  </p>
                </div>
                <span className="text-muted transition group-hover:translate-x-1 group-hover:text-gold-bright">
                  →
                </span>
              </LockedLink>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-20 pb-8">
        <div className="grain mx-auto max-w-4xl overflow-hidden rounded-2xl bg-ink-900/60 px-6 py-10 text-center sm:px-12 sm:py-12">
          <h2 className="mx-auto max-w-2xl font-display text-3xl leading-tight text-bone sm:text-4xl">
            Read the market the way the desk does.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-muted">
            LIFETIME ACCESS ONLY — $1,487 USD, paid once. No monthly or annual plans or renewals. Unlock all 2,038+
            daily trend scores, exact invalidation levels, 70 Research Desks, 60 Academy Lessons,
            32 Trade Tools, and 1,100+ Community Members with transparent math.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/pricing"
              className="rounded-full bg-gold px-6 py-3 text-sm font-semibold text-ink-950 transition hover:bg-gold-bright"
            >
              One Lifetime Plan Only — $1,487 USD
            </Link>
            <LockedLink
              href="/research"
              deskLabel="Institutional Research"
              className="rounded-full bg-ink-950/80 px-6 py-3 text-sm text-bone transition hover:bg-ink-850 hover:text-gold-bright"
            >
              Explore Research Desks
            </LockedLink>
          </div>
        </div>
      </section>
    </div>
  );
}
