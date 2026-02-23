# Google Calendar Integration

## Required env

- `GOOGLE_CALENDAR_ID`
- `GOOGLE_CLIENT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GOOGLE_IMPERSONATED_USER` (optional, needed for domain-wide delegation)

## Flow implemented

1. Deal moved to `reserved` (`PATCH /api/deals/:id`)
1. CRM upserts Google Calendar event through `upsertGoogleCalendarEvent(...)`
1. CRM creates/updates linked `events` table row and stores `google_calendar_event_id`

and

1. Event moved to `confirmed` (`POST/PATCH /api/events`)
1. CRM upserts Google Calendar event and stores `google_calendar_event_id`

## Helper function

File: `src/lib/google-calendar.ts`

- Initializes JWT service account auth
- Builds event payload with date/time
- Uses `calendar.events.insert` or `calendar.events.patch`

## Notes

- If Google env is not configured, sync is skipped and app still functions.
- Timezone in helper is `Europe/Warsaw`; change this in `src/lib/google-calendar.ts` if needed.
