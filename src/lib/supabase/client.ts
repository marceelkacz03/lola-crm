"use client";

import { createBrowserClient } from "@supabase/ssr";

import { supabaseConfig } from "@/lib/supabase/config";

export const createSupabaseBrowserClient = () =>
  createBrowserClient(supabaseConfig.url, supabaseConfig.anonKey);
