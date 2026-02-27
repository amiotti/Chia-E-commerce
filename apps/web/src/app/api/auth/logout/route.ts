import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await clearSessionCookie();

  const url = new URL(request.url);
  const wantsJson = url.searchParams.get("mode") === "json" || request.headers.get("x-requested-with") === "fetch";
  if (wantsJson) {
    return NextResponse.json(
      { ok: true },
      { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } },
    );
  }

  const formData = await request.formData().catch(() => null);
  const redirectTo = String(formData?.get("redirectTo") ?? "/cuenta/login");
  const redirectUrl = new URL(redirectTo, request.url);
  redirectUrl.searchParams.set("logout", "ok");
  return NextResponse.redirect(redirectUrl, { status: 303 });
}