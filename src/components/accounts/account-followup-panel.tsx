"use client";

import { useEffect, useState } from "react";

import { AccountEmailDraftModal } from "@/components/accounts/account-email-draft-modal";
import { Button } from "@/components/ui/button";
import { aiDraftStatusLabel, aiDraftTypeLabel } from "@/lib/i18n-pl";
import type { AiDraftStatus, AiDraftType, AiEmailDraft } from "@/lib/types";

type FollowupRow = Pick<AiEmailDraft, "id" | "draft_type" | "subject" | "body" | "status" | "scheduled_for" | "sent_at">;

type AccountFollowupPanelProps = {
  accountId: string;
  accountEmail: string | null;
  /** Fires when a first-email is marked sent, triggering follow-up generation */
  firstEmailSentId?: string | null;
  language?: "pl" | "en";
};

const isOverdue = (scheduledFor: string | null): boolean => {
  if (!scheduledFor) return false;
  return new Date(scheduledFor).getTime() <= Date.now();
};

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pl-PL", { day: "numeric", month: "short", year: "numeric" });
};

export const AccountFollowupPanel = ({
  accountId,
  accountEmail,
  firstEmailSentId,
  language = "pl"
}: AccountFollowupPanelProps) => {
  const [followups, setFollowups] = useState<FollowupRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDraft, setOpenDraft] = useState<FollowupRow | null>(null);

  const loadFollowups = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/ai/followups?accountId=${accountId}`);
      if (res.ok) {
        const data = await res.json() as FollowupRow[];
        setFollowups(data);
      }
    } finally {
      setLoading(false);
    }
  };

  const generateFollowups = async (firstEmailId: string) => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/ai/followups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, firstEmailId, language })
      });
      if (res.ok) {
        const data = await res.json() as FollowupRow[];
        setFollowups(data);
      } else {
        const d = await res.json().catch(() => ({})) as { error?: string };
        setError(d.error ?? "Nie udało się wygenerować follow-upów.");
      }
    } catch {
      setError("Błąd połączenia.");
    } finally {
      setGenerating(false);
    }
  };

  // Load existing followups on mount
  useEffect(() => {
    loadFollowups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  // Auto-generate when first email is sent
  useEffect(() => {
    if (firstEmailSentId && followups.length === 0 && !generating) {
      generateFollowups(firstEmailSentId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [firstEmailSentId]);

  const handleDraftSent = (sentId: string) => {
    setFollowups((prev) =>
      prev.map((f) => (f.id === sentId ? { ...f, status: "sent" as AiDraftStatus } : f))
    );
    setOpenDraft(null);
  };

  if (loading) {
    return <p className="mt-3 text-xs text-muted">Ładowanie follow-upów...</p>;
  }

  return (
    <div className="mt-3 border-t border-line pt-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">🔔 Follow-upy</p>
        {followups.length === 0 && !generating ? (
          <Button
            type="button"
            variant="ghost"
            className="text-xs"
            onClick={() => {
              if (firstEmailSentId) generateFollowups(firstEmailSentId);
            }}
            disabled={!firstEmailSentId}
            title={!firstEmailSentId ? "Najpierw wyślij pierwszego maila" : undefined}
          >
            {generating ? "Generuję..." : "+ Generuj"}
          </Button>
        ) : null}
      </div>

      {generating ? <p className="text-xs text-muted">Claude generuje sekwencję follow-upów...</p> : null}
      {error ? <p className="text-xs text-red-500">{error}</p> : null}

      {followups.length === 0 && !generating ? (
        <p className="text-xs text-muted">
          {firstEmailSentId
            ? "Kliknij &quot;+ Generuj&quot; aby stworzyć 3 follow-upy."
            : "Wyślij pierwszego maila, aby automatycznie wygenerować follow-upy."}
        </p>
      ) : null}

      <ul className="space-y-2">
        {followups.map((f) => {
          const overdue = isOverdue(f.scheduled_for) && f.status === "draft";
          return (
            <li
              key={f.id}
              className={`rounded-lg border px-3 py-2 text-xs ${
                overdue
                  ? "border-accent bg-accent/10"
                  : "border-line bg-black/20"
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-medium">{aiDraftTypeLabel(f.draft_type as AiDraftType)}</span>
                  <span className="ml-2 text-muted">· {formatDate(f.scheduled_for)}</span>
                  {overdue ? <span className="ml-2 text-accent">Dziś!</span> : null}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${f.status === "sent" ? "border-green-600/40 text-green-400" : "border-line text-muted"}`}>
                    {aiDraftStatusLabel(f.status as AiDraftStatus)}
                  </span>
                  {f.status !== "sent" ? (
                    <Button
                      type="button"
                      variant="outline"
                      className="text-xs py-0.5 px-2"
                      onClick={() => setOpenDraft(f)}
                    >
                      Wyślij
                    </Button>
                  ) : null}
                </div>
              </div>
              <p className="mt-1 truncate text-muted/80">{f.subject}</p>
            </li>
          );
        })}
      </ul>

      {openDraft ? (
        <AccountEmailDraftModal
          accountId={accountId}
          accountEmail={accountEmail}
          open={true}
          onClose={() => setOpenDraft(null)}
          onSent={handleDraftSent}
          prefill={{
            id: openDraft.id,
            subject: openDraft.subject,
            body: openDraft.body,
            alt_subjects: [],
            needs_review: false
          }}
        />
      ) : null}
    </div>
  );
};
