import { NextResponse } from "next/server";

import { jsonError, requireApiRole, withApiError } from "@/lib/api";
import { upsertGoogleCalendarEvent } from "@/lib/google-calendar";
import { dealSchema } from "@/lib/validation";

export const GET = async () =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "BOARD", "MANAGER"]);
    if (auth.error) return auth.error;

    const { data, error } = await auth.supabase
      .from("deals")
      .select("id,account_id,event_type,estimated_value,estimated_guests,event_date,status,probability,owner_id,next_followup_date,notes,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError(error.message, 400);
    }

    return NextResponse.json(data);
  });

export const POST = async (request: Request) =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "MANAGER"]);
    if (auth.error) return auth.error;

    const parsed = dealSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid payload", 422);
    }

    const payload = {
      ...parsed.data,
      estimated_guests: parsed.data.estimated_guests ?? null,
      event_date: parsed.data.event_date || null,
      next_followup_date: parsed.data.next_followup_date || null,
      notes: parsed.data.notes || null
    };

    const { data, error } = await auth.supabase
      .from("deals")
      .insert(payload)
      .select("id,account_id,event_date,estimated_value,estimated_guests,status")
      .single();
    if (error) {
      return jsonError(error.message, 400);
    }

    if (data.status === "reserved") {
      const { data: account } = await auth.supabase
        .from("accounts")
        .select("name")
        .eq("id", data.account_id)
        .maybeSingle();

      const calendarEvent = await upsertGoogleCalendarEvent({
        payload: {
          eventDate: data.event_date ?? new Date().toISOString().slice(0, 10),
          title: `Reserved: ${account?.name ?? "Premium Event"}`,
          description: "Auto-created from CRM reserved deal.",
          location: "Premium Venue"
        }
      });

      await auth.supabase.from("events").upsert(
        {
          deal_id: data.id,
          event_date: data.event_date ?? new Date().toISOString().slice(0, 10),
          final_value: Number(data.estimated_value || 0),
          number_of_guests: Number(data.estimated_guests || 1),
          hall: "TBD",
          operational_notes: "Auto-created from reserved deal",
          status: "planned",
          google_calendar_event_id: calendarEvent.id
        },
        { onConflict: "deal_id" }
      );
    }

    return NextResponse.json(data, { status: 201 });
  });
