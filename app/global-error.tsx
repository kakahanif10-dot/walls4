"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#06070a] text-[#f2efe8] p-8 font-sans flex flex-col items-center justify-center">
        <div className="max-w-md w-full border border-red-500/30 bg-red-950/20 rounded-xl p-6 text-center">
          <h2 className="text-xl font-bold text-red-400 mb-2">Something went wrong</h2>
          <p className="text-sm text-gray-400 mb-6">{error?.message || "An unexpected error occurred."}</p>
          <button
            onClick={() => reset()}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-black font-semibold rounded-lg text-sm transition"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
