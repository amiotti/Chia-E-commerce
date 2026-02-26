import { z } from "zod";

export const authRoleSchema = z.enum(["user", "admin"]);

export const authUserStoredSchema = z.object({
  id: z.string(),
  email: z.email(),
  passwordHash: z.string(),
  role: authRoleSchema,
  createdAt: z.string(),
});

export const authSessionPayloadSchema = z.object({
  userId: z.string(),
  email: z.email(),
  role: authRoleSchema,
  exp: z.number().int().positive(),
});

export type AuthRole = z.infer<typeof authRoleSchema>;
export type AuthUserStored = z.infer<typeof authUserStoredSchema>;
export type AuthSessionPayload = z.infer<typeof authSessionPayloadSchema>;
