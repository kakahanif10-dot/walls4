"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Moon, RefreshCw, Sun, GitCompare } from "lucide-react";
import {
  INSTITUTIONAL_TOOL_SPECS,
  type InstitutionalToolSlug,
} from "@/lib/institutional-tools-data";
import WorkflowMatrix from "./workflow-matrix";

interface ToolShellProps {
  slug: InstitutionalToolSlug;
  asOf?: string;
  activeSources?: string[];
  loading?: boolean;
  onRefresh?: () => void;
  toolbarExtra?: React.ReactNode;
  children: (ctx: { isLight: boolean }) => React.ReactNode;
}

export default function InstitutionalToolShell({
  slug,
  asOf,
  activeSources,
  loading = false,
  onRefresh,
  toolbarExtra,
  children,
}: ToolShellProps) {
  const [themeMode, setThemeMode] = useState<"dark" | "light">("dark");
  const [showCompare, setShowCompare] = useState<boolean>(false);

  const isLight = themeMode === "light";
  const spec = INSTITUTIONAL_TOOL_SPECS.find((t) => t.slug === slug) ?? INSTITUTIONAL_TOOL_SPECS[0];
  const sources = activeSources && activeSources.length > 0 ? activeSources : spec.freeApis;

  const containerCls = isLight
    ? "bg-slate-50 text-slate-900"
    : "bg-ink-900/55 text-zinc-100";
  const mutedCls = isLight ? "text-slate-500" : "text-zinc-400";
  const btnCls = isLight
    ? "bg-white text-slate-700 hover:bg-slate-100 shadow-xs"
    : "bg-ink-950/75 text-zinc-200 hover:bg-ink-850";

  return (
    <div className={`min-w-0 rounded-2xl p-5 sm:p-6 space-y-6 transition-colors ${containerCls}`}>
      {/* Institutional Header Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-2">
        <div className="min-w-0 space-y-1.5">
          {/* Unboxed typographic metadata (Zero-Pill Rule) */}
          <div className={`flex flex-wrap items-center gap-2 text-xs ${mutedCls}`}>
            <span>{spec.stack === "traditional" ? "Traditional Wall Street Stack" : "Digital Asset & Crypto Stack"}</span>
            <span aria-hidden="true">·</span>
            <span>Benchmark: {spec.equivalentPlatforms}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-emerald-500">{sources.join(" + ")}</span>
            {asOf && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums">
                  {asOf.slice(11, 19)} UTC
                </span>
              </>
            )}
          </div>
          <h2 className="text-xl md:text-2xl font-semibold tracking-tight">{spec.label}</h2>
          <p className={`text-xs max-w-3xl leading-relaxed ${mutedCls}`}>{spec.tagline}</p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {toolbarExtra}
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              aria-label="Refresh live API feed"
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${btnCls}`}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
              <span>{loading ? "Syncing..." : "Sync Live"}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowCompare((v) => !v)}
            aria-expanded={showCompare}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
              showCompare
                ? isLight
                  ? "bg-slate-900 text-white"
                  : "bg-zinc-100 text-zinc-950"
                : btnCls
            }`}
          >
            <GitCompare className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Compare Stacks</span>
          </button>
          <button
            type="button"
            onClick={() => setThemeMode((m) => (m === "dark" ? "light" : "dark"))}
            aria-label={`Switch to ${isLight ? "dark" : "light"} mode`}
            className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${btnCls}`}
          >
            {isLight ? <Moon className="h-3.5 w-3.5" aria-hidden="true" /> : <Sun className="h-3.5 w-3.5" aria-hidden="true" />}
            <span>{isLight ? "Dark" : "Light"}</span>
          </button>
        </div>
      </div>

      {/* Cross-Desk Switcher Strip (All 12 Platforms) */}
      <nav aria-label="Institutional Tools Switcher" className="flex min-w-0 w-full items-center gap-1.5 overflow-x-auto pb-1">
        {INSTITUTIONAL_TOOL_SPECS.map((item) => {
          const active = item.slug === slug;
          return (
            <Link
              key={item.slug}
              href={item.href}
              className={`rounded-xl px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                active
                  ? isLight
                    ? "bg-emerald-600 text-white"
                    : "bg-emerald-500/20 text-emerald-300"
                  : isLight
                    ? "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    : "bg-ink-950/75 text-zinc-400 hover:bg-ink-850 hover:text-zinc-100"
              }`}
            >
              {item.shortLabel}
            </Link>
          );
        })}
      </nav>

      {/* Collapsible Workflow Matrix */}
      {showCompare && <WorkflowMatrix activeSlug={slug} isLight={isLight} />}

      {/* Main Tool Workspace */}
      <div className="min-w-0">{children({ isLight })}</div>
    </div>
  );
}
