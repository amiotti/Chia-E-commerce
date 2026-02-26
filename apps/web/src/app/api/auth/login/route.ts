import { NextResponse } from "next/server";
import { buildSessionPayload, setSessionCookie } from "@/lib/auth/session";
import { loginWithSupabaseAuth } from "@/lib/auth/supabase-auth";
import { rateLimit } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const limited = rateLimit(request, { namespace: "auth:login", limit: 8, windowMs: 60_000 });
  if (limited) return limited;

  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = String(formData.get("redirectTo") ?? "/cuenta");

  const user = await loginWithSupabaseAuth({ email, password });
  if (!user) {
    const url = new URL("/cuenta/login", request.url);
    url.searchParams.set("error", "Credenciales inválidas.");
    if (redirectTo) url.searchParams.set("redirectTo", redirectTo);
    return NextResponse.redirect(url, { status: 303 });
  }

  await setSessionCookie(buildSessionPayload(user));
  const url = new URL(redirectTo || "/cuenta", request.url);
  url.searchParams.set("login", "ok");
  return NextResponse.redirect(url, { status: 303 });
}