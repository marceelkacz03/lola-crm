import { NextResponse } from "next/server";

import { requireApiRole, withApiError } from "@/lib/api";
import { getDailyFollowups } from "@/lib/queries";

export const GET = async () =>
  withApiError(async () => {
    const auth = await requireApiRole(["ADMIN", "BOARD", "MANAGER"]);
    if (auth.error) return auth.error;

    const reminders = await getDailyFollowups();
    return NextResponse.json(reminders);
  });
