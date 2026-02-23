import { NextResponse } from "next/server";

import { jsonError, requireApiRole, withApiError } from "@/lib/api";
import { toCsv } from "@/lib/csv";

const allowedEntities = {
  accounts: "accounts",
  deals: "deals",
  events: "events",
  activities: "activities",
  audit_logs: "audit_logs"
} as const;

export const GET = async (_request: Request, { params }: { params: Promise<{ entity: string }> }) =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "BOARD"]);
    if (auth.error) return auth.error;

    const { entity } = await params;
    const table = allowedEntities[entity as keyof typeof allowedEntities];
    if (!table) {
      return jsonError("Invalid export entity", 404);
    }

    const { data, error } = await auth.supabase.from(table).select("*");
    if (error) {
      return jsonError(error.message, 400);
    }

    const csv = toCsv(data ?? []);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${entity}.csv"`
      }
    });
  });
