import { NextResponse } from "next/server";

import { jsonError, requireApiRole, withApiError } from "@/lib/api";

export const PATCH = async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "MANAGER"]);
    if (auth.error) return auth.error;

    const { id } = await params;

    const { error } = await auth.supabase
      .from("ai_email_drafts")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", id);

    if (error) return jsonError(error.message, 400);

    return NextResponse.json({ ok: true });
  });
