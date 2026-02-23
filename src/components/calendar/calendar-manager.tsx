"use client";

import { FormEvent, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input, Select, TextArea } from "@/components/ui/form";
import type { AppRole } from "@/lib/types";

type CalendarEventRow = {
  id: string | null;
  title: string;
  description: string | null;
  location: string | null;
  start: string;
  end: string;
};

type CalendarManagerProps = {
  role: AppRole;
};

const formatDateTime = (value: string) => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pl-PL");
};

export const CalendarManager = ({ role }: CalendarManagerProps) => {
  const canCreate = role === "ADMIN" || role === "MANAGER";
  const [events, setEvents] = useState<CalendarEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEvents = async () => {
    setLoading(true);
    setError(null);
    const response = await fetch("/api/calendar/events", { cache: "no-store" });

    if (!response.ok) {
      setLoading(false);
      setError("Nie udalo sie pobrac wydarzen z kalendarza Google.");
      return;
    }

    const data = (await response.json()) as CalendarEventRow[];
    setEvents(data);
    setLoading(false);
  };

  useEffect(() => {
    void loadEvents();
  }, []);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreate) return;

    setSaving(true);
    setError(null);
    const formEl = event.currentTarget;

    const form = new FormData(formEl);
    const payload = {
      title: String(form.get("title") || ""),
      eventDate: String(form.get("eventDate") || ""),
      startTime: form.get("startTime") ? String(form.get("startTime")) : undefined,
      endTime: form.get("endTime") ? String(form.get("endTime")) : undefined,
      eventType: String(form.get("eventType") || ""),
      guests: form.get("guests") ? Number(form.get("guests")) : undefined,
      budget: form.get("budget") ? Number(form.get("budget")) : undefined,
      location: form.get("location") ? String(form.get("location")) : undefined,
      description: form.get("description") ? String(form.get("description")) : undefined
    };

    const response = await fetch("/api/calendar/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setSaving(false);
    if (!response.ok) {
      setError("Nie udalo sie dodac wydarzenia do kalendarza.");
      return;
    }

    formEl.reset();
    await loadEvents();
  };

  return (
    <div className="space-y-5">
      {canCreate ? (
        <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <Input name="title" placeholder="Tytul wydarzenia" required />
          <Input name="eventDate" type="date" required />
          <Input name="startTime" type="time" />
          <Input name="endTime" type="time" />
          <Select name="eventType" defaultValue="other">
            <option value="corporate">Firmowe</option>
            <option value="wedding">Wesele</option>
            <option value="private">Prywatne</option>
            <option value="other">Inne</option>
          </Select>
          <Input name="guests" type="number" min={1} placeholder="Liczba gosci" />
          <Input name="budget" type="number" min={0} placeholder="Budzet (PLN)" />
          <Input name="location" placeholder="Miejsce" />
          <TextArea name="description" placeholder="Opis (opcjonalnie)" className="md:col-span-2" />
          <Button type="submit" className="md:col-span-2" disabled={saving}>
            {saving ? "Zapisywanie..." : "Dodaj do kalendarza"}
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted">Ta rola ma tylko podglad kalendarza.</p>
      )}

      {error ? <p className="text-sm text-red-700">{error}</p> : null}

      <div className="space-y-2">
        <h3 className="font-medium">Nadchodzace wydarzenia</h3>
        {loading ? <p className="text-sm text-muted">Ladowanie...</p> : null}
        {!loading && !events.length ? <p className="text-sm text-muted">Brak wydarzen w kalendarzu.</p> : null}
        <ul className="space-y-2">
          {events.map((item) => (
            <li key={item.id ?? `${item.title}-${item.start}`} className="rounded-md border border-line bg-black/20 p-3 text-sm">
              <p className="font-medium">{item.title}</p>
              <p className="text-xs text-muted">
                {formatDateTime(item.start)} - {formatDateTime(item.end)}
              </p>
              {item.location ? <p className="text-xs text-muted">Miejsce: {item.location}</p> : null}
              {item.description ? <p className="mt-1 text-xs text-muted">{item.description}</p> : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
