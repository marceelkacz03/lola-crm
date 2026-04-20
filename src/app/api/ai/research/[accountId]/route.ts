import { NextResponse } from "next/server";

import { jsonError, requireApiRole, withApiError } from "@/lib/api";
import { callClaude } from "@/lib/anthropic";
import { researchResponseSchema } from "@/lib/validation";

const ONE_HOUR_MS = 60 * 60 * 1000;

export const POST = async (
  _request: Request,
  { params }: { params: Promise<{ accountId: string }> }
) =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "MANAGER"]);
    if (auth.error) return auth.error;

    const { accountId } = await params;

    const { data: account, error: fetchError } = await auth.supabase
      .from("accounts")
      .select("id,name,type,contact_person,email,ai_research_updated_at")
      .eq("id", accountId)
      .single();

    if (fetchError || !account) return jsonError("Klient nie istnieje", 404);

    // Rate limit: 1 call per lead per hour
    if (account.ai_research_updated_at) {
      const lastCall = new Date(account.ai_research_updated_at as string).getTime();
      if (Date.now() - lastCall < ONE_HOUR_MS) {
        return jsonError("Badanie tego leada jest dostępne raz na godzinę.", 429);
      }
    }

    const raw = await callClaude({
      promptKey: "research_lead",
      variables: {
        name: (account.name as string) ?? "",
        type: (account.type as string) ?? "",
        contact_person: (account.contact_person as string) ?? "",
        url: (account.email as string) ?? ""
      },
      leadId: accountId
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return jsonError("Claude zwrócił nieprawidłowy JSON", 500);
    }

    const result = researchResponseSchema.safeParse(parsed);
    if (!result.success) {
      return jsonError("Odpowiedź AI nie pasuje do oczekiwanego schematu", 500);
    }

    const { error: updateError } = await auth.supabase
      .from("accounts")
      .update({
        ai_research: result.data,
        ai_research_updated_at: new Date().toISOString(),
        ai_lead_score: result.data.score,
        ai_angle: result.data.angle
      })
      .eq("id", accountId);

    if (updateError) return jsonError(updateError.message, 400);

    return NextResponse.json(result.data);
  });
