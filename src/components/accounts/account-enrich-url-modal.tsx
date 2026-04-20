"use client";

import { useState } from "react";

import { AccountCreateForm } from "@/components/accounts/account-create-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { Modal } from "@/components/ui/modal";

type EnrichedValues = {
  name?: string;
  type?: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  source?: string;
  needs_review?: boolean;
};

type AccountEnrichUrlModalProps = {
  open: boolean;
  onClose: () => void;
};

export const AccountEnrichUrlModal = ({ open, onClose }: AccountEnrichUrlModalProps) => {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enriched, setEnriched] = useState<EnrichedValues | null>(null);

  const handleSearch = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setEnriched(null);

    try {
      const res = await fetch("/api/ai/enrich", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError((data as { error?: string }).error ?? "Nie udało się pobrać danych.");
        return;
      }

      const data = await res.json() as EnrichedValues;
      setEnriched(data);
    } catch {
      setError("Błąd połączenia. Spróbuj ponownie.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setUrl("");
    setEnriched(null);
    setError(null);
    onClose();
  };

  return (
    <Modal open={open} onClose={handleClose} title="Dodaj klienta z URL" className="max-w-2xl">
      {!enriched ? (
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Wklej link do profilu LinkedIn lub strony firmy. Claude wypełni formularz automatycznie.
          </p>
          <div className="flex gap-2">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://linkedin.com/in/... lub https://firma.pl"
              className="flex-1"
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button type="button" onClick={handleSearch} disabled={loading || !url.trim()}>
              {loading ? "Szukam..." : "Wyszukaj"}
            </Button>
          </div>
          {error ? <p className="text-sm text-red-500">{error}</p> : null}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted">
              Sprawdź dane i uzupełnij brakujące pola, a następnie kliknij Dodaj klienta.
            </p>
            {enriched.needs_review ? (
              <span className="rounded-full border border-yellow-600/40 bg-yellow-900/20 px-2.5 py-0.5 text-xs text-yellow-400">
                Wymaga weryfikacji
              </span>
            ) : null}
          </div>
          <AccountCreateForm
            key={JSON.stringify(enriched)}
            initialValues={enriched}
            onSuccess={handleClose}
          />
          <Button type="button" variant="ghost" onClick={() => setEnriched(null)} className="text-xs">
            ← Zmień URL
          </Button>
        </div>
      )}
    </Modal>
  );
};
