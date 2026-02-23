import { z } from "zod";

export const accountSchema = z.object({
  type: z.enum(["company", "private", "wedding_planner"]),
  name: z.string().min(2),
  contact_person: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  source: z.enum(["internal_base", "own_portfolio", "planner", "networking", "other"]),
  sales_status: z.enum(["new", "contacted", "offer_sent", "negotiation", "won", "lost"]).optional(),
  estimated_value: z.number().min(0).optional(),
  next_followup_date: z.string().optional()
});

export const accountSalesPatchSchema = z.object({
  sales_status: z.enum(["new", "contacted", "offer_sent", "negotiation", "won", "lost"]).optional(),
  estimated_value: z.number().min(0).nullable().optional(),
  next_followup_date: z.string().nullable().optional()
});

export const dealSchema = z.object({
  account_id: z.string().uuid(),
  event_type: z.enum(["corporate", "wedding", "private", "other"]),
  estimated_value: z.number().min(0),
  estimated_guests: z.number().int().min(0).optional(),
  event_date: z.string().optional(),
  status: z.enum(["new_lead", "contacted", "offer_sent", "negotiation", "reserved", "lost"]),
  probability: z.number().int().min(0).max(100),
  owner_id: z.string().uuid(),
  next_followup_date: z.string().optional(),
  notes: z.string().optional()
});

export const dealPatchSchema = z.object({
  status: z.enum(["new_lead", "contacted", "offer_sent", "negotiation", "reserved", "lost"]).optional(),
  probability: z.number().int().min(0).max(100).optional(),
  next_followup_date: z.string().optional()
});

export const eventSchema = z.object({
  deal_id: z.string().uuid(),
  event_date: z.string(),
  event_start_time: z.string().optional(),
  event_end_time: z.string().optional(),
  final_value: z.number().min(0),
  number_of_guests: z.number().int().min(1),
  hall: z.string().min(1),
  operational_notes: z.string().optional(),
  status: z.enum(["planned", "confirmed", "completed"])
});

export const eventPatchSchema = z.object({
  status: z.enum(["planned", "confirmed", "completed"]).optional(),
  event_date: z.string().optional(),
  event_start_time: z.string().optional(),
  event_end_time: z.string().optional(),
  hall: z.string().optional(),
  operational_notes: z.string().optional()
});

export const activitySchema = z.object({
  deal_id: z.string().uuid(),
  type: z.enum(["call", "email", "meeting", "other"]),
  description: z.string().min(3),
  next_step: z.string().optional(),
  next_followup_date: z.string().optional()
});

export const interactionSchema = z.object({
  account_id: z.string().uuid(),
  type: z.enum(["call", "email", "meeting", "note"]),
  note: z.string().min(2),
  next_followup_date: z.string().optional()
});

export const templateSchema = z.object({
  title: z.string().min(2),
  type: z.enum(["first_contact", "followup", "offer", "other"]),
  content: z.string().min(5)
});
