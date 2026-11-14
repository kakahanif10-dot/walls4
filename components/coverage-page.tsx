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
      { label: "Avg. volatility", hint: "60-day realized" },
    ],
  },
  crypto: {
    eyebrow: "Digital Assets",
    title: "Core Digital Assets & High-Beta Risk Coverage",
    sub: "1,238 digital instruments combining 831 core ecosystem leaders (Bitcoin, Ethereum, Solana, Layer-1/2, DeFi, and RWAs) with 407 high-beta speculative tokens—each scored on flow, liquidity depth, realized volatility, and mathematical invalidation levels.",
    note: "Digital assets have no equity valuation floor; they trade on liquidity ceilings, float, and depth. Core assets and high-beta speculative sleeves are segregated so risk budgets remain strictly enforced.",
    stats: [
      { label: "Assets covered", hint: "831 Core · 407 Speculative" },
      { label: "Median score", hint: "sector composite" },
      { label: "Above 50-day", hint: "trend participation" },
      { label: "Avg. volatility", hint: "60-day realized" },
    ],
  },
  meme: {
    eyebrow: "Speculative & High-Beta Risk",
    title: "Speculative Digital Assets, Graded Strictly for Risk",
    sub: "407 high-beta speculative tokens scored on wallet concentration, order-book depth, and narrative decay—consolidated inside Digital Assets with hard 2% position caps and mechanical exit triggers.",
    note: "Our conviction ceiling for high-beta speculative tokens is deliberately disciplined. A high score reflects short-term liquidity flow, never fundamental quality.",
    stats: [
      { label: "Assets covered", hint: "831 Core · 407 Speculative" },
      { label: "Median score", hint: "sector composite" },
      { label: "Above 50-day", hint: "trend participation" },
      { label: "Avg. volatility", hint: "60-day realized" },
    ],
  },
};

export default async function CoveragePage({
  kind,
  tab,
}: {
  kind: Kind;
  tab?: "core" | "speculative";
}) {
  await ensureMarketData();
  const isDigitalAssets = kind === "crypto" || kind === "meme";
  const initialTab = tab ?? (kind === "meme" ? "speculative" : "core");
  const copy = COPY[isDigitalAssets && initialTab === "speculative" ? "meme" : kind];

  const rows = isDigitalAssets ? rowsFor("crypto") : rowsFor(kind);
  const speculativeRows = isDigitalAssets ? rowsFor("meme") : undefined;
  const statAssets = isDigitalAssets
    ? [...byKind("crypto"), ...byKind("meme")]
    : byKind(kind);

  const metrics = statAssets.map((a) => metricsFor(a));
  const median = [...metrics].sort((a, b) => a.score - b.score)[Math.floor(metrics.length / 2)]?.score ?? 0;
  const above50 = metrics.filter((m) => m.last > m.sma50).length;
  const avgVol = metrics.reduce((a, m) => a + m.vol, 0) / metrics.length;
  const values = [statAssets.length, median, `${above50}/${metrics.length}`, `${(avgVol * 100).toFixed(0)}%`];

  return (
    <div>
      <section className="grain">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:py-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold flex items-center">
            <span>{copy.eyebrow}</span>
            <WhopBadge variant={isDigitalAssets && initialTab === "speculative" ? "member" : "wsj"} className="ml-2" />
          </p>
          <h1 className="mt-3 max-w-3xl font-display text-3xl leading-tight text-bone sm:text-5xl flex flex-wrap items-center gap-2">
            <span>{copy.title}</span>
            <WhopBadge variant={isDigitalAssets && initialTab === "speculative" ? "member" : "wsj"} className="text-xs align-middle" />
          </h1>
          <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-muted">{copy.sub}</p>

          <dl className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
            {copy.stats.map((stat, i) => (
              <div key={stat.label} className="rounded-xl bg-ink-900/60 px-5 py-4">
                <dd className="font-mono text-2xl text-bone tabular-nums">{values[i]}</dd>
                <dt className="mt-1 text-xs text-muted">{stat.label}</dt>
                <p className="mt-0.5 text-[10px] uppercase tracking-[0.12em] text-muted/60">{stat.hint}</p>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-8 sm:py-10">
        <MarketExplorer
          key={isDigitalAssets ? initialTab : kind}
          rows={rows}
          speculativeRows={speculativeRows}
          initialTab={initialTab}
        />
      </section>

      <section className="mx-auto max-w-7xl px-5 pb-4">
        <div className="rounded-2xl bg-ink-900/55 p-6 lg:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gold">Desk note</p>
          <p className="mt-3 max-w-3xl font-display text-xl leading-relaxed text-bone/90">{copy.note}</p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/disclaimer"
              className="rounded-full bg-ink-950/75 px-4 py-2 text-xs text-bone transition hover:bg-ink-850 hover:text-gold-bright"
            >
              Read the scoring methodology
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-4 py-2 text-xs font-medium text-gold-bright transition hover:bg-gold/25"
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
