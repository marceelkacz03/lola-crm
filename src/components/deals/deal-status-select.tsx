"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Select } from "@/components/ui/form";
import { dealStatusLabel } from "@/lib/i18n-pl";
import type { DealStatus } from "@/lib/types";

type DealStatusSelectProps = {
  dealId: string;
  value: DealStatus;
  editable: boolean;
};

const statuses: DealStatus[] = ["new_lead", "contacted", "offer_sent", "negotiation", "reserved", "lost"];

export const DealStatusSelect = ({ dealId, value, editable }: DealStatusSelectProps) => {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  const onStatusChange = async (status: DealStatus) => {
    if (!editable) return;
    setUpdating(true);
    await fetch(`/api/deals/${dealId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    setUpdating(false);
    router.refresh();
  };

  return (
    <Select value={value} disabled={!editable || updating} onChange={(event) => onStatusChange(event.target.value as DealStatus)}>
      {statuses.map((status) => (
        <option value={status} key={status}>
          {dealStatusLabel(status)}
        </option>
      ))}
    </Select>
  );
};
