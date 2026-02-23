"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input, Select, TextArea } from "@/components/ui/form";
import { dealStatusLabel } from "@/lib/i18n-pl";

type DealCreateFormProps = {
  accounts: { id: string; name: string }[];
};

export const DealCreateForm = ({ accounts }: DealCreateFormProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      account_id: form.get("account_id"),
      event_type: form.get("event_type"),
      estimated_value: Number(form.get("estimated_value")),
      estimated_guests: Number(form.get("estimated_guests") || 0),
      event_date: String(form.get("event_date") || ""),
      status: form.get("status"),
      probability: Number(form.get("probability")),
      owner_id: String(form.get("owner_id") || ""),
      next_followup_date: String(form.get("next_followup_date") || ""),
      notes: String(form.get("notes") || "")
    };

    const response = await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setLoading(false);
    if (!response.ok) {
      setError("Nie udało się utworzyć leada");
      return;
    }

    event.currentTarget.reset();
    router.refresh();
  };

  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
      <Select name="account_id" required>
        <option value="">Wybierz konto</option>
        {accounts.map((account) => (
          <option value={account.id} key={account.id}>
            {account.name}
          </option>
        ))}
      </Select>
      <Select name="event_type" defaultValue="corporate">
        <option value="corporate">Firmowe</option>
        <option value="wedding">Wesele</option>
        <option value="private">Prywatne</option>
        <option value="other">Inne</option>
      </Select>
      <Input name="estimated_value" type="number" min={0} placeholder="Szacowana wartość" required />
      <Input name="estimated_guests" type="number" min={0} placeholder="Szacowana liczba gości" />
      <Input name="event_date" type="date" />
      <Select name="status" defaultValue="new_lead">
        <option value="new_lead">{dealStatusLabel("new_lead")}</option>
        <option value="contacted">{dealStatusLabel("contacted")}</option>
        <option value="offer_sent">{dealStatusLabel("offer_sent")}</option>
        <option value="negotiation">{dealStatusLabel("negotiation")}</option>
        <option value="reserved">{dealStatusLabel("reserved")}</option>
        <option value="lost">{dealStatusLabel("lost")}</option>
      </Select>
      <Input name="probability" type="number" min={0} max={100} placeholder="Prawdopodobieństwo %" required />
      <Input name="owner_id" placeholder="Identyfikator opiekuna (UUID)" required />
      <Input name="next_followup_date" type="date" />
      <TextArea name="notes" placeholder="Notatki sprzedażowe" className="md:col-span-2" />
      {error ? <p className="text-sm text-red-700 md:col-span-2">{error}</p> : null}
      <Button type="submit" className="md:col-span-2" disabled={loading}>
        {loading ? "Zapisywanie..." : "Utwórz lead"}
      </Button>
    </form>
  );
};
