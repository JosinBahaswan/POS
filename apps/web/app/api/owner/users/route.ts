import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/env";
import { getSupabaseServerClient } from "@/lib/supabase-server";

type ManagedUserRole = "cashier" | "manager";

type ManagedUserDto = {
  id: string;
  email: string;
  fullName: string;
  role: ManagedUserRole;
  isActive: boolean;
  createdAt: string;
};

type OwnerContext = {
  requesterId: string;
  tenantId: string;
};

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Authorization, Content-Type",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS"
};

function jsonResponse(payload: unknown, status = 200) {
  return NextResponse.json(payload, {
    status,
    headers: CORS_HEADERS
  });
}

function ensureServiceRoleKey() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY === "your-service-role-key") {
    throw new HttpError(500, "SUPABASE_SERVICE_ROLE_KEY belum valid di apps/web/.env");
  }
}

async function parseOwnerContext(request: NextRequest): Promise<OwnerContext> {
  ensureServiceRoleKey();

  const authHeader = request.headers.get("authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    throw new HttpError(401, "Unauthorized");
  }

  const supabase = getSupabaseServerClient();

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) {
    throw new HttpError(401, "Token login tidak valid");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tenant_id, role")
    .eq("id", userData.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new HttpError(403, "Profil owner tidak ditemukan");
  }

  if (profile.role !== "owner") {
    throw new HttpError(403, "Hanya owner yang boleh mengelola akun staf");
  }

  return {
    requesterId: userData.user.id,
    tenantId: profile.tenant_id
  };
}

async function mapProfilesToManagedUsers(
  profileRows: Array<{
    id: string;
    role: string;
    full_name: string | null;
    is_active: boolean;
    created_at: string;
  }>
): Promise<ManagedUserDto[]> {
  const supabase = getSupabaseServerClient();

  return Promise.all(
    profileRows.map(async (row) => {
      const authUser = await supabase.auth.admin.getUserById(row.id);
      const email = authUser.data.user?.email ?? "unknown@local";

      return {
        id: row.id,
        email,
        fullName: row.full_name?.trim() || email,
        role: (row.role === "manager" ? "manager" : "cashier") as ManagedUserRole,
        isActive: row.is_active,
        createdAt: row.created_at
      };
    })
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS
  });
}

export async function GET(request: NextRequest) {
  try {
    const owner = await parseOwnerContext(request);
    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("profiles")
      .select("id, role, full_name, is_active, created_at")
      .eq("tenant_id", owner.tenantId)
      .in("role", ["cashier", "manager"])
      .order("created_at", { ascending: false });

    if (error) {
      throw new HttpError(500, error.message || "Gagal mengambil akun staf");
    }

    const users = await mapProfilesToManagedUsers(data ?? []);
    return jsonResponse({ ok: true, users });
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonResponse({ ok: false, message: err.message }, err.status);
    }
    return jsonResponse({ ok: false, message: "Internal server error" }, 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    const owner = await parseOwnerContext(request);
    const body = await request.json();

    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "").trim();
    const fullName = String(body.fullName ?? "").trim();
    const role = String(body.role ?? "").trim().toLowerCase() as ManagedUserRole;

    if (!email || !password || !fullName) {
      throw new HttpError(400, "Email, password, dan nama lengkap wajib diisi");
    }

    if (password.length < 8) {
      throw new HttpError(400, "Password minimal 8 karakter");
    }

    if (role !== "cashier" && role !== "manager") {
      throw new HttpError(400, "Role staf hanya cashier atau manager");
    }

    const supabase = getSupabaseServerClient();

    const { data: createdUser, error: createUserError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (createUserError || !createdUser.user) {
      throw new HttpError(400, createUserError?.message || "Gagal membuat akun auth user");
    }

    const { error: profileError } = await supabase.from("profiles").insert({
      id: createdUser.user.id,
      tenant_id: owner.tenantId,
      role,
      full_name: fullName,
      is_active: true
    });

    if (profileError) {
      await supabase.auth.admin.deleteUser(createdUser.user.id);
      throw new HttpError(400, profileError.message || "Gagal menyimpan profil staf");
    }

    const user: ManagedUserDto = {
      id: createdUser.user.id,
      email,
      fullName,
      role,
      isActive: true,
      createdAt: new Date().toISOString()
    };

    return jsonResponse({ ok: true, user }, 201);
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonResponse({ ok: false, message: err.message }, err.status);
    }
    return jsonResponse({ ok: false, message: "Internal server error" }, 500);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const owner = await parseOwnerContext(request);
    const body = await request.json();

    const userId = String(body.userId ?? "").trim();
    const fullName = body.fullName !== undefined ? String(body.fullName).trim() : undefined;
    const role = body.role !== undefined ? String(body.role).trim().toLowerCase() : undefined;
    const isActive = body.isActive !== undefined ? Boolean(body.isActive) : undefined;

    if (!userId) {
      throw new HttpError(400, "userId wajib diisi");
    }

    const supabase = getSupabaseServerClient();

    const { data: targetProfile, error: targetError } = await supabase
      .from("profiles")
      .select("id, role, full_name, is_active, created_at")
      .eq("id", userId)
      .eq("tenant_id", owner.tenantId)
      .in("role", ["cashier", "manager"])
      .maybeSingle();

    if (targetError || !targetProfile) {
      throw new HttpError(404, "Akun staf tidak ditemukan");
    }

    const updatePayload: {
      role?: ManagedUserRole;
      full_name?: string;
      is_active?: boolean;
    } = {};

    if (role !== undefined) {
      if (role !== "cashier" && role !== "manager") {
        throw new HttpError(400, "Role staf hanya cashier atau manager");
      }
      updatePayload.role = role;
    }

    if (fullName !== undefined && fullName.length > 0) {
      updatePayload.full_name = fullName;
    }

    if (isActive !== undefined) {
      updatePayload.is_active = isActive;
    }

    if (Object.keys(updatePayload).length === 0) {
      throw new HttpError(400, "Tidak ada perubahan data");
    }

    const { data: updated, error: updateError } = await supabase
      .from("profiles")
      .update(updatePayload)
      .eq("id", userId)
      .eq("tenant_id", owner.tenantId)
      .select("id, role, full_name, is_active, created_at")
      .maybeSingle();

    if (updateError || !updated) {
      throw new HttpError(400, updateError?.message || "Gagal mengubah profil staf");
    }

    const mappedUsers = await mapProfilesToManagedUsers([updated]);
    return jsonResponse({ ok: true, user: mappedUsers[0] });
  } catch (err) {
    if (err instanceof HttpError) {
      return jsonResponse({ ok: false, message: err.message }, err.status);
    }
    return jsonResponse({ ok: false, message: "Internal server error" }, 500);
  }
}
