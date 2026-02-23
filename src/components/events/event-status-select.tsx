"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Select } from "@/components/ui/form";
import { eventStatusLabel } from "@/lib/i18n-pl";
import type { EventStatus } from "@/lib/types";

type EventStatusSelectProps = {
  eventId: string;
  value: EventStatus;
  editable: boolean;
};

const statuses: EventStatus[] = ["planned", "confirmed", "completed"];

export const EventStatusSelect = ({ eventId, value, editable }: EventStatusSelectProps) => {
  const router = useRouter();
  const [updating, setUpdating] = useState(false);

  const onStatusChange = async (status: EventStatus) => {
    if (!editable) return;
    setUpdating(true);
    await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status })
    });
    setUpdating(false);
    router.refresh();
  };

  return (
    <Select value={value} disabled={!editable || updating} onChange={(event) => onStatusChange(event.target.value as EventStatus)}>
      {statuses.map((status) => (
        <option value={status} key={status}>
          {eventStatusLabel(status)}
        </option>
      ))}
    </Select>
  );
};
