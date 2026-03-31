import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { hashPassword, verifyPassword } from "./crypto";
import { authUserStoredSchema, type AuthRole, type AuthUserStored } from "./types";
import { requireInstantAdminClient } from "@/lib/instant/server";

const registerInputSchema = z.object({
  email: z.email().transform((value) => value.trim().toLowerCase()),
  password: z.string().min(8, "La contrasena debe tener al menos 8 caracteres"),
});

const dbUserRowSchema = z.object({
  id: z.string(),
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

async function listRawUsers() {
  const db = requireInstantAdminClient();
  const result = await db.query({ users_profile: {} });
  const rows = z.array(dbUserRowSchema).safeParse((result as { users_profile?: unknown }).users_profile ?? []);
  if (!rows.success) {
    throw new Error("users_profile devolvio filas invalidas en InstantDB.");
  }
  return rows.data;
}

export async function readUsers(): Promise<AuthUserStored[]> {
  const rows = await listRawUsers();
  return rows
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map(fromDbRow);
}

export async function findUserByEmail(email: string) {
  const normalized = email.trim().toLowerCase();
  const rows = await listRawUsers();
  const match = rows.find((row) => row.email === normalized);
  if (!match) return null;
  return fromDbRow(match);
}

export async function createUser(input: unknown) {
  const parsed = registerInputSchema.parse(input);

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

  const db = requireInstantAdminClient();
  await db.transact(
    db.tx.users_profile[newUser.id].update({
      email: newUser.email,
      password_hash: newUser.passwordHash,
      role: newUser.role,
      created_at: newUser.createdAt,
    }),
  );

  return newUser;
}

export async function verifyUserCredentials(input: unknown) {
  const parsed = registerInputSchema.parse(input);
  const user = await findUserByEmail(parsed.email);
  if (!user) return null;

  const validPassword = await verifyPassword(parsed.password, user.passwordHash);
  if (!validPassword) return null;
  return user;
}
