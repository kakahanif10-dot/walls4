type BrandMarkProps = {
  centered?: boolean;
};

export default function BrandMark({ centered = false }: BrandMarkProps) {
  return (
    <span
      role="img"
      aria-label="NextWallStreet — market intelligence"
      className={`inline-flex items-center gap-2.5 ${centered ? "justify-center text-center" : ""}`}
    >
      <span
        aria-hidden="true"
        className="flex h-9 w-9 shrink-0 items-center justify-center border border-gold/60 bg-ink-950 font-display text-[11px] font-semibold tracking-[-0.12em] text-gold-bright shadow-[inset_0_0_0_2px_rgba(216,171,90,0.08)]"
      >
        NW
      </span>
      <span className="flex flex-col leading-none">
        <span className="font-display text-[15px] font-semibold uppercase tracking-[0.075em] text-bone sm:text-base">
          NextWallStreet
        </span>
        <span className="mt-1.5 font-mono text-[8px] font-medium uppercase tracking-[0.22em] text-gold/80">
          Market Intelligence
        </span>
      </span>
    </span>
  );
}
