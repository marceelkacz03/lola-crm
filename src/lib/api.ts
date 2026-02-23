import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { logger } from "@/lib/logger";
import type { AppRole } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const jsonError = (message: string, status = 400) =>
  NextResponse.json({ error: message }, { status });

export const withApiError = async <T>(
  handler: () => Promise<T>,
  context?: Record<string, unknown>
): Promise<T | NextResponse> => {
  try {
    return await handler();
  } catch (error) {
    logger.error("API failure", {
      ...context,
      error: error instanceof Error ? error.message : "unknown"
    });
    return jsonError("Internal server error", 500);
  }
};

type ApiRoleResult =
  | {
      error: NextResponse;
      supabase: null;
      userId: null;
      role: null;
    }
  | {
      error: null;
      supabase: SupabaseClient;
      userId: string;
      role: AppRole;
    };

export const requireApiRole = async (roles: AppRole[]): Promise<ApiRoleResult> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { error: jsonError("Unauthorized", 401), supabase: null, userId: null, role: null };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !profile || !roles.includes(profile.role as AppRole)) {
    return { error: jsonError("Forbidden", 403), supabase: null, userId: null, role: null };
  }

  return { error: null, supabase, userId: user.id, role: profile.role as AppRole };
};
