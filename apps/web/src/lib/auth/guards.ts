import "server-only";
import { NextResponse } from "next/server";
import { redirect } from "next/navigation";
import type { Order } from "@/lib/commerce/types";
import { getCurrentSession } from "./session";

export async function requireAdminPage(redirectTo?: string) {
  const session = await getCurrentSession();
  if (!session) {
    const target = redirectTo ? encodeURIComponent(redirectTo) : encodeURIComponent("/admin/productos");
    redirect(`/cuenta/login?redirectTo=${target}`);
  }
  if (session.role !== "admin") {
    redirect("/cuenta?error=forbidden");
  }
  return session;
}

export async function requireAuthPage(redirectTo?: string) {
  const session = await getCurrentSession();
  if (!session) {
    const target = redirectTo ? encodeURIComponent(redirectTo) : encodeURIComponent("/cuenta");
    redirect(`/cuenta/login?redirectTo=${target}`);
  }
  return session;
}

export async function requireAdminApi() {
  const session = await getCurrentSession();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: "No autenticado" },
        { status: 401, headers: { "Content-Type": "application/json; charset=utf-8" } },
      ),
    };
  }
  if (session.role !== "admin") {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: "No autorizado" },
        { status: 403, headers: { "Content-Type": "application/json; charset=utf-8" } },
      ),
    };
  }
  return { ok: true as const, session };
}

export async function requireAuthApi() {
  const session = await getCurrentSession();
  if (!session) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { ok: false, error: "No autenticado" },
        { status: 401, headers: { "Content-Type": "application/json; charset=utf-8" } },
      ),
    };
  }
  return { ok: true as const, session };
}

export function canAccessOrder(session: { userId: string; role: "user" | "admin" } | null, order: Order) {
  if (!session) return false;
  if (session.role === "admin") return true;
  return Boolean(order.userId) && order.userId === session.userId;
}