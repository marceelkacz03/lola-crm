import { redirect } from "next/navigation";

import type { AppRole } from "@/lib/types";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const getCurrentUserContext = async () => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, email")
    .eq("id", user.id)
    .single();

  if (profileError || !profile) {
    return null;
  }

  return {
    id: profile.id as string,
    email: profile.email as string,
    role: profile.role as AppRole
  };
};

export const requireUserContext = async () => {
  const userContext = await getCurrentUserContext();
  if (!userContext) {
    redirect("/login");
  }
  return userContext;
};

export const requireAnyRole = async (roles: AppRole[]) => {
  const user = await requireUserContext();
  if (!roles.includes(user.role)) {
    redirect("/dashboard");
  }
  return user;
};
