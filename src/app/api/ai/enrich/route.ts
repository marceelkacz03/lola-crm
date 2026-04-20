import { NextResponse } from "next/server";

import { jsonError, requireApiRole, withApiError } from "@/lib/api";
import { callClaude } from "@/lib/anthropic";
import { enrichResponseSchema } from "@/lib/validation";

export const POST = async (request: Request) =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "MANAGER"]);
    if (auth.error) return auth.error;

    const body = await request.json();
    const url: string = body?.url ?? "";

    if (!url || typeof url !== "string" || url.trim().length < 5) {
      return jsonError("Podaj prawidłowy URL", 422);
    }

    const raw = await callClaude({
      promptKey: "enrich_lead",
      variables: { url: url.trim() }
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return jsonError("Claude zwrócił nieprawidłowy JSON", 500);
    }

    const result = enrichResponseSchema.safeParse(parsed);
    if (!result.success) {
      return jsonError("Odpowiedź AI nie pasuje do oczekiwanego schematu", 500);
    }

    return NextResponse.json(result.data);
  });
