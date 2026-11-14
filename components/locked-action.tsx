"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ComponentPropsWithoutRef, type MouseEvent, type ReactNode } from "react";
import { useWhop } from "@/lib/whop-context";
import { getLifetimeCheckoutUrl } from "@/lib/whop-checkout-links";

const PUBLIC_PATHS = new Set(["/", "/pricing", "/disclaimer"]);

export function isPublicRoute(pathname: string | null): boolean {
  if (!pathname) return true;
  if (PUBLIC_PATHS.has(pathname)) return true;
  return false;
}

function labelForLockedRoute(pathname: string | null): string {
  if (!pathname) return "Lifetime Premium";
  if (pathname === "/markets") return "Markets";
  if (pathname === "/crypto" || pathname === "/meme-coins") return "Digital Assets";
  if (pathname.startsWith("/research")) return "Research";
  if (pathname.startsWith("/academy")) return "Academy";
  if (pathname === "/community" || pathname === "/chat") return "Community";
  if (pathname === "/watchlist") return "Watchlist";
  if (pathname.startsWith("/ticker/")) return `${pathname.replace("/ticker/", "")} Dossier`;
  if (pathname.startsWith("/tools/")) {
    return `Trade Tool · ${pathname.replace("/tools/", "").replace(/-/g, " ").toUpperCase()}`;
  }
  return pathname.replace(/^\//, "").replace(/-/g, " ").toUpperCase() || "Lifetime Premium";
}

interface LockedLinkProps extends Omit<ComponentPropsWithoutRef<typeof Link>, "href"> {
  href: string;
  deskLabel?: string;
  children: ReactNode;
}

export function LockedLink({
  href,
  deskLabel,
  onClick,
  children,
  target,
  rel,
  ...rest
}: LockedLinkProps) {
  const { isUnlocked, openWhopModal } = useWhop();

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!isUnlocked && !isPublicRoute(href.split("?")[0])) {
      e.preventDefault();
      e.stopPropagation();
      onClick?.(e);
      openWhopModal(deskLabel || href, href);
      return;
    }
    onClick?.(e);
  };

  return (
    <Link
      href={href}
      prefetch={isUnlocked ? undefined : false}
      target={isUnlocked ? target : undefined}
      rel={isUnlocked ? rel : undefined}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </Link>
  );
}

export function LifetimeRouteGuard({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { isUnlocked, hasCheckedStorage, openWhopModal } = useWhop();
  const checkoutUrl = getLifetimeCheckoutUrl();
  const autoOpenedPathRef = useRef<string | null>(null);

  useEffect(() => {
    if (!hasCheckedStorage || isUnlocked || isPublicRoute(pathname)) {
      if (isPublicRoute(pathname)) {
        autoOpenedPathRef.current = null;
      }
      return;
    }
    if (pathname && autoOpenedPathRef.current !== pathname) {
      autoOpenedPathRef.current = pathname;
      openWhopModal(labelForLockedRoute(pathname), pathname);
    }
  }, [hasCheckedStorage, isUnlocked, pathname, openWhopModal]);

  if (isPublicRoute(pathname)) {
    return <>{children}</>;
  }

  if (!hasCheckedStorage) {
    return (
      <div className="mx-auto flex min-h-[55vh] max-w-2xl items-center justify-center px-5 py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
      </div>
    );
  }

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="mx-auto flex min-h-[68vh] max-w-lg items-center justify-center px-5 py-12">
      <div className="relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#13110c] via-ink-900 to-ink-950 p-7 sm:p-8 shadow-[0_32px_90px_rgba(0,0,0,0.85)] space-y-5">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-gold">
            Membership &amp; Access
          </p>
          <h1 className="mt-1.5 font-display text-2xl text-bone">
            Lifetime Premium
          </h1>
        </div>

        <p className="text-xs sm:text-sm leading-relaxed text-muted">
          One-time membership granting permanent access to all 2,038+ daily trend scores, exact
          invalidation levels, 70 research desks, all four Academy courses, score-change alerts, and
          all 32 trade tools with zero recurring fees.
        </p>

        <div className="rounded-xl bg-ink-950/80 p-4 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-muted">Membership Tier</span>
            <span className="font-semibold text-bone">Lifetime Premium</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-muted">Billing Structure</span>
            <span className="font-medium text-bone">One-time · Permanent access</span>
          </div>
          <div className="flex items-center justify-between pt-1.5">
            <span className="text-muted">Total Investment</span>
            <span className="font-mono text-lg font-bold text-gold-bright tabular-nums">
              $1,487 USD
            </span>
          </div>
        </div>

        <div className="space-y-3">
          {checkoutUrl ? (
            <a
              href={checkoutUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex w-full items-center justify-center rounded-full bg-gold px-6 py-3.5 text-xs font-bold tracking-wide text-ink-950 transition hover:bg-gold-bright shadow-lg"
            >
              Continue to Lifetime Premium checkout — $1,487 USD
            </a>
          ) : (
            <button
              type="button"
              onClick={() => openWhopModal(labelForLockedRoute(pathname), pathname ?? undefined)}
              className="flex w-full items-center justify-center rounded-full bg-gold px-6 py-3.5 text-xs font-bold tracking-wide text-ink-950 transition hover:bg-gold-bright shadow-lg"
            >
              Continue to Lifetime Premium checkout — $1,487 USD
            </button>
          )}

          <button
            type="button"
            onClick={() => openWhopModal("Verify Whop Purchase", pathname ?? undefined)}
            className="flex w-full items-center justify-center rounded-full bg-gold/12 px-5 py-3 text-xs font-semibold text-gold-bright transition hover:bg-gold/20"
          >
            Verify Existing Whop License Key
          </button>
        </div>

        <p className="text-[11px] leading-relaxed text-muted/85 text-center">
          You will continue to Whop to complete the one-time $1,487 USD settlement. Full platform
          access activates immediately upon payment verification.
        </p>

        <div className="flex items-center justify-center gap-4 pt-2 text-xs text-muted">
          <Link href="/" className="hover:text-bone transition">
            ← Return Home
          </Link>
          <span>·</span>
          <Link href="/pricing" className="text-gold-bright hover:underline underline-offset-4">
            View Pricelist
          </Link>
        </div>
      </div>
    </div>
  );
}
