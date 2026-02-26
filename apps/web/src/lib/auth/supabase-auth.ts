import "server-only";
import { z } from "zod";
import { authUserStoredSchema, type AuthRole, type AuthUserStored } from "./types";
import { createSupabaseAnonServerClient, requireSupabaseServiceClient } from "@/lib/supabase/server";

const credentialsSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

const profileRowSchema = z.object({
  id: z.string(),
  email: z.email(),
  password_hash: z.string().nullable().optional(),
  role: z.enum(["user", "admin"]),
  created_at: z.string(),
});

function profileRowToStoredUser(row: z.infer<typeof profileRowSchema>): AuthUserStored {
  return authUserStoredSchema.parse({
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash ?? "__supabase_auth__",
    role: row.role,
    createdAt: row.created_at,
  });
}

async function getProfileByUserId(userId: string) {
  const client = requireSupabaseServiceClient() as any;
  const { data, error } = await client
    .from("users_profile")
    .select("id, email, password_hash, role, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Error leyendo users_profile por id: ${error.message}`);
  }
  if (!data) return null;
  return profileRowToStoredUser(profileRowSchema.parse(data));
}

async function countProfiles() {
  const client = requireSupabaseServiceClient() as any;
  const { count, error } = await client.from("users_profile").select("*", { head: true, count: "exact" });
  if (error) throw new Error(`Error contando users_profile: ${error.message}`);
  return typeof count === "number" ? count : 0;
}

async function createProfileForAuthUser(params: { id: string; email: string; role: AuthRole }) {
  const client = requireSupabaseServiceClient() as any;
  const now = new Date().toISOString();
  const { data, error } = await client
    .from("users_profile")
    .insert({
      id: params.id,
      email: params.email,
      password_hash: "__supabase_auth__",
      role: params.role,
      created_at: now,
    })
    .select("id, email, password_hash, role, created_at")
    .single();

  if (error) {
    throw new Error(`Error creando perfil users_profile: ${error.message}`);
  }
  return profileRowToStoredUser(profileRowSchema.parse(data));
}

async function ensureProfileForAuthUser(params: { id: string; email: string }) {
  const existing = await getProfileByUserId(params.id);
  if (existing) return existing;
  const total = await countProfiles();
  const role: AuthRole = total === 0 ? "admin" : "user";
  return createProfileForAuthUser({ ...params, role });
}

export async function registerWithSupabaseAuth(input: unknown) {
  const parsed = credentialsSchema.parse(input);
  const service = requireSupabaseServiceClient() as any;

  const created = await service.auth.admin.createUser({
    email: parsed.email,
    password: parsed.password,
    email_confirm: true,
  });

  if (created.error) {
    throw new Error(created.error.message || "No se pudo registrar usuario en Supabase Auth");
  }

  const authUser = created.data.user;
  if (!authUser?.id || !authUser.email) {
    throw new Error("Supabase Auth no devolvió el usuario creado.");
  }

  const profile = await ensureProfileForAuthUser({ id: authUser.id, email: authUser.email });
  return profile;
}

export async function loginWithSupabaseAuth(input: unknown) {
  const parsed = credentialsSchema.parse(input);
  const anon = createSupabaseAnonServerClient();
  if (!anon) {
    throw new Error("Supabase no está configurado para login (faltan variables públicas).");
  }

  const result = await anon.auth.signInWithPassword({
    email: parsed.email,
    password: parsed.password,
  });

  if (result.error || !result.data.user?.id || !result.data.user.email) {
    return null;
  }

  return ensureProfileForAuthUser({
    id: result.data.user.id,
    email: result.data.user.email,
  });
}

