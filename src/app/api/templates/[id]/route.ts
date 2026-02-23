import { NextResponse } from "next/server";

import { jsonError, requireApiRole, withApiError } from "@/lib/api";
import { templateSchema } from "@/lib/validation";

export const PATCH = async (request: Request, { params }: { params: Promise<{ id: string }> }) =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "MANAGER"]);
    if (auth.error) return auth.error;

    const { id } = await params;
    const parsed = templateSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid payload", 422);
    }

    const { data, error } = await auth.supabase.from("message_templates").update(parsed.data).eq("id", id).select("id").single();
    if (error || !data) {
      return jsonError(error?.message ?? "Template not found", 400);
    }

    return NextResponse.json(data);
  });

export const DELETE = async (_request: Request, { params }: { params: Promise<{ id: string }> }) =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "MANAGER"]);
    if (auth.error) return auth.error;

    const { id } = await params;
    const { error } = await auth.supabase.from("message_templates").delete().eq("id", id);
    if (error) {
      return jsonError(error.message, 400);
    }

    return NextResponse.json({ id, ok: true });
  });
