"use client";

import { useWhop } from "@/lib/whop-context";

export type BadgeVariant = "pro" | "wsj" | "pill" | "member" | "plus";

export default function WhopBadge({
  exclusive = true,
  className = "ml-1.5",
  size = "sm",
  asSpan = false,
}: {
  exclusive?: boolean;
  variant?: BadgeVariant;
  label?: string;
  className?: string;
  size?: "xs" | "sm" | "md";
  asSpan?: boolean;
}) {
  const { isUnlocked, openWhopModal } = useWhop();
  if (!exclusive) return null;

  const sizeClasses = {
    xs: "px-1 py-[1px] text-[8px] tracking-wider",
    sm: "px-1.5 py-0.5 text-[9px] tracking-widest",
    md: "px-2 py-0.5 text-[10px] tracking-widest",
  }[size];

  const commonClasses = `inline-flex items-center justify-center font-mono font-bold select-none rounded transition-all duration-200 uppercase ${sizeClasses} ${
    isUnlocked
      ? "border border-amber-400/40 bg-gradient-to-r from-amber-500/20 via-gold/30 to-amber-500/20 text-gold-bright shadow-[0_0_8px_rgba(216,171,90,0.25)] hover:border-gold hover:scale-105"
      : "border border-gold/40 bg-ink-900/90 text-gold hover:border-gold hover:bg-gold/15 hover:text-gold-bright hover:shadow-[0_0_10px_rgba(216,171,90,0.2)]"
  } ${className}`;

  if (asSpan) {
    return (
      <span
        title={isUnlocked ? "NextWall Street PRO Access Active" : "NextWall Street PRO"}
        className={commonClasses}
      >
        PRO
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        openWhopModal("NextWall Street PRO Desk");
      }}
      title={isUnlocked ? "NextWall Street PRO Access Active" : "NextWall Street PRO — Click to access"}
      className={`${commonClasses} cursor-pointer`}
    >
      PRO
    </button>
  );
}
