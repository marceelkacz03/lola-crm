import { addDays, endOfMonth, format, startOfMonth, subDays } from "date-fns";

import { relationName } from "@/lib/supabase-relations";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types";

export const getDashboardStats = async (role?: AppRole) => {
  const supabase = await createSupabaseServerClient();
  const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

  if (role === "STAFF") {
    const { data: upcomingEvents } = await supabase
      .from("events")
      .select("id,event_date,hall,status,number_of_guests")
      .eq("status", "confirmed")
      .order("event_date", { ascending: true })
      .limit(8);

    return {
      totalPipelineValue: 0,
      monthlySalesValue: 0,
      conversionRate: 0,
      averageEventValue: 0,
      salesBySource: [],
      upcomingEvents: upcomingEvents ?? []
    };
  }

  const [pipelineRes, monthlyRes, wonLostRes, avgEventValueRes, accountsRes, dealsByAccountRes, upcomingRes] = await Promise.all([
    supabase.from("deals").select("estimated_value"),
    supabase
      .from("events")
      .select("final_value")
      .eq("status", "confirmed")
      .gte("event_date", monthStart)
      .lte("event_date", monthEnd),
    supabase.from("deals").select("status"),
    supabase.from("events").select("final_value").eq("status", "completed"),
    supabase.from("accounts").select("id,source"),
    supabase.from("deals").select("account_id,estimated_value"),
    supabase
      .from("events")
      .select("id,event_date,hall,status,number_of_guests")
      .in("status", ["planned", "confirmed"])
      .order("event_date", { ascending: true })
      .limit(8)
  ]);

  const totalPipelineValue =
    pipelineRes.data?.reduce((sum, row) => sum + Number(row.estimated_value || 0), 0) ?? 0;

  const monthlySalesValue =
    monthlyRes.data?.reduce((sum, row) => sum + Number(row.final_value || 0), 0) ?? 0;

  const wonCount = wonLostRes.data?.filter((d) => d.status === "reserved").length ?? 0;
  const lostCount = wonLostRes.data?.filter((d) => d.status === "lost").length ?? 0;
  const conversionRate = wonCount + lostCount > 0 ? (wonCount / (wonCount + lostCount)) * 100 : 0;

  const averageEventValue = avgEventValueRes.data?.length
    ? avgEventValueRes.data.reduce((sum, row) => sum + Number(row.final_value || 0), 0) /
      avgEventValueRes.data.length
    : 0;

  const sourceMap = new Map<string, string>();
  for (const account of accountsRes.data ?? []) {
    sourceMap.set(account.id, account.source);
  }

  const sourceTotals = new Map<string, number>();
  for (const deal of dealsByAccountRes.data ?? []) {
    const source = sourceMap.get(deal.account_id) ?? "other";
    sourceTotals.set(source, (sourceTotals.get(source) ?? 0) + Number(deal.estimated_value || 0));
  }

  const salesBySource = Array.from(sourceTotals.entries()).map(([source, value]) => ({ source, value }));

  return {
    totalPipelineValue,
    monthlySalesValue,
    conversionRate,
    averageEventValue,
    salesBySource,
    upcomingEvents: upcomingRes.data ?? []
  };
};

export const getSalesAlerts = async (inactiveDays = 5) => {
  const supabase = await createSupabaseServerClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const inactivityCutoff = subDays(new Date(), inactiveDays);

  const [dealsRes, activitiesRes] = await Promise.all([
    supabase
      .from("deals")
      .select("id,status,next_followup_date,created_at,accounts(name)")
      .order("created_at", { ascending: false }),
    supabase.from("activities").select("deal_id,created_at").order("created_at", { ascending: false })
  ]);

  const latestActivityByDeal = new Map<string, string>();
  for (const activity of activitiesRes.data ?? []) {
    if (!latestActivityByDeal.has(activity.deal_id)) {
      latestActivityByDeal.set(activity.deal_id, activity.created_at);
    }
  }

  const openDeals = (dealsRes.data ?? []).filter((deal) => deal.status !== "reserved" && deal.status !== "lost");

  const overdueFollowups = openDeals
    .filter((deal) => Boolean(deal.next_followup_date) && String(deal.next_followup_date) < today)
    .map((deal) => ({
      id: deal.id,
      status: deal.status,
      next_followup_date: deal.next_followup_date,
      account_name: relationName(deal.accounts, "Konto")
    }));

  const inactiveDeals = openDeals
    .filter((deal) => {
      const latestActivity = latestActivityByDeal.get(deal.id) ?? deal.created_at;
      return new Date(latestActivity) < inactivityCutoff;
    })
    .map((deal) => ({
      id: deal.id,
      status: deal.status,
      last_activity_at: latestActivityByDeal.get(deal.id) ?? deal.created_at,
      account_name: relationName(deal.accounts, "Konto")
    }));

  const missingFollowups = openDeals
    .filter((deal) => !deal.next_followup_date)
    .map((deal) => ({
      id: deal.id,
      status: deal.status,
      account_name: relationName(deal.accounts, "Konto")
    }));

  return {
    inactiveDays,
    overdueFollowups,
    inactiveDeals,
    missingFollowups
  };
};

export const getOperationalChecklist = async () => {
  const supabase = await createSupabaseServerClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const nextWeek = format(addDays(new Date(), 7), "yyyy-MM-dd");

  const { data: events } = await supabase
    .from("events")
    .select("id,deal_id,event_date,event_start_time,event_end_time,number_of_guests,hall,operational_notes,status")
    .eq("status", "confirmed")
    .gte("event_date", today)
    .lte("event_date", nextWeek)
    .order("event_date", { ascending: true });

  const dealIds = Array.from(new Set((events ?? []).map((event) => event.deal_id)));
  const { data: dealNames } = dealIds.length
    ? await supabase.from("deals").select("id,accounts(name)").in("id", dealIds)
    : { data: [] as { id: string; accounts: unknown }[] };

  const dealNameMap = new Map<string, string>();
  for (const deal of dealNames ?? []) {
    dealNameMap.set(deal.id, relationName(deal.accounts, "Konto"));
  }

  const checklist = (events ?? []).map((event) => {
    const items = [
      { label: "Godzina startu potwierdzona", done: Boolean(event.event_start_time) },
      { label: "Godzina zakonczenia potwierdzona", done: Boolean(event.event_end_time) },
      { label: "Sala przypisana", done: Boolean(event.hall && event.hall !== "TBD") },
      { label: "Liczba gosci uzupelniona", done: Number(event.number_of_guests || 0) > 0 },
      {
        label: "Notatki operacyjne uzupelnione",
        done: Boolean(event.operational_notes && event.operational_notes.trim().length > 0)
      }
    ];

    const completedItems = items.filter((item) => item.done).length;
    const pendingItems = items.filter((item) => !item.done).map((item) => item.label);

    return {
      id: event.id,
      account_name: dealNameMap.get(event.deal_id) ?? "Konto",
      event_date: event.event_date,
      hall: event.hall,
      completedItems,
      totalItems: items.length,
      pendingItems
    };
  });

  const eventsToday = checklist.filter((event) => event.event_date === today).length;
  const totalPendingItems = checklist.reduce((sum, event) => sum + event.pendingItems.length, 0);

  return {
    events: checklist,
    totals: {
      eventsInWeek: checklist.length,
      eventsToday,
      totalPendingItems
    }
  };
};

export const getDealsKanbanData = async () => {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("deals")
    .select("id, event_type, estimated_value, status, probability, event_date, next_followup_date, accounts(name)")
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
};

export const getDailyFollowups = async () => {
  const supabase = await createSupabaseServerClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const tomorrow = format(addDays(new Date(), 1), "yyyy-MM-dd");

  const [dealsRes, activitiesRes, dealNamesRes] = await Promise.all([
    supabase
      .from("deals")
      .select("id, status, next_followup_date, account_id")
      .gte("next_followup_date", today)
      .lt("next_followup_date", tomorrow)
      .order("next_followup_date"),
    supabase
      .from("activities")
      .select("id, type, next_followup_date, deal_id")
      .gte("next_followup_date", today)
      .lt("next_followup_date", tomorrow)
      .order("next_followup_date"),
    supabase.from("deals").select("id,accounts(name)")
  ]);

  const dealNameMap = new Map<string, string>();
  for (const row of dealNamesRes.data ?? []) {
    dealNameMap.set(row.id, relationName(row.accounts));
  }

  return {
    deals:
      dealsRes.data?.map((row) => ({
        ...row,
        account_name: dealNameMap.get(row.id) ?? "Konto"
      })) ?? [],
    activities:
      activitiesRes.data?.map((row) => ({
        ...row,
        account_name: dealNameMap.get(row.deal_id) ?? "Konto"
      })) ?? []
  };
};

export const getWeeklySalesReport = async () => {
  const supabase = await createSupabaseServerClient();
  const now = new Date();
  const weekStart = format(addDays(now, -7), "yyyy-MM-dd");
  const weekEnd = format(now, "yyyy-MM-dd");

  const [pipelineRes, conversionsRes] = await Promise.all([
    supabase.from("deals").select("estimated_value,status").gte("created_at", weekStart).lte("created_at", weekEnd),
    supabase.from("events").select("final_value,status").gte("created_at", weekStart).lte("created_at", weekEnd)
  ]);

  const pipelineValue =
    pipelineRes.data?.reduce((sum, row) => sum + Number(row.estimated_value || 0), 0) ?? 0;
  const reservedCount = pipelineRes.data?.filter((row) => row.status === "reserved").length ?? 0;
  const lostCount = pipelineRes.data?.filter((row) => row.status === "lost").length ?? 0;
  const conversionRate = reservedCount + lostCount > 0 ? (reservedCount / (reservedCount + lostCount)) * 100 : 0;
  const confirmedRevenue =
    conversionsRes.data
      ?.filter((row) => row.status === "confirmed" || row.status === "completed")
      .reduce((sum, row) => sum + Number(row.final_value || 0), 0) ?? 0;

  return {
    periodStart: weekStart,
    periodEnd: weekEnd,
    pipelineValue,
    conversionRate,
    confirmedRevenue
  };
};
