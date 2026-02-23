import { NextResponse } from "next/server";

import { jsonError, requireApiRole, withApiError } from "@/lib/api";
import { upsertGoogleCalendarEvent } from "@/lib/google-calendar";
import { relationName } from "@/lib/supabase-relations";
import { dealPatchSchema } from "@/lib/validation";

export const PATCH = async (request: Request, { params }: { params: Promise<{ id: string }> }) =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "MANAGER"]);
    if (auth.error) return auth.error;

    const { id } = await params;
    const parsed = dealPatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid payload", 422);
    }

    const payload = {
      ...parsed.data,
      next_followup_date: parsed.data.next_followup_date || null
    };

    const { data: updatedDeal, error: dealError } = await auth.supabase
      .from("deals")
      .update(payload)
      .eq("id", id)
      .select("id,event_date,estimated_value,estimated_guests,status,accounts(name)")
      .single();

    if (dealError || !updatedDeal) {
      return jsonError(dealError?.message ?? "Deal not found", 400);
    }

    if (payload.status === "reserved") {
      const { data: existingEvent } = await auth.supabase
        .from("events")
        .select("id,google_calendar_event_id")
        .eq("deal_id", id)
        .maybeSingle();

      const title = `Reserved: ${relationName(updatedDeal.accounts, "Premium Event")}`;
      const calendarEvent = await upsertGoogleCalendarEvent({
        existingEventId: existingEvent?.google_calendar_event_id ?? null,
        payload: {
          eventDate: updatedDeal.event_date ?? new Date().toISOString().slice(0, 10),
          title,
          description: "Auto-created from CRM reserved deal.",
          location: "Premium Venue"
        }
      });

      if (existingEvent?.id) {
        await auth.supabase
          .from("events")
          .update({
            event_date: updatedDeal.event_date ?? new Date().toISOString().slice(0, 10),
            final_value: Number(updatedDeal.estimated_value || 0),
            number_of_guests: Number(updatedDeal.estimated_guests || 1),
            status: "planned",
            google_calendar_event_id: calendarEvent.id
          })
          .eq("id", existingEvent.id);
      } else {
        await auth.supabase.from("events").insert({
          deal_id: id,
          event_date: updatedDeal.event_date ?? new Date().toISOString().slice(0, 10),
          final_value: Number(updatedDeal.estimated_value || 0),
          number_of_guests: Number(updatedDeal.estimated_guests || 1),
          hall: "TBD",
          operational_notes: "Auto-created from reserved deal",
          status: "planned",
          google_calendar_event_id: calendarEvent.id
        });
      }
    }

    return NextResponse.json({ id, ok: true });
  });
