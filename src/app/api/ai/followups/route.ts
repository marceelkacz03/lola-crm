import { NextResponse } from "next/server";

import { jsonError, requireApiRole, withApiError } from "@/lib/api";
import { callClaude } from "@/lib/anthropic";
import { followupSequenceSchema } from "@/lib/validation";

export const GET = async (request: Request) =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "BOARD", "MANAGER"]);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get("accountId");
    if (!accountId) return jsonError("Brak accountId", 422);

    const { data, error } = await auth.supabase
      .from("ai_email_drafts")
      .select("id,draft_type,language,subject,body,status,scheduled_for,sent_at,created_at")
      .eq("lead_id", accountId)
      .neq("draft_type", "first_contact")
      .order("scheduled_for", { ascending: true });

    if (error) return jsonError(error.message, 400);

    return NextResponse.json(data ?? []);
  });

export const POST = async (request: Request) =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "MANAGER"]);
    if (auth.error) return auth.error;

    const body = await request.json();
    const accountId: string = body?.accountId ?? "";
    const firstEmailId: string = body?.firstEmailId ?? "";
    const language: "pl" | "en" = body?.language === "en" ? "en" : "pl";

    if (!accountId || !firstEmailId) return jsonError("Brak accountId lub firstEmailId", 422);

    const { data: account, error: accError } = await auth.supabase
      .from("accounts")
      .select("id,name,contact_person,ai_angle")
      .eq("id", accountId)
      .single();

    if (accError || !account) return jsonError("Klient nie istnieje", 404);

    const { data: firstEmail, error: emailError } = await auth.supabase
      .from("ai_email_drafts")
      .select("subject,body")
      .eq("id", firstEmailId)
      .single();

    if (emailError || !firstEmail) return jsonError("Pierwsze email nie istnieje", 404);

    const promptKey = language === "en" ? "followup_sequence_en" : "followup_sequence_pl";

    const raw = await callClaude({
      promptKey,
      variables: {
        name: (account.name as string) ?? "",
        contact_person: (account.contact_person as string) ?? "",
        angle: (account.ai_angle as string) ?? "extravaganza",
        first_subject: (firstEmail.subject as string) ?? "",
        first_body: (firstEmail.body as string) ?? ""
      },
      leadId: accountId
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return jsonError("Claude zwrócił nieprawidłowy JSON", 500);
    }

    const result = followupSequenceSchema.safeParse(parsed);
    if (!result.success) {
      return jsonError("Odpowiedź AI nie pasuje do oczekiwanego schematu", 500);
    }

    const now = Date.now();
    const rows = result.data.map((item) => ({
      lead_id: accountId,
      draft_type: item.draft_type,
      language,
      subject: item.subject,
      body: item.body,
      scheduled_for: new Date(now + item.days_after * 24 * 60 * 60 * 1000).toISOString()
    }));

    const { data: inserted, error: insertError } = await auth.supabase
      .from("ai_email_drafts")
      .insert(rows)
      .select("id,draft_type,subject,body,scheduled_for,status");

    if (insertError) return jsonError(insertError.message, 400);

    return NextResponse.json(inserted, { status: 201 });
  });
