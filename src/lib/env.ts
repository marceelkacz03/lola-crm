import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  GOOGLE_CALENDAR_ID: z.string().min(1),
  GOOGLE_CLIENT_EMAIL: z.string().email(),
  GOOGLE_PRIVATE_KEY: z.string().min(1),
  GOOGLE_IMPERSONATED_USER: z.string().email().optional()
});

const safeParse = envSchema.safeParse(process.env);

if (!safeParse.success) {
  console.error("Invalid environment variables", safeParse.error.flatten().fieldErrors);
}

export const env = safeParse.success ? safeParse.data : null;
