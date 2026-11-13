import Link from "next/link";
import MarketExplorer from "@/components/market-explorer";
import WhopBadge from "@/components/whop-badge";
import { byKind, metricsFor, rowsFor, type Kind } from "@/lib/market";
import { ensureMarketData } from "@/lib/market-data";

const COPY: Record<
  Kind,
  { eyebrow: string; title: string; sub: string; note: string; stats: { label: string; hint: string }[] }
> = {
  stock: {
    eyebrow: "Equity coverage",
    title: "S&P 500, Nasdaq & growth equities, scored on trend",
    sub: "Over 800 large-cap, mid-cap, and growth leaders across S&P 500, Nasdaq, and innovation sectors spanning AI infrastructure, semiconductors, cloud software, financials, biotech, energy, and aerospace. Each carries a transparent trend score, stance, and invalidation level.",
    note: "Institutional-grade coverage across mega-caps, mid-caps, and high-beta momentum leaders, scored cleanly on technical structure and momentum.",
    stats: [
      { label: "Names covered", hint: "Equities universe" },
      { label: "Median score", hint: "cross-sector" },
      { label: "Above 50-day", hint: "trend participation" },
      { label: "Avg. volatility", hint: "60-day realised" },
    ],
  },
  crypto: {
    eyebrow: "Digital assets",
    title: "Binance, Coinbase & ecosystem assets, without the narrative tax",
    sub: "Bitcoin, Ethereum, Solana, and 830+ major digital assets spanning Layer-1/2, DeFi, DePIN, AI compute, and Real World Assets (RWAs). Valued on flow, float, and liquidity with continuous real-time price updates.",
    note: "Crypto has no valuation floor. It has a liquidity ceiling. Every stance here is sized around that difference.",
    stats: [
      { label: "Assets covered", hint: "Digital assets" },
      { label: "Median score", hint: "sector composite" },
      { label: "Above 50-day", hint: "trend participation" },
      { label: "Avg. volatility", hint: "60-day realised" },
    ],
  },
  meme: {
    eyebrow: "Speculative markets",
    title: "Pump.fun & viral memes, graded as risk",
    sub: "From Doge and Pepe to 400+ viral breakouts across pump.fun, Solana, Base, and Ethereum (Fartcoin, Goat, Act, Pnut, Moodeng, Popcat, SPX6900, Retardio, Mother, Billy, Michi, Gigachad). There is no fundamental case to make here: only concentration, order-book depth, and bonding curve momentum.",
    note: "Our conviction ceiling for this sector is deliberately disciplined. A high score means the tape is working, not that the asset is fundamentally sound.",
    stats: [
      { label: "Assets covered", hint: "pump.fun & viral" },
      { label: "Median score", hint: "sector composite" },
      { label: "Above 50-day", hint: "trend participation" },
      { label: "Avg. volatility", hint: "60-day realised" },
    ],
  },
};

export default async function CoveragePage({ kind }: { kind: Kind }) {
  await ensureMarketData();
  const copy = COPY[kind];
  const rows = rowsFor(kind);
  const metrics = byKind(kind).map((a) => metricsFor(a));
  const median = [...metrics].sort((a, b) => a.score - b.score)[Math.floor(metrics.length / 2)]?.score ?? 0;
  const above50 = metrics.filter((m) => m.last > m.sma50).length;
  const avgVol = metrics.reduce((a, m) => a + m.vol, 0) / metrics.length;
  const values = [rows.length, median, `${above50}/${metrics.length}`, `${(avgVol * 100).toFixed(0)}%`];

  return (
    <div>
      <section className="grain border-b border-line/60">
        <div className="mx-auto max-w-7xl px-5 py-14 lg:py-16">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold flex items-center">
            <span>{copy.eyebrow}</span>
            <WhopBadge variant={kind === "meme" ? "member" : "wsj"} className="ml-2" />
          </p>
          <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-bone sm:text-5xl flex flex-wrap items-center gap-2">
            <span>{copy.title}</span>
            <WhopBadge variant={kind === "meme" ? "member" : "wsj"} className="text-xs align-middle" />
          </h1>
          <p className="mt-5 max-w-2xl text-[15px] leading-relaxed text-muted">{copy.sub}</p>

          <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-4">
            {copy.stats.map((stat, i) => (
              <div key={stat.label} className="bg-ink-900 px-5 py-4">
                <dd className="font-mono text-2xl text-bone">{values[i]}</dd>
                <dt className="mt-1 text-xs text-muted">{stat.label}</dt>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-muted/60">{stat.hint}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-12">
        <MarketExplorer kind={kind} rows={rows.slice(0, 8)} totalRows={rows.length} />
      </section>

      <section className="mx-auto max-w-7xl px-5">
        <div className="rounded-xl border border-line bg-ink-900/60 p-7 lg:p-9">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Desk note</p>
          <p className="mt-3 max-w-3xl font-display text-xl leading-relaxed text-bone/90">{copy.note}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/disclaimer"
              className="rounded-full border border-line px-4 py-2 text-xs text-bone transition hover:border-gold/40"
            >
              Read the scoring methodology
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 rounded-full border border-gold/50 bg-gold/10 px-4 py-2 text-xs font-medium text-gold-bright transition hover:bg-gold/20"
            >
              <span>Unlock full stance reports</span>
              <WhopBadge className="ml-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
