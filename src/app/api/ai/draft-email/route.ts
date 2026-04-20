import { NextResponse } from "next/server";

import { jsonError, requireApiRole, withApiError } from "@/lib/api";
import { callClaude } from "@/lib/anthropic";
import { emailDraftSchema } from "@/lib/validation";

export const POST = async (request: Request) =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "MANAGER"]);
    if (auth.error) return auth.error;

    const body = await request.json();
    const accountId: string = body?.accountId ?? "";
    const language: "pl" | "en" = body?.language === "en" ? "en" : "pl";

    if (!accountId) return jsonError("Brak accountId", 422);

    const { data: account, error: fetchError } = await auth.supabase
      .from("accounts")
      .select("id,name,contact_person,ai_angle,ai_research")
      .eq("id", accountId)
      .single();

    if (fetchError || !account) return jsonError("Klient nie istnieje", 404);

    const research = account.ai_research as { summary?: string } | null;
    const promptKey = language === "en" ? "first_email_en" : "first_email_pl";

    const raw = await callClaude({
      promptKey,
      variables: {
        name: (account.name as string) ?? "",
        contact_person: (account.contact_person as string) ?? "",
        angle: (account.ai_angle as string) ?? "extravaganza",
        summary: research?.summary ?? ""
      },
      leadId: accountId
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return jsonError("Claude zwrócił nieprawidłowy JSON", 500);
    }

    const result = emailDraftSchema.safeParse(parsed);
    if (!result.success) {
      return jsonError("Odpowiedź AI nie pasuje do oczekiwanego schematu", 500);
    }

    const { data: draft, error: insertError } = await auth.supabase
      .from("ai_email_drafts")
      .insert({
        lead_id: accountId,
        draft_type: "first_contact",
        language,
        subject: result.data.subject,
        body: result.data.body,
        alt_subjects: result.data.alt_subjects
      })
      .select("id,subject,body,alt_subjects")
      .single();

    if (insertError) return jsonError(insertError.message, 400);

    return NextResponse.json({ ...draft, needs_review: result.data.needs_review });
  });
