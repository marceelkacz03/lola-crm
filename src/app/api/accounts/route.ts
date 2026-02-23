import { NextResponse } from "next/server";

import { jsonError, requireApiRole, withApiError } from "@/lib/api";
import { accountSchema } from "@/lib/validation";

export const GET = async () =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "BOARD", "MANAGER"]);
    if (auth.error) return auth.error;

    const { data, error } = await auth.supabase
      .from("accounts")
      .select("id,type,name,contact_person,email,phone,source,sales_status,estimated_value,next_followup_date,created_at")
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

    const parsed = accountSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid payload", 422);
    }

    const payload = {
      ...parsed.data,
      sales_status: parsed.data.sales_status ?? "new",
      estimated_value: parsed.data.estimated_value ?? null,
      next_followup_date: parsed.data.next_followup_date || null
    };

    const { data, error } = await auth.supabase.from("accounts").insert(payload).select("id").single();
    if (error) {
      return jsonError(error.message, 400);
    }

    return NextResponse.json(data, { status: 201 });
  });
