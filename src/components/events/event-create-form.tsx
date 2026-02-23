"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input, Select, TextArea } from "@/components/ui/form";
import { eventStatusLabel } from "@/lib/i18n-pl";

type EventCreateFormProps = {
  deals: { id: string; account_name: string }[];
};

export const EventCreateForm = ({ deals }: EventCreateFormProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      deal_id: form.get("deal_id"),
      event_date: form.get("event_date"),
      event_start_time: form.get("event_start_time"),
      event_end_time: form.get("event_end_time"),
      final_value: Number(form.get("final_value")),
      number_of_guests: Number(form.get("number_of_guests")),
      hall: form.get("hall"),
      operational_notes: form.get("operational_notes"),
      status: form.get("status")
    };

    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setLoading(false);
    if (!response.ok) {
      setError("Nie udało się utworzyć wydarzenia");
      return;
    }

    event.currentTarget.reset();
    router.refresh();
  };

  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
      <Select name="deal_id" required>
        <option value="">Wybierz zarezerwowany lead</option>
        {deals.map((deal) => (
          <option key={deal.id} value={deal.id}>
            {deal.account_name} ({deal.id.slice(0, 6)})
          </option>
        ))}
      </Select>
      <Input name="event_date" type="date" required />
      <Input name="event_start_time" type="time" />
      <Input name="event_end_time" type="time" />
      <Input name="final_value" type="number" min={0} placeholder="Wartość końcowa" required />
      <Input name="number_of_guests" type="number" min={0} placeholder="Liczba gości" required />
      <Input name="hall" placeholder="Sala / przestrzeń" required />
      <Select name="status" defaultValue="planned">
        <option value="planned">{eventStatusLabel("planned")}</option>
        <option value="confirmed">{eventStatusLabel("confirmed")}</option>
        <option value="completed">{eventStatusLabel("completed")}</option>
      </Select>
      <TextArea name="operational_notes" placeholder="Notatki operacyjne" className="md:col-span-2" />
      {error ? <p className="text-sm text-red-700 md:col-span-2">{error}</p> : null}
      <Button type="submit" className="md:col-span-2" disabled={loading}>
        {loading ? "Zapisywanie..." : "Utwórz wydarzenie"}
      </Button>
    </form>
  );
};
