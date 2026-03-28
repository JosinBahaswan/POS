type EnvShape = {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_ANON_KEY?: string;
  SUPABASE_SERVICE_ROLE_KEY?: string;
};

export const env: EnvShape = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim(),
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
};

export function assertSupabaseEnv() {
  if (!env.NEXT_PUBLIC_SUPABASE_URL) {
    throw new Error("Missing required env: NEXT_PUBLIC_SUPABASE_URL");
  }
  if (!env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error("Missing required env: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }
}
