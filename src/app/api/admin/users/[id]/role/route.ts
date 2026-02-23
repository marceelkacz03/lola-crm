import { NextResponse } from "next/server";
import { z } from "zod";

import { jsonError, requireApiRole, withApiError } from "@/lib/api";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

const roleSchema = z.object({
  role: z.enum(["ADMIN", "BOARD", "MANAGER", "STAFF"])
});

export const PATCH = async (request: Request, { params }: { params: Promise<{ id: string }> }) =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN"]);
    if (auth.error) return auth.error;

    const { id } = await params;
    const parsed = roleSchema.safeParse(await request.json());
    if (!parsed.success) {
      return jsonError(parsed.error.errors[0]?.message ?? "Invalid payload", 422);
    }

    const admin = createSupabaseAdminClient();
    const { error } = await admin.from("profiles").update({ role: parsed.data.role }).eq("id", id);

    if (error) {
      return jsonError(error.message, 400);
    }

    return NextResponse.json({ id, role: parsed.data.role });
  });
