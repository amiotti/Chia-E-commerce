import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { hashPassword, verifyPassword } from "./crypto";
import { authUserStoredSchema, type AuthRole, type AuthUserStored } from "./types";
import { requireSupabaseServiceClient } from "@/lib/supabase/server";

const registerInputSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

const dbUserRowSchema = z.object({
  id: z.string().uuid().or(z.string()),
  email: z.email(),
  password_hash: z.string(),
  role: z.enum(["user", "admin"]),
  created_at: z.string(),
});

function fromDbRow(row: z.infer<typeof dbUserRowSchema>): AuthUserStored {
  return authUserStoredSchema.parse({
    id: row.id,
    email: row.email,
    passwordHash: row.password_hash,
    role: row.role,
    createdAt: row.created_at,
  });
}

export async function readUsers(): Promise<AuthUserStored[]> {
  const client = requireSupabaseServiceClient() as any;
  const { data, error } = await client
    .from("users_profile")
    .select("id, email, password_hash, role, created_at")
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(`Error leyendo users_profile en Supabase: ${error.message}`);
  }

  const parsed = z.array(dbUserRowSchema).safeParse(data ?? []);
  if (!parsed.success) {
    throw new Error("users_profile devolvió filas inválidas. Verificá la migración SQL (password_hash).\n");
  }

  return parsed.data.map(fromDbRow);
}

export async function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const client = requireSupabaseServiceClient() as any;
  const { data, error } = await client
    .from("users_profile")
    .select("id, email, password_hash, role, created_at")
    .eq("email", normalized)
    .maybeSingle();

  if (error) {
    throw new Error(`Error buscando usuario en Supabase: ${error.message}`);
  }
  if (!data) return null;

  const parsed = dbUserRowSchema.safeParse(data);
  if (!parsed.success) {
    throw new Error("Fila de users_profile inválida. Verificá la migración SQL (password_hash).\n");
  }

  return fromDbRow(parsed.data);
}

export async function createUser(input: unknown) {
  const parsed = registerInputSchema.parse(input);
  const client = requireSupabaseServiceClient() as any;

  const existing = await findUserByEmail(parsed.email);
  if (existing) {
    throw new Error("Ya existe un usuario registrado con ese email.");
  }

  const allUsers = await readUsers();
  const role: AuthRole = allUsers.length === 0 ? "admin" : "user";
  const passwordHash = await hashPassword(parsed.password);

  const newUser: AuthUserStored = authUserStoredSchema.parse({
    id: randomUUID(),
    email: parsed.email,
    passwordHash,
    role,
    createdAt: new Date().toISOString(),
  });

  const { data, error } = await client
    .from("users_profile")
    .insert({
      id: newUser.id,
      email: newUser.email,
      password_hash: newUser.passwordHash,
      role: newUser.role,
      created_at: newUser.createdAt,
    })
    .select("id, email, password_hash, role, created_at")
    .single();

  if (error) {
    throw new Error(`Error creando usuario en Supabase: ${error.message}`);
  }

  const inserted = dbUserRowSchema.parse(data);
  return fromDbRow(inserted);
}

export async function verifyUserCredentials(input: unknown) {
  const parsed = registerInputSchema.parse(input);
  const user = await findUserByEmail(parsed.email);
  if (!user) return null;

  const validPassword = await verifyPassword(parsed.password, user.passwordHash);
  if (!validPassword) return null;
  return user;
}