import { NextResponse } from "next/server";
import { clearSessionCookie } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  await clearSessionCookie();
  const formData = await request.formData().catch(() => null);
  const redirectTo = String(formData?.get("redirectTo") ?? "/cuenta/login");
  const url = new URL(redirectTo, request.url);
  url.searchParams.set("logout", "ok");
  return NextResponse.redirect(url, { status: 303 });
}
