import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { authSessionPayloadSchema, type AuthSessionPayload, type AuthUserStored } from "./types";

export const AUTH_SESSION_COOKIE = "chia_session";
const SESSION_TTL_SECONDS = 60 * 15;

function base64UrlEncode(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function getSessionSecret() {
  return process.env.SESSION_SECRET?.trim() || "dev-only-insecure-session-secret-change-me";
}

function sign(value: string) {
  return createHmac("sha256", getSessionSecret()).update(value).digest("base64url");
}

function serializeSessionPayload(payload: AuthSessionPayload) {
  const encoded = base64UrlEncode(JSON.stringify(payload));
  const signature = sign(encoded);
  return `${encoded}.${signature}`;
}

function parseAndVerifySession(rawCookie: string | undefined | null): AuthSessionPayload | null {
  if (!rawCookie) return null;
  const [encoded, signature] = rawCookie.split(".");
  if (!encoded || !signature) return null;

  const expectedSignature = sign(encoded);
  const received = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (received.length !== expected.length) return null;
  if (!timingSafeEqual(received, expected)) return null;

  try {
    const json = base64UrlDecode(encoded);
    const parsed = authSessionPayloadSchema.parse(JSON.parse(json));
    if (parsed.exp * 1000 <= Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function buildSessionPayload(user: AuthUserStored): AuthSessionPayload {
  return authSessionPayloadSchema.parse({
    userId: user.id,
    email: user.email,
    role: user.role,
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  });
}

export async function setSessionCookie(payload: AuthSessionPayload) {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_SESSION_COOKIE, serializeSessionPayload(payload), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  return parseAndVerifySession(cookieStore.get(AUTH_SESSION_COOKIE)?.value);
}