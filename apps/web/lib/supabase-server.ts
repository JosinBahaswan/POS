import { createClient } from "@supabase/supabase-js";
import { assertSupabaseEnv, env } from "./env";

export function getSupabaseServerClient() {
  assertSupabaseEnv();

  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL!,
    env.SUPABASE_SERVICE_ROLE_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    }
  );
}
