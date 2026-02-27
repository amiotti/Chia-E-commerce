import { NextResponse } from "next/server";
import { maskSecret, readSupabaseEnv } from "@/lib/env.server";
import { denyInProductionRoute } from "@/lib/security/request";
import { getSupabaseHealthSnapshot, requireSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TableCheck = {
  ok: boolean;
  count: number | null;
  error: string | null;
};

async function getTableCount(table: string): Promise<TableCheck> {
  try {
    const client = requireSupabaseServiceClient() as any;
    const { count, error } = await client.from(table).select("*", { head: true, count: "exact" });
    if (error) {
      return { ok: false, count: null, error: error.message };
    }
    return { ok: true, count: typeof count === "number" ? count : 0, error: null };
  } catch (error) {
    return {
      ok: false,
      count: null,
      error: error instanceof Error ? error.message : `No se pudo consultar ${table}`,
    };
  }
}

function readPaymentsEnv() {
  const mpPublic = process.env.NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY?.trim() || "";
  const mpAccess = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim() || "";
  const galioClientId = process.env.GALIOPAY_CLIENT_ID?.trim() || "";
  const galioBase = process.env.GALIOPAY_API_BASE_URL?.trim() || "";
  const galioKey = process.env.GALIOPAY_API_KEY?.trim() || "";

  return {
    mercadopago: {
      publicKeyMasked: maskSecret(mpPublic),
      accessTokenMasked: maskSecret(mpAccess),
      webhookSecretConfigured: Boolean(process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim()),
      configured: Boolean(mpPublic && mpAccess),
    },
    galiopay: {
      clientIdMasked: maskSecret(galioClientId),
      apiBaseUrl: galioBase || null,
      apiKeyMasked: maskSecret(galioKey),
      webhookSecretConfigured: Boolean(process.env.GALIOPAY_WEBHOOK_SECRET?.trim()),
      configured: Boolean(galioClientId && galioBase && galioKey),
    },
  };
}

export async function GET() {
  const blocked = denyInProductionRoute();
  if (blocked) return blocked;

  const supabaseEnv = readSupabaseEnv();
  const health = getSupabaseHealthSnapshot();

  const [usersProfile, products, carts, orders, payments] = await Promise.all([
    getTableCount("users_profile"),
    getTableCount("products"),
    getTableCount("carts"),
    getTableCount("orders"),
    getTableCount("payments"),
  ]);

  return NextResponse.json(
    {
      etapa: 7,
      descripcion: "QA + diagnósticos finales (DB, pagos, webhooks, tablas y configuración).",
      supabase: {
        configuradoPublico: supabaseEnv.status.configuredPublic,
        configuradoServidor: supabaseEnv.status.configuredServer,
        issues: supabaseEnv.status.issues,
        url: supabaseEnv.data?.NEXT_PUBLIC_SUPABASE_URL ?? null,
        anonKeyMasked: maskSecret(supabaseEnv.data?.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        serviceKeyMasked: maskSecret(supabaseEnv.data?.SUPABASE_SERVICE_ROLE_KEY),
        health,
      },
      tablas: {
        users_profile: usersProfile,
        products,
        carts,
        orders,
        payments,
      },
      pagos: readPaymentsEnv(),
      recomendaciones: [
        !process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim()
          ? "Configurar MERCADOPAGO_WEBHOOK_SECRET antes de producción."
          : null,
        !process.env.GALIOPAY_WEBHOOK_SECRET?.trim()
          ? "Configurar GALIOPAY_WEBHOOK_SECRET antes de producción."
          : null,
        !supabaseEnv.status.configuredServer ? "Verificar SUPABASE_SERVICE_ROLE_KEY en apps/web/.env.local." : null,
      ].filter(Boolean),
      checkedAt: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/json; charset=utf-8",
      },
    },
  );
}