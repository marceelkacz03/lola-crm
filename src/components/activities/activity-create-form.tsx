"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input, Select, TextArea } from "@/components/ui/form";
import { activityTypeLabel } from "@/lib/i18n-pl";

type ActivityCreateFormProps = {
  deals: { id: string; account_name: string }[];
};

export const ActivityCreateForm = ({ deals }: ActivityCreateFormProps) => {
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
      type: form.get("type"),
      description: form.get("description"),
      next_step: form.get("next_step"),
      next_followup_date: form.get("next_followup_date")
    };

    const response = await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    setLoading(false);
    if (!response.ok) {
      setError("Nie udało się utworzyć aktywności");
      return;
    }

    event.currentTarget.reset();
    router.refresh();
  };

  return (
    <form className="grid gap-3 md:grid-cols-2" onSubmit={onSubmit}>
      <Select name="deal_id" required>
        <option value="">Wybierz lead</option>
        {deals.map((deal) => (
          <option key={deal.id} value={deal.id}>
            {deal.account_name}
          </option>
        ))}
      </Select>
      <Select name="type" defaultValue="call">
        <option value="call">{activityTypeLabel("call")}</option>
        <option value="email">{activityTypeLabel("email")}</option>
        <option value="meeting">{activityTypeLabel("meeting")}</option>
        <option value="other">{activityTypeLabel("other")}</option>
      </Select>
      <TextArea name="description" placeholder="Opis" className="md:col-span-2" required />
      <Input name="next_step" placeholder="Następny krok" />
      <Input name="next_followup_date" type="date" />
      {error ? <p className="text-sm text-red-700 md:col-span-2">{error}</p> : null}
      <Button type="submit" className="md:col-span-2" disabled={loading}>
        {loading ? "Zapisywanie..." : "Utwórz aktywność"}
      </Button>
    </form>
  );
};
