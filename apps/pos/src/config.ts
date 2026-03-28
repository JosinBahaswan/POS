type PosEnv = {
  VITE_SUPABASE_URL?: string;
  VITE_SUPABASE_ANON_KEY?: string;
  VITE_TENANT_ID?: string;
  VITE_WEB_API_URL?: string;
};

const read = (name: string): string | undefined => {
  const value = import.meta.env[name as keyof ImportMetaEnv];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export const env: PosEnv = {
  VITE_SUPABASE_URL: read("VITE_SUPABASE_URL"),
  VITE_SUPABASE_ANON_KEY: read("VITE_SUPABASE_ANON_KEY"),
  VITE_TENANT_ID: read("VITE_TENANT_ID"),
  VITE_WEB_API_URL: read("VITE_WEB_API_URL")
};
