"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input, Select, TextArea } from "@/components/ui/form";

type TemplateRow = {
  id: string;
  title: string;
  type: string;
  content: string;
};

type TemplateManagerProps = {
  templates: TemplateRow[];
  editable: boolean;
};

export const TemplateManager = ({ templates, editable }: TemplateManagerProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editable) return;
    setLoading(true);
    setError(null);
    const formEl = event.currentTarget;

    const form = new FormData(formEl);
    const payload = {
      title: String(form.get("title") || ""),
      type: String(form.get("type") || "other"),
      content: String(form.get("content") || "")
    };

    const response = await fetch("/api/templates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setLoading(false);
    if (!response.ok) {
      setError("Nie udalo sie zapisac szablonu.");
      return;
    }

    formEl.reset();
    router.refresh();
  };

  return (
    <div className="space-y-4">
      {editable ? (
        <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
          <Input name="title" placeholder="Nazwa szablonu" required />
          <Select name="type" defaultValue="other">
            <option value="first_contact">Pierwszy kontakt</option>
            <option value="followup">Follow-up</option>
            <option value="offer">Oferta</option>
            <option value="other">Inne</option>
          </Select>
          <TextArea name="content" className="md:col-span-2" placeholder="Tresci szablonu..." required />
          {error ? <p className="text-sm text-red-700 md:col-span-2">{error}</p> : null}
          <Button type="submit" className="md:col-span-2" disabled={loading}>
            {loading ? "Zapisywanie..." : "Dodaj szablon"}
          </Button>
        </form>
      ) : null}

      <ul className="space-y-2">
        {templates.map((template) => (
          <li key={template.id} className="rounded-md border border-line bg-black/20">
            <details className="group">
              <summary className="cursor-pointer list-none px-3 py-3 font-medium">
                <div className="flex items-center justify-between gap-3">
                  <span>{template.title}</span>
                  <span className="text-xs text-muted group-open:hidden">Rozwin</span>
                </div>
              </summary>
              <div className="border-t border-line px-3 py-3">
                <p className="text-xs text-muted">Typ: {template.type}</p>
                <p className="mt-2 whitespace-pre-wrap text-sm text-muted">{template.content}</p>
              </div>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
};
