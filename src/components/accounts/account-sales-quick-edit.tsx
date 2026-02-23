"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/form";
import { salesStatusLabel } from "@/lib/i18n-pl";
import type { SalesStatus } from "@/lib/types";

type AccountSalesQuickEditProps = {
  accountId: string;
  status: SalesStatus;
  estimatedValue: number | null;
  nextFollowupDate: string | null;
  editable: boolean;
};

export const AccountSalesQuickEdit = ({
  accountId,
  status,
  estimatedValue,
  nextFollowupDate,
  editable
}: AccountSalesQuickEditProps) => {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [salesStatus, setSalesStatus] = useState<SalesStatus>(status);
  const [value, setValue] = useState<string>(estimatedValue ? String(estimatedValue) : "");
  const [followup, setFollowup] = useState<string>(nextFollowupDate ?? "");

  const onSave = async () => {
    if (!editable) return;
    setSaving(true);

    await fetch(`/api/accounts/${accountId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sales_status: salesStatus,
        estimated_value: value ? Number(value) : null,
        next_followup_date: followup || null
      })
    });

    setSaving(false);
    router.refresh();
  };

  return (
    <div className="grid gap-2 md:grid-cols-4">
      <Select value={salesStatus} onChange={(event) => setSalesStatus(event.target.value as SalesStatus)} disabled={!editable || saving}>
        <option value="new">{salesStatusLabel("new")}</option>
        <option value="contacted">{salesStatusLabel("contacted")}</option>
        <option value="offer_sent">{salesStatusLabel("offer_sent")}</option>
        <option value="negotiation">{salesStatusLabel("negotiation")}</option>
        <option value="won">{salesStatusLabel("won")}</option>
        <option value="lost">{salesStatusLabel("lost")}</option>
      </Select>
      <Input
        value={value}
        type="number"
        min={0}
        placeholder="Wartosc"
        onChange={(event) => setValue(event.target.value)}
        disabled={!editable || saving}
      />
      <Input value={followup} type="date" onChange={(event) => setFollowup(event.target.value)} disabled={!editable || saving} />
      <Button type="button" onClick={onSave} disabled={!editable || saving}>
        {saving ? "Zapisywanie..." : "Zapisz"}
      </Button>
    </div>
  );
};
