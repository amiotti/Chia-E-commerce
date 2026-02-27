import { NextResponse } from "next/server";
import { buildSessionPayload, setSessionCookie } from "@/lib/auth/session";
import { registerWithSupabaseAuth } from "@/lib/auth/supabase-auth";
import { rateLimit, requireSameOriginMutation, sanitizeRedirectPath } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const originCheck = requireSameOriginMutation(request);
  if (originCheck) return originCheck;

  const limited = rateLimit(request, { namespace: "auth:register", limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  const formData = await request.formData();
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const redirectTo = sanitizeRedirectPath(String(formData.get("redirectTo") ?? "/cuenta"), "/cuenta");

  try {
    const user = await registerWithSupabaseAuth({ email, password });
    await setSessionCookie(buildSessionPayload(user));

    const url = new URL(redirectTo || "/cuenta", request.url);
    url.searchParams.set("registro", "ok");
    if (user.role === "admin") {
      url.searchParams.set("rol", "admin");
    }
    return NextResponse.redirect(url, { status: 303 });
  } catch (error) {
    const registerUrl = new URL("/cuenta/registro", request.url);
    registerUrl.searchParams.set("error", error instanceof Error ? error.message : "No se pudo registrar");
    if (redirectTo) registerUrl.searchParams.set("redirectTo", redirectTo);
    return NextResponse.redirect(registerUrl, { status: 303 });
  }
}