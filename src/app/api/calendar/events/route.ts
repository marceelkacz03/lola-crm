import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonError, requireApiRole, withApiError } from "@/lib/api";
import { createGoogleCalendarEvent, listGoogleCalendarEvents } from "@/lib/google-calendar";

const calendarEventSchema = z.object({
  title: z.string().min(2),
  eventDate: z.string().min(10),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  eventType: z.enum(["corporate", "wedding", "private", "other"]).optional(),
  guests: z.number().int().min(1).optional(),
  budget: z.number().min(0).optional(),
  location: z.string().optional(),
  description: z.string().optional()
});

export const GET = async () =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "BOARD", "MANAGER", "STAFF"]);
    if (auth.error) return auth.error;

    const events = await listGoogleCalendarEvents();
    return NextResponse.json(events);
  });

export const POST = async (request: Request) =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "MANAGER"]);
    if (auth.error) return auth.error;

    const parsed = calendarEventSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid payload", 422);
    }

    const descriptionChunks = [
      parsed.data.eventType ? `Typ wydarzenia: ${parsed.data.eventType}` : null,
      parsed.data.guests ? `Liczba gosci: ${parsed.data.guests}` : null,
      parsed.data.budget ? `Budzet: ${parsed.data.budget} PLN` : null,
      parsed.data.description ? `Opis: ${parsed.data.description}` : null
    ].filter(Boolean);

    const result = await createGoogleCalendarEvent({
      title: parsed.data.title,
      eventDate: parsed.data.eventDate,
      startTime: parsed.data.startTime,
      endTime: parsed.data.endTime,
      location: parsed.data.location,
      description: descriptionChunks.join("\n")
    });
    return NextResponse.json(result, { status: 201 });
  });
