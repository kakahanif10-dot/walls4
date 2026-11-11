"use client";

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
  void exclusive;
  void className;
  void size;
  void asSpan;
  return null;
}
