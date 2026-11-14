import type { Metadata } from "next";
import Link from "next/link";
import PrecisionQuantCalculator from "@/components/precision-quant-calculator";

export const metadata: Metadata = {
  title: "Precision Quant Calculator — NextWallStreet",
  description:
    "Live free-API quantitative calculator powered by Binance Spot/Futures, Coinbase, Yahoo Finance 90D OHLCV (14D ATR & 20D Volatility), and Frankfurter ECB spot FX rates.",
};

export default function PrecisionCalculatorPage() {
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
            <span className="text-gold-bright">Precision Quant Calculator</span>
          </nav>

          <h1 className="mt-3 max-w-3xl font-display text-3xl leading-tight text-bone sm:text-4xl">
            Precision Quant Calculator
          </h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-muted">
            Real-time ATR volatility sizing, perpetual funding &amp; liquidation math, Kelly Criterion expectancy modeling,
            and DCA scaling ladders fed directly by zero-key public market APIs.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1440px] px-5 py-8">
        <PrecisionQuantCalculator />
      </section>
    </div>
  );
}
