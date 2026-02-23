import { createClient } from "@supabase/supabase-js";

import { supabaseConfig } from "@/lib/supabase/config";

export const createSupabaseAdminClient = () => {
  if (!supabaseConfig.serviceRoleKey) {
    throw new Error("Missing required environment variable: SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseConfig.url, supabaseConfig.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
};
