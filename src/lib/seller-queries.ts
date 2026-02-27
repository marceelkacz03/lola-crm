import { format, startOfWeek } from "date-fns";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { AppRole } from "@/lib/types";

export const getSellerKpis = async () => {
  const supabase = await createSupabaseServerClient();
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  const { data: accounts } = await supabase
    .from("accounts")
    .select("id,created_at,sales_status,estimated_value")
    .order("created_at", { ascending: false });

  const rows = accounts ?? [];
  const newThisWeek = rows.filter((row) => String(row.created_at).slice(0, 10) >= weekStart).length;
  const offersSent = rows.filter((row) => row.sales_status === "offer_sent").length;
  const inNegotiation = rows.filter((row) => row.sales_status === "negotiation").length;
  const completed = rows.filter((row) => row.sales_status === "won").length;

  return {
    newThisWeek,
    offersSent,
    inNegotiation,
    completed
  };
};

export const getReminderTasks = async () => {
  const supabase = await createSupabaseServerClient();
  const today = format(new Date(), "yyyy-MM-dd");

  const { data } = await supabase
    .from("accounts")
    .select("id,name,sales_status,next_followup_date,estimated_value")
    .not("sales_status", "in", "(won,lost)")
    .not("next_followup_date", "is", null)
    .lte("next_followup_date", today)
    .order("next_followup_date", { ascending: true });

  const tasks = data ?? [];
  return {
    overdue: tasks.filter((task) => String(task.next_followup_date) < today),
    today: tasks.filter((task) => String(task.next_followup_date) === today)
  };
};

export const getAccountsForSeller = async (role: AppRole) => {
  if (role === "STAFF") return [];
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("accounts")
    .select("id,name,sales_status,estimated_value,next_followup_date")
    .order("created_at", { ascending: false });

  return data ?? [];
};

export const getInteractionsWithAccounts = async () => {
  const supabase = await createSupabaseServerClient();
  const [interactionsRes, accountsRes] = await Promise.all([
    supabase
      .from("client_interactions")
      .select("id,account_id,type,note,next_followup_date,created_at")
      .order("created_at", { ascending: false })
      .limit(80),
    supabase.from("accounts").select("id,name")
  ]);

  const accountNameMap = new Map<string, string>();
  for (const account of accountsRes.data ?? []) {
    accountNameMap.set(account.id, account.name);
  }

  return (interactionsRes.data ?? []).map((row) => ({
    ...row,
    account_name: accountNameMap.get(row.account_id) ?? "Klient"
  }));
};

export const getMessageTemplates = async () => {
  const supabase = await createSupabaseServerClient();
  const { data } = await supabase
    .from("message_templates")
    .select("id,title,type,content,created_at")
    .order("created_at", { ascending: false });

  return data ?? [];
};
