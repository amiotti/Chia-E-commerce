import { NextResponse } from "next/server";
import { maskSecret, readInstantEnv } from "@/lib/env.server";
import { denyInProductionRoute } from "@/lib/security/request";
import { getInstantHealthSnapshot, requireInstantAdminClient } from "@/lib/instant/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type TableCheck = {
  ok: boolean;
  count: number | null;
  error: string | null;
};

async function getTableCount(table: string): Promise<TableCheck> {
  try {
    const db = requireInstantAdminClient();
    const result = await db.query({ [table]: {} });
    const rows = (result as Record<string, unknown>)[table];
    if (!Array.isArray(rows)) {
      return { ok: false, count: null, error: "La consulta no devolvio un array." };
    }
    return { ok: true, count: rows.length, error: null };
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

  const instantEnv = readInstantEnv();
  const health = getInstantHealthSnapshot();

  const [usersProfile, products, carts, orders, payments, loyaltyWallets, loyaltyTransactions, loyaltyRedemptions] = await Promise.all([
    getTableCount("users_profile"),
    getTableCount("products"),
    getTableCount("carts"),
    getTableCount("orders"),
    getTableCount("payments"),
    getTableCount("loyalty_wallets"),
    getTableCount("loyalty_transactions"),
    getTableCount("loyalty_redemptions"),
  ]);

  return NextResponse.json(
    {
      etapa: 7,
      descripcion: "QA + diagnosticos finales (InstantDB, pagos, webhooks, entidades y configuracion).",
      instantdb: {
        configuradoPublico: instantEnv.status.configuredPublic,
        configuradoAdmin: instantEnv.status.configuredAdmin,
        issues: instantEnv.status.issues,
        appIdMasked: maskSecret(instantEnv.data?.NEXT_PUBLIC_INSTANT_APP_ID),
        adminTokenMasked: maskSecret(instantEnv.data?.INSTANT_APP_ADMIN_TOKEN),
        apiUri: instantEnv.data?.INSTANT_API_URI ?? null,
        health,
      },
      entidades: {
        users_profile: usersProfile,
        products,
        carts,
        orders,
        payments,
        loyalty_wallets: loyaltyWallets,
        loyalty_transactions: loyaltyTransactions,
        loyalty_redemptions: loyaltyRedemptions,
      },
      pagos: readPaymentsEnv(),
      recomendaciones: [
        !process.env.MERCADOPAGO_WEBHOOK_SECRET?.trim()
          ? "Configurar MERCADOPAGO_WEBHOOK_SECRET antes de produccion."
          : null,
        !process.env.GALIOPAY_WEBHOOK_SECRET?.trim()
          ? "Configurar GALIOPAY_WEBHOOK_SECRET antes de produccion."
          : null,
        !instantEnv.status.configuredAdmin ? "Verificar INSTANT_APP_ADMIN_TOKEN en apps/web/.env.local." : null,
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
