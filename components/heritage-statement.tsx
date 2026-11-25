const STATEMENT =
  "Founded as an independent, community-driven market research and trading consultancy, focused on macroeconomic analysis and disciplined capital protection.";

export default function HeritageStatement({ placement }: { placement: "top" | "bottom" }) {
  return (
    <aside
      aria-label="NextWallStreet heritage"
      className={`border-y border-gold/10 bg-ink-950 px-5 py-2.5 text-center ${
        placement === "top" ? "" : "mt-8"
      }`}
    >
      <p className="mx-auto max-w-5xl text-[11px] leading-relaxed text-muted/80 sm:text-xs">
        <span className="font-semibold text-gold/90">Our heritage:</span> {STATEMENT}
      </p>
    </aside>
  );
}
