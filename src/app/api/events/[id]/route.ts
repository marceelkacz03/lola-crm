import { NextResponse } from "next/server";

import { jsonError, requireApiRole, withApiError } from "@/lib/api";
import { upsertGoogleCalendarEvent } from "@/lib/google-calendar";
import { relationName } from "@/lib/supabase-relations";
import { eventPatchSchema } from "@/lib/validation";

export const PATCH = async (request: Request, { params }: { params: Promise<{ id: string }> }) =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "MANAGER"]);
    if (auth.error) return auth.error;

    const { id } = await params;
    const parsed = eventPatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid payload", 422);
    }

    const payload = {
      ...parsed.data
    };

    const { data: updatedEvent, error } = await auth.supabase
      .from("events")
      .update(payload)
      .eq("id", id)
      .select("id,deal_id,event_date,event_start_time,event_end_time,hall,status,google_calendar_event_id")
      .single();

    if (error || !updatedEvent) {
      return jsonError(error?.message ?? "Event not found", 400);
    }

    if (updatedEvent.status === "confirmed") {
      const { data: deal } = await auth.supabase
        .from("deals")
        .select("accounts(name)")
        .eq("id", updatedEvent.deal_id)
        .maybeSingle();

      const calendarEvent = await upsertGoogleCalendarEvent({
        existingEventId: updatedEvent.google_calendar_event_id,
        payload: {
          eventDate: updatedEvent.event_date,
          startTime: updatedEvent.event_start_time,
          endTime: updatedEvent.event_end_time,
          title: `Confirmed: ${relationName(deal?.accounts, "Event")}`,
          description: "Synced after CRM update",
          location: updatedEvent.hall
        }
      });

      await auth.supabase
        .from("events")
        .update({ google_calendar_event_id: calendarEvent.id })
        .eq("id", updatedEvent.id);
    }

    return NextResponse.json({ id: updatedEvent.id, ok: true });
  });
