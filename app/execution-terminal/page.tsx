import type { Metadata } from "next";
import Link from "next/link";
import ExecutionRiskTerminal from "@/components/execution-risk-terminal";

export const metadata: Metadata = {
  title: "Trade Execution & Risk Terminal — NextWallStreet",
  description:
    "Institutional invalidation-based position sizer, 40/35/25 composite score breakdown, What-If drawdown simulator, and historical signal audit trail across Equities, Digital Assets, and Speculative tokens.",
};

export default function ExecutionTerminalPage() {
  return (
    <div>
      <section className="grain">
        <div className="mx-auto max-w-[1440px] px-5 py-9 sm:py-10">
          <nav className="flex items-center gap-2 text-xs text-muted">
            <Link href="/" className="hover:text-bone">
              Home
            </Link>
            <span className="text-line">/</span>
            <Link href="/desks" className="hover:text-bone">
              Trade Tools
            </Link>
            <span className="text-line">/</span>
            <span className="text-gold-bright">Trade Execution &amp; Risk Terminal</span>
          </nav>

          <h1 className="mt-3 max-w-3xl font-display text-3xl leading-tight text-bone sm:text-4xl">
            Trade Execution &amp; Risk Terminal
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
            Size exposure around exact mathematical invalidation levels, stress-test composite score thresholds before
            drawdowns occur, and export audit-ready compliance logs across Equities, Digital Assets, and Speculative
            markets.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-8">
        <ExecutionRiskTerminal />
      </section>
    </div>
  );
}
