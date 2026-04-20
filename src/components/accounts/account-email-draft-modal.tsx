"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";

type DraftData = {
  id: string;
  subject: string;
  body: string;
  alt_subjects: string[];
  needs_review?: boolean;
};

type AccountEmailDraftModalProps = {
  accountId: string;
  accountEmail: string | null;
  open: boolean;
  onClose: () => void;
  onSent?: (draftId: string) => void;
  /** Pre-loaded draft (for follow-up re-opens) */
  prefill?: DraftData;
};

export const AccountEmailDraftModal = ({
  accountId,
  accountEmail,
  open,
  onClose,
  onSent,
  prefill
}: AccountEmailDraftModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftData | null>(prefill ?? null);
  const [subject, setSubject] = useState(prefill?.subject ?? "");
  const [body, setBody] = useState(prefill?.body ?? "");
  const [language, setLanguage] = useState<"pl" | "en">("pl");
  const [sent, setSent] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setDraft(null);
    setSent(false);

    try {
      const res = await fetch("/api/ai/draft-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accountId, language })
      });
      const data = await res.json() as DraftData & { error?: string };

      if (!res.ok) {
        setError(data.error ?? "Nie udało się wygenerować draftu.");
        return;
      }

      setDraft(data);
      setSubject(data.subject);
      setBody(data.body);
    } catch {
      setError("Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!draft) return;

    const mailtoUrl = `mailto:${accountEmail ?? ""}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, "_blank");

    // Mark as sent in DB
    await fetch(`/api/ai/draft-email/${draft.id}`, { method: "PATCH" }).catch(() => null);
    setSent(true);
    onSent?.(draft.id);
  };

  const handleClose = () => {
    if (!prefill) {
      setDraft(null);
      setSubject("");
      setBody("");
      setSent(false);
      setError(null);
    }
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="✉ Draft email" className="max-w-2xl">
      <div className="space-y-4">
        {!draft ? (
          <>
            <p className="text-sm text-muted">
              Wybierz język i wygeneruj spersonalizowanego maila dla tego leada.
              {!accountEmail ? (
                <span className="ml-1 text-yellow-400"> Brak e-maila klienta — użyjesz opcji kopiuj/wklej.</span>
              ) : null}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={language === "pl" ? "primary" : "outline"}
                onClick={() => setLanguage("pl")}
                className="text-xs"
              >
                Polski
              </Button>
              <Button
                type="button"
                variant={language === "en" ? "primary" : "outline"}
                onClick={() => setLanguage("en")}
                className="text-xs"
              >
                English
              </Button>
            </div>
            <Button type="button" onClick={handleGenerate} disabled={loading}>
              {loading ? "Generuję..." : "Generuj draft"}
            </Button>
            {error ? <p className="text-sm text-red-500">{error}</p> : null}
          </>
        ) : (
          <>
            {draft.needs_review ? (
              <span className="rounded-full border border-yellow-600/40 bg-yellow-900/20 px-2.5 py-0.5 text-xs text-yellow-400">
                Wymaga weryfikacji
              </span>
            ) : null}

            {/* Subject */}
            <div>
              <label className="mb-1 block text-xs text-muted">Temat</label>
              <input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-md border border-line bg-black/20 px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none"
              />
            </div>

            {/* Alt subjects */}
            {draft.alt_subjects?.length ? (
              <div>
                <p className="mb-1 text-xs text-muted">Alternatywne tematy:</p>
                <div className="flex flex-wrap gap-1">
                  {draft.alt_subjects.map((alt) => (
                    <button
                      key={alt}
                      type="button"
                      onClick={() => setSubject(alt)}
                      className="rounded border border-line bg-black/20 px-2 py-0.5 text-xs text-muted transition-colors hover:border-accent hover:text-ink"
                    >
                      {alt}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Body */}
            <div>
              <label className="mb-1 block text-xs text-muted">Treść</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                className="w-full resize-y rounded-md border border-line bg-black/20 px-3 py-2 text-sm text-ink placeholder:text-muted/60 focus:border-accent focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-2 border-t border-line pt-3">
              {sent ? (
                <span className="text-sm text-green-400">✓ Oznaczono jako wysłany</span>
              ) : (
                <Button type="button" onClick={handleSend}>
                  {accountEmail ? "Otwórz w email" : "Kopiuj i otwórz email"}
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={() => { setDraft(null); setSent(false); }} className="text-xs">
                Wygeneruj nowy
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
