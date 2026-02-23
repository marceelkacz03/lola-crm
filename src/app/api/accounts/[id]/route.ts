import { NextResponse } from "next/server";

import { jsonError, requireApiRole, withApiError } from "@/lib/api";
import { accountSalesPatchSchema } from "@/lib/validation";

export const PATCH = async (request: Request, { params }: { params: Promise<{ id: string }> }) =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "MANAGER"]);
    if (auth.error) return auth.error;

    const { id } = await params;
    const parsed = accountSalesPatchSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid payload", 422);
    }

    const payload = {
      ...parsed.data,
      next_followup_date: parsed.data.next_followup_date || null
    };

    const { data, error } = await auth.supabase
      .from("accounts")
      .update(payload)
      .eq("id", id)
      .select("id,sales_status,estimated_value,next_followup_date")
      .single();

    if (error || !data) {
      return jsonError(error?.message ?? "Account not found", 400);
    }

    return NextResponse.json(data);
  });

export const DELETE = async (_request: Request, { params }: { params: Promise<{ id: string }> }) =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "MANAGER"]);
    if (auth.error) return auth.error;

    const { id } = await params;
    const { data, error } = await auth.supabase.from("accounts").delete().eq("id", id).select("id").single();

    if (error || !data) {
      return jsonError(error?.message ?? "Account not found", 400);
    }

    return NextResponse.json({ id: data.id, ok: true });
  });
