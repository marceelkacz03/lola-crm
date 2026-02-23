export type AppRole = "ADMIN" | "BOARD" | "MANAGER" | "STAFF";

export type AccountType = "company" | "private" | "wedding_planner";
export type AccountSource =
  | "internal_base"
  | "own_portfolio"
  | "planner"
  | "networking"
  | "other";

export type SalesStatus = "new" | "contacted" | "offer_sent" | "negotiation" | "won" | "lost";

export type DealEventType = "corporate" | "wedding" | "private" | "other";
export type DealStatus =
  | "new_lead"
  | "contacted"
  | "offer_sent"
  | "negotiation"
  | "reserved"
  | "lost";

export type EventStatus = "planned" | "confirmed" | "completed";
export type ActivityType = "call" | "email" | "meeting" | "other";

export type Account = {
  id: string;
  type: AccountType;
  name: string;
  contact_person: string | null;
  email: string | null;
  phone: string | null;
  source: AccountSource;
  sales_status: SalesStatus;
  estimated_value: number | null;
  next_followup_date: string | null;
  created_at: string;
};

export type InteractionType = "call" | "email" | "meeting" | "note";

export type ClientInteraction = {
  id: string;
  account_id: string;
  type: InteractionType;
  note: string;
  next_followup_date: string | null;
  created_by: string;
  created_at: string;
};

export type MessageTemplateType = "first_contact" | "followup" | "offer" | "other";

export type MessageTemplate = {
  id: string;
  title: string;
  type: MessageTemplateType;
  content: string;
  created_by: string;
  created_at: string;
};

export type Deal = {
  id: string;
  account_id: string;
  event_type: DealEventType;
  estimated_value: number;
  estimated_guests: number | null;
  event_date: string | null;
  status: DealStatus;
  probability: number;
  owner_id: string;
  next_followup_date: string | null;
  notes: string | null;
  created_at: string;
};

export type EventRecord = {
  id: string;
  deal_id: string;
  event_date: string;
  event_start_time: string | null;
  event_end_time: string | null;
  final_value: number;
  number_of_guests: number;
  hall: string;
  operational_notes: string | null;
  status: EventStatus;
  google_calendar_event_id: string | null;
  created_at: string;
};

export type Activity = {
  id: string;
  deal_id: string;
  type: ActivityType;
  description: string;
  next_step: string | null;
  next_followup_date: string | null;
  created_by: string;
  created_at: string;
};
