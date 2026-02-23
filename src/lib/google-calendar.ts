import { google } from "googleapis";

import { logger } from "@/lib/logger";

type CalendarPayload = {
  eventDate: string;
  startTime?: string | null;
  endTime?: string | null;
  title: string;
  description?: string;
  location?: string;
};

type GoogleCalendarEvent = {
  id: string | null;
  title: string;
  description: string | null;
  location: string | null;
  start: string;
  end: string;
};

const resolveCalendarAuth = () => {
  const clientEmail = process.env.GOOGLE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey) {
    return null;
  }

  return new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/calendar"],
    subject: process.env.GOOGLE_IMPERSONATED_USER
  });
};

const toDateTime = (eventDate: string, time: string | null | undefined, fallback: string) => {
  const normalizedTime = typeof time === "string" && time.trim().length > 0 ? time.trim() : fallback;
  return `${eventDate}T${normalizedTime}:00`;
};

const resolveCalendarClient = () => {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  const auth = resolveCalendarAuth();

  if (!calendarId || !auth) {
    return null;
  }

  return {
    calendarId,
    calendar: google.calendar({ version: "v3", auth })
  };
};

export const listGoogleCalendarEvents = async (params?: {
  fromDate?: string;
  toDate?: string;
  maxResults?: number;
}): Promise<GoogleCalendarEvent[]> => {
  const client = resolveCalendarClient();
  if (!client) {
    throw new Error("Google Calendar config missing");
  }

  const fromDate = params?.fromDate ?? new Date().toISOString().slice(0, 10);
  const toDate = params?.toDate ?? new Date(Date.now() + 1000 * 60 * 60 * 24 * 90).toISOString().slice(0, 10);
  const maxResults = params?.maxResults ?? 100;

  const response = await client.calendar.events.list({
    calendarId: client.calendarId,
    timeMin: `${fromDate}T00:00:00+01:00`,
    timeMax: `${toDate}T23:59:59+01:00`,
    singleEvents: true,
    orderBy: "startTime",
    maxResults
  });

  return (response.data.items ?? []).map((event) => ({
    id: event.id ?? null,
    title: event.summary ?? "Bez tytulu",
    description: event.description ?? null,
    location: event.location ?? null,
    start: event.start?.dateTime ?? event.start?.date ?? "",
    end: event.end?.dateTime ?? event.end?.date ?? ""
  }));
};

export const createGoogleCalendarEvent = async (payload: CalendarPayload) => {
  const client = resolveCalendarClient();
  if (!client) {
    throw new Error("Google Calendar config missing");
  }

  const response = await client.calendar.events.insert({
    calendarId: client.calendarId,
    requestBody: {
      summary: payload.title,
      description: payload.description,
      location: payload.location,
      start: {
        dateTime: toDateTime(payload.eventDate, payload.startTime, "10:00"),
        timeZone: "Europe/Warsaw"
      },
      end: {
        dateTime: toDateTime(payload.eventDate, payload.endTime, "12:00"),
        timeZone: "Europe/Warsaw"
      }
    }
  });

  return { id: response.data.id ?? null, synced: true };
};

export const upsertGoogleCalendarEvent = async (params: {
  existingEventId?: string | null;
  payload: CalendarPayload;
}) => {
  const client = resolveCalendarClient();

  if (!client) {
    logger.warn("Google Calendar config missing, skipping sync");
    return { id: params.existingEventId ?? null, synced: false };
  }
  const eventBody = {
    summary: params.payload.title,
    description: params.payload.description,
    location: params.payload.location,
    start: {
      dateTime: toDateTime(params.payload.eventDate, params.payload.startTime, "10:00"),
      timeZone: "Europe/Warsaw"
    },
    end: {
      dateTime: toDateTime(params.payload.eventDate, params.payload.endTime, "14:00"),
      timeZone: "Europe/Warsaw"
    }
  };

  if (params.existingEventId) {
    const response = await client.calendar.events.patch({
      calendarId: client.calendarId,
      eventId: params.existingEventId,
      requestBody: eventBody
    });
    return { id: response.data.id ?? params.existingEventId, synced: true };
  }

  const response = await client.calendar.events.insert({
    calendarId: client.calendarId,
    requestBody: eventBody
  });

  return { id: response.data.id ?? null, synced: true };
};
