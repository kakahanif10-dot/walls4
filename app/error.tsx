"use client";

import React, { useEffect } from "react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md w-full border border-red-500/30 bg-red-950/20 rounded-xl p-6">
        <h2 className="text-xl font-bold text-red-400 mb-2">Something went wrong</h2>
        <p className="text-sm text-gray-400 mb-6">{error?.message || "An unexpected error occurred."}</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg text-sm transition"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
