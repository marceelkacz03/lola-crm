import { NextResponse } from "next/server";

import { jsonError, requireApiRole, withApiError } from "@/lib/api";
import { upsertGoogleCalendarEvent } from "@/lib/google-calendar";
import { relationName } from "@/lib/supabase-relations";
import { eventSchema } from "@/lib/validation";

export const GET = async () =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "BOARD", "MANAGER", "STAFF"]);
    if (auth.error) return auth.error;

    let query = auth.supabase
      .from("events")
      .select("id,deal_id,event_date,event_start_time,event_end_time,final_value,number_of_guests,hall,operational_notes,status,google_calendar_event_id,created_at")
      .order("event_date", { ascending: true });

    if (auth.role === "STAFF") {
      query = query.eq("status", "confirmed");
    }

    const { data, error } = await query;
    if (error) {
      return jsonError(error.message, 400);
    }

    return NextResponse.json(data);
  });

export const POST = async (request: Request) =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "MANAGER"]);
    if (auth.error) return auth.error;

    const parsed = eventSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid payload", 422);
    }

    const payload = {
      ...parsed.data,
      event_start_time: parsed.data.event_start_time || null,
      event_end_time: parsed.data.event_end_time || null,
      operational_notes: parsed.data.operational_notes || null
    };

    const { data: createdEvent, error: createError } = await auth.supabase
      .from("events")
      .insert(payload)
      .select("id,deal_id,event_date,event_start_time,event_end_time,hall,status,google_calendar_event_id")
      .single();

    if (createError || !createdEvent) {
      return jsonError(createError?.message ?? "Cannot create event", 400);
    }

    if (createdEvent.status === "confirmed") {
      const { data: deal } = await auth.supabase
        .from("deals")
        .select("accounts(name)")
        .eq("id", createdEvent.deal_id)
        .maybeSingle();

      const calendarEvent = await upsertGoogleCalendarEvent({
        existingEventId: createdEvent.google_calendar_event_id,
        payload: {
          eventDate: createdEvent.event_date,
          startTime: createdEvent.event_start_time,
          endTime: createdEvent.event_end_time,
          title: `Confirmed: ${relationName(deal?.accounts, "Event")}`,
          description: "Confirmed event synced from CRM",
          location: createdEvent.hall
        }
      });

      await auth.supabase
        .from("events")
        .update({ google_calendar_event_id: calendarEvent.id })
        .eq("id", createdEvent.id);
    }

    return NextResponse.json({ id: createdEvent.id }, { status: 201 });
  });
