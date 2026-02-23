import { NextResponse } from "next/server";

import { jsonError, requireApiRole, withApiError } from "@/lib/api";
import { templateSchema } from "@/lib/validation";

export const GET = async () =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "BOARD", "MANAGER", "STAFF"]);
    if (auth.error) return auth.error;

    const { data, error } = await auth.supabase
      .from("message_templates")
      .select("id,title,type,content,created_by,created_at")
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

    const parsed = templateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid payload", 422);
    }

    const payload = {
      ...parsed.data,
      created_by: auth.userId
    };

    const { data, error } = await auth.supabase.from("message_templates").insert(payload).select("id").single();
    if (error) {
      return jsonError(error.message, 400);
    }

    return NextResponse.json(data, { status: 201 });
  });
