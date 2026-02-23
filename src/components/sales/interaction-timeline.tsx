"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input, Select, TextArea } from "@/components/ui/form";

type AccountOption = {
  id: string;
  name: string;
};

type TemplateOption = {
  id: string;
  title: string;
  content: string;
};

type TimelineRow = {
  id: string;
  account_id: string;
  account_name: string;
  type: string;
  note: string;
  next_followup_date: string | null;
  created_at: string;
};

type InteractionTimelineProps = {
  accounts: AccountOption[];
  templates: TemplateOption[];
  timeline: TimelineRow[];
  editable: boolean;
};

export const InteractionTimeline = ({ accounts, templates, timeline, editable }: InteractionTimelineProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [noteValue, setNoteValue] = useState<string>("");
  const [filterAccountId, setFilterAccountId] = useState<string>("");

  const filteredTimeline = useMemo(() => {
    if (!filterAccountId) return timeline;
    return timeline.filter((item) => item.account_id === filterAccountId);
  }, [filterAccountId, timeline]);

  const onTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const selected = templates.find((template) => template.id === templateId);
    if (selected) {
      setNoteValue(selected.content);
    }
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editable) return;

    setLoading(true);
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      account_id: String(form.get("account_id") || ""),
      type: String(form.get("type") || "note"),
      note: noteValue,
      next_followup_date: String(form.get("next_followup_date") || "")
    };

    const response = await fetch("/api/interactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setLoading(false);
    if (!response.ok) {
      setError("Nie udalo sie zapisac wpisu timeline.");
      return;
    }

    event.currentTarget.reset();
    setNoteValue("");
    setSelectedTemplateId("");
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {editable ? (
        <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <Select name="account_id" required>
            <option value="">Wybierz klienta</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
          <Select name="type" defaultValue="note">
            <option value="note">Notatka</option>
            <option value="call">Telefon</option>
            <option value="email">E-mail</option>
            <option value="meeting">Spotkanie</option>
          </Select>
          <Select value={selectedTemplateId} onChange={(event) => onTemplateChange(event.target.value)}>
            <option value="">Szablon (opcjonalnie)</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.title}
              </option>
            ))}
          </Select>
          <Input name="next_followup_date" type="date" />
          <TextArea
            name="note"
            value={noteValue}
            onChange={(event) => setNoteValue(event.target.value)}
            className="md:col-span-2"
            placeholder="Wpis do historii kontaktu..."
            required
          />
          {error ? <p className="text-sm text-red-700 md:col-span-2">{error}</p> : null}
          <Button type="submit" className="md:col-span-2" disabled={loading}>
            {loading ? "Zapisywanie..." : "Dodaj wpis do timeline"}
          </Button>
        </form>
      ) : null}

      <div className="max-w-xs">
        <Select value={filterAccountId} onChange={(event) => setFilterAccountId(event.target.value)}>
          <option value="">Filtr: wszyscy klienci</option>
          {accounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.name}
            </option>
          ))}
        </Select>
      </div>

      <ul className="space-y-2">
        {filteredTimeline.map((item) => (
          <li key={item.id} className="rounded-md border border-line bg-black/20 p-3">
            <p className="font-medium">{item.account_name}</p>
            <p className="text-xs text-muted">
              {item.type} | {new Date(item.created_at).toLocaleString("pl-PL")}
            </p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{item.note}</p>
            {item.next_followup_date ? (
              <p className="mt-1 text-xs text-muted">Nastepny follow-up: {item.next_followup_date}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
};
