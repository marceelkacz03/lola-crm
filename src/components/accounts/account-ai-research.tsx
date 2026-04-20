"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { aiAngleLabel } from "@/lib/i18n-pl";
import type { AiAngle, AiResearch } from "@/lib/types";

type AccountAiResearchProps = {
  accountId: string;
  initialResearch: AiResearch | null;
  initialScore: number | null;
  initialAngle: string | null;
};

export const AccountAiResearch = ({
  accountId,
  initialResearch,
  initialScore,
  initialAngle
}: AccountAiResearchProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [research, setResearch] = useState<AiResearch | null>(initialResearch);
  const [score, setScore] = useState<number | null>(initialScore);
  const [angle, setAngle] = useState<string | null>(initialAngle);

  const handleResearch = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/ai/research/${accountId}`, { method: "POST" });
      const data = await res.json() as AiResearch & { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Nie udało się przeprowadzić badania.");
        return;
      }

      setResearch(data);
      setScore(data.score);
      setAngle(data.angle);
      router.refresh();
    } catch {
      setError("Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  const scoreColor =
    score === null ? "" : score >= 7 ? "border-green-600/40 text-green-400" : score >= 4 ? "border-yellow-600/40 text-yellow-400" : "border-red-600/40 text-red-400";

  return (
    <div className="mt-3 space-y-2 border-t border-line pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={handleResearch}
          disabled={loading}
          className="text-xs"
        >
          {loading ? "Analizuję..." : "✨ Research"}
        </Button>

        {score !== null ? (
          <span className={`rounded-full border bg-black/20 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide ${scoreColor}`}>
            Score {score}/10
          </span>
        ) : null}

        {angle ? (
          <Badge>{aiAngleLabel(angle as AiAngle)}</Badge>
        ) : null}

        {research?.needs_review ? (
          <span className="rounded-full border border-yellow-600/40 bg-yellow-900/20 px-2.5 py-0.5 text-xs text-yellow-400">
            Wymaga weryfikacji
          </span>
        ) : null}
      </div>

      {error ? <p className="text-xs text-red-500">{error}</p> : null}

      {research ? (
        <div className="rounded-lg border border-line bg-black/20 p-3 text-xs text-muted space-y-1">
          <p>{research.summary}</p>
          <p className="text-muted/70 italic">{research.why}</p>
        </div>
      ) : null}
    </div>
  );
};
