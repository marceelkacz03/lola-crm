"use client";

import { useEffect } from "react";

import { logger } from "@/lib/logger";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.error("Global UI error", { message: error.message, digest: error.digest });
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center p-6">
      <div className="max-w-md rounded-xl border border-line bg-panel/90 p-6 text-center shadow-card">
        <h2 className="font-[var(--font-heading)] text-3xl">Coś poszło nie tak</h2>
        <p className="mt-2 text-sm text-muted">Wystąpił nieoczekiwany błąd. Spróbuj ponownie.</p>
        <button onClick={reset} className="mt-4 rounded-md bg-accent px-4 py-2 text-sm font-medium text-[#fcf8f0]">
          Spróbuj ponownie
        </button>
      </div>
    </main>
  );
}
