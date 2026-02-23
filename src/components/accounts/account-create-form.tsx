"use client";

import { FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { salesStatusLabel } from "@/lib/i18n-pl";

export const AccountCreateForm = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitLockRef = useRef(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submitLockRef.current) return;
    submitLockRef.current = true;
    setLoading(true);
    setError(null);
    const formEl = event.currentTarget;

    const form = new FormData(formEl);
    const payload = {
      name: String(form.get("name")),
      type: String(form.get("type")),
      contact_person: String(form.get("contact_person") || ""),
      email: String(form.get("email") || ""),
      phone: String(form.get("phone") || ""),
      source: String(form.get("source")),
      sales_status: String(form.get("sales_status") || "new"),
      estimated_value: form.get("estimated_value") ? Number(form.get("estimated_value")) : undefined,
      next_followup_date: String(form.get("next_followup_date") || "")
    };

    try {
      const response = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      setLoading(false);
      if (!response.ok) {
        setError("Nie udalo sie dodac klienta.");
        return;
      }

      formEl.reset();
      router.refresh();
    } finally {
      submitLockRef.current = false;
      setLoading(false);
    }
  };

  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
      <Input name="name" placeholder="Nazwa klienta" required />
      <Select name="type" defaultValue="company">
        <option value="company">Firma</option>
        <option value="private">Osoba prywatna</option>
        <option value="wedding_planner">Konsultant slubny</option>
      </Select>
      <Input name="contact_person" placeholder="Osoba kontaktowa" />
      <Input name="email" placeholder="E-mail" type="email" />
      <Input name="phone" placeholder="Telefon" />
      <Select name="source" defaultValue="networking">
        <option value="internal_base">Baza wewnetrzna</option>
        <option value="own_portfolio">Wlasne portfolio</option>
        <option value="planner">Konsultant slubny</option>
        <option value="networking">Siec kontaktow</option>
        <option value="other">Inne</option>
      </Select>
      <Select name="sales_status" defaultValue="new">
        <option value="new">{salesStatusLabel("new")}</option>
        <option value="contacted">{salesStatusLabel("contacted")}</option>
        <option value="offer_sent">{salesStatusLabel("offer_sent")}</option>
        <option value="negotiation">{salesStatusLabel("negotiation")}</option>
        <option value="won">{salesStatusLabel("won")}</option>
        <option value="lost">{salesStatusLabel("lost")}</option>
      </Select>
      <Input name="estimated_value" type="number" min={0} placeholder="Wartosc szacowana (PLN)" />
      <Input name="next_followup_date" type="date" />
      {error ? <p className="text-sm text-red-700 md:col-span-2">{error}</p> : null}
      <Button className="md:col-span-2" type="submit" disabled={loading}>
        {loading ? "Zapisywanie..." : "Dodaj klienta"}
      </Button>
    </form>
  );
};
