import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env } from "./config";
import type { UserRole } from "./types";

type TenantData = {
  name: string;
  code: string;
  join_code: string;
};

type ProfileData = {
  id: string;
  role: string;
  full_name: string | null;
  is_active: boolean;
  tenant_id: string;
  tenants: TenantData | TenantData[] | null;
};

export type ManagedUserRole = "cashier" | "manager";

export type ManagedUser = {
  id: string;
  email: string;
  fullName: string;
  role: ManagedUserRole;
  isActive: boolean;
  createdAt: string;
};

export type AuthenticatedUser = {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  joinCode: string;
};

let cachedClient: SupabaseClient | null = null;

const getWebApiBaseUrl = () => env.VITE_WEB_API_URL ?? "http://localhost:3000";

export function isAuthConfigured() {
  return Boolean(env.VITE_SUPABASE_URL && env.VITE_SUPABASE_ANON_KEY);
}

function getClient(): SupabaseClient | null {
  if (!isAuthConfigured()) return null;
  if (!cachedClient) {
    cachedClient = createClient(env.VITE_SUPABASE_URL!, env.VITE_SUPABASE_ANON_KEY!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  }
  return cachedClient;
}

function requireClient(): SupabaseClient {
  const client = getClient();
  if (!client) {
    throw new Error("Konfigurasi Supabase belum lengkap untuk login POS.");
  }
  return client;
}

function normalizeRole(role: string): UserRole {
  if (role === "owner" || role === "manager") {
    return role;
  }
  return "cashier";
}

function mapProfileToUser(profile: ProfileData, fallbackEmail: string): AuthenticatedUser {
  const tenant = Array.isArray(profile.tenants) ? profile.tenants[0] : profile.tenants;
  if (!tenant) {
    throw new Error("Data tenant pengguna belum tersedia.");
  }

  return {
    id: profile.id,
    email: fallbackEmail,
    fullName: profile.full_name?.trim() || fallbackEmail,
    role: normalizeRole(profile.role),
    tenantId: profile.tenant_id,
    tenantName: tenant.name,
    tenantCode: tenant.code,
    joinCode: tenant.join_code
  };
}

async function fetchUserProfile(
  client: SupabaseClient,
  userId: string,
  fallbackEmail: string
): Promise<AuthenticatedUser> {
  const { data, error } = await client
    .from("profiles")
    .select("id, role, full_name, is_active, tenant_id, tenants:tenant_id(name, code, join_code)")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message || "Gagal mengambil profil pengguna.");
  }

  if (!data) {
    throw new Error("Profil belum aktif. Owner perlu mengaktifkan akun Anda terlebih dahulu.");
  }

  if (!data.is_active) {
    await client.auth.signOut();
    throw new Error("Akun Anda nonaktif. Hubungi owner perusahaan.");
  }

  return mapProfileToUser(data as ProfileData, fallbackEmail);
}

async function ensureActiveSession(client: SupabaseClient, email: string, password: string) {
  const { data: sessionData } = await client.auth.getSession();
  if (sessionData.session?.user) {
    return sessionData.session.user.id;
  }

  const { data: signInData, error: signInError } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (signInError || !signInData.user) {
    throw new Error(
      "Akun berhasil dibuat. Verifikasi email dulu, lalu login kembali untuk melanjutkan aktivasi akun."
    );
  }

  return signInData.user.id;
}

async function getAccessToken(client: SupabaseClient): Promise<string> {
  const { data, error } = await client.auth.getSession();
  if (error || !data.session?.access_token) {
    throw new Error("Sesi login tidak ditemukan. Silakan login ulang.");
  }
  return data.session.access_token;
}

async function requestOwnerUsersApi<T>(method: "GET" | "POST" | "PATCH", body?: unknown): Promise<T> {
  const client = requireClient();
  const accessToken = await getAccessToken(client);

  const response = await fetch(`${getWebApiBaseUrl()}/api/owner/users`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message =
      payload && typeof payload.message === "string"
        ? payload.message
        : "Gagal memproses manajemen akun staf.";
    throw new Error(message);
  }

  return payload as T;
}

export async function getCurrentAuthUser(): Promise<AuthenticatedUser | null> {
  const client = getClient();
  if (!client) return null;

  const { data, error } = await client.auth.getSession();
  if (error || !data.session?.user) {
    return null;
  }

  try {
    return await fetchUserProfile(
      client,
      data.session.user.id,
      data.session.user.email ?? "user@local"
    );
  } catch {
    return null;
  }
}

export async function signInWithEmail(email: string, password: string): Promise<AuthenticatedUser> {
  const client = requireClient();
  const normalizedEmail = email.trim().toLowerCase();

  const { data, error } = await client.auth.signInWithPassword({
    email: normalizedEmail,
    password
  });

  if (error || !data.user) {
    throw new Error(error?.message || "Email atau password salah.");
  }

  return fetchUserProfile(client, data.user.id, data.user.email ?? normalizedEmail);
}

export async function registerOwnerAccount(input: {
  email: string;
  password: string;
  fullName: string;
  companyName: string;
  companyCode: string;
}): Promise<AuthenticatedUser> {
  const client = requireClient();
  const email = input.email.trim().toLowerCase();

  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email,
    password: input.password
  });

  if (signUpError || !signUpData.user) {
    throw new Error(signUpError?.message || "Gagal membuat akun owner.");
  }

  const userId = await ensureActiveSession(client, email, input.password);

  const { error: rpcError } = await client.rpc("register_owner", {
    p_company_name: input.companyName,
    p_company_code: input.companyCode,
    p_full_name: input.fullName
  });

  if (rpcError && !rpcError.message.includes("already has a company profile")) {
    throw new Error(rpcError.message || "Gagal membuat perusahaan.");
  }

  return fetchUserProfile(client, userId, signUpData.user.email ?? email);
}

export async function listManagedUsers(): Promise<ManagedUser[]> {
  const response = await requestOwnerUsersApi<{ users: ManagedUser[] }>("GET");
  return Array.isArray(response.users) ? response.users : [];
}

export async function createManagedUser(input: {
  email: string;
  password: string;
  fullName: string;
  role: ManagedUserRole;
}): Promise<ManagedUser> {
  const response = await requestOwnerUsersApi<{ user: ManagedUser }>("POST", input);
  return response.user;
}

export async function updateManagedUser(input: {
  userId: string;
  role?: ManagedUserRole;
  isActive?: boolean;
  fullName?: string;
}): Promise<ManagedUser> {
  const response = await requestOwnerUsersApi<{ user: ManagedUser }>("PATCH", input);
  return response.user;
}

export async function signOutUser() {
  const client = getClient();
  if (!client) return;
  await client.auth.signOut();
}
