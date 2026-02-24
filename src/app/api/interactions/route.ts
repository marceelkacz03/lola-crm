import { NextResponse } from "next/server";

import { jsonError, requireApiRole, withApiError } from "@/lib/api";
import { interactionSchema } from "@/lib/validation";

export const GET = async () =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "BOARD", "MANAGER"]);
    if (auth.error) return auth.error;

    const { data, error } = await auth.supabase
      .from("client_interactions")
      .select("id,account_id,type,note,next_followup_date,created_by,created_at")
      .order("created_at", { ascending: false });

    if (error) {
      return jsonError(error.message, 400);
    }

    return NextResponse.json(data);
  });

export const POST = async (request: Request) =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "MANAGER"]);
    if (auth.error) return auth.error;

    const parsed = interactionSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid payload", 422);
    }

    const payload = {
      ...parsed.data,
      next_followup_date: parsed.data.next_followup_date || null,
      created_by: auth.userId
    };

    const { data, error } = await auth.supabase.from("client_interactions").insert(payload).select("id").single();

    if (error) {
      return jsonError(error.message, 400);
    }

    // Keep next follow-up on account aligned with last interaction input.
    if (payload.next_followup_date) {
      await auth.supabase
        .from("accounts")
        .update({
          next_followup_date: payload.next_followup_date,
          sales_status: "contacted"
        })
        .eq("id", payload.account_id);
    }

    return NextResponse.json(data, { status: 201 });
  });

export const DELETE = async (request: Request) =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "MANAGER"]);
    if (auth.error) return auth.error;

    const id = new URL(request.url).searchParams.get("id");
    if (!id) {
      return jsonError("Missing interaction id", 422);
    }

    const { data, error } = await auth.supabase
      .from("client_interactions")
      .delete()
      .eq("id", id)
      .select("id")
      .single();

    if (error || !data) {
      return jsonError(error?.message ?? "Interaction not found", 400);
    }

    return NextResponse.json({ id: data.id, ok: true });
  });
