import { productosSeed } from "@chia/shared";
import { NextResponse } from "next/server";
import { maskSecret, readInstantEnv } from "@/lib/env.server";
import { requireInstantAdminClient, getInstantHealthSnapshot } from "@/lib/instant/server";
import { denyInProductionRoute } from "@/lib/security/request";

export const dynamic = "force-dynamic";

export async function GET() {
  const blocked = denyInProductionRoute();
  if (blocked) return blocked;

  const { data, status } = readInstantEnv();
  const health = getInstantHealthSnapshot();

  let productsReachable = false;
  let productsCount = 0;
  if (status.configuredAdmin) {
    try {
      const db = requireInstantAdminClient();
      const result = await db.query({ products: {} });
      productsCount = Array.isArray((result as { products?: unknown }).products)
        ? (result as { products: unknown[] }).products.length
        : 0;
      productsReachable = true;
    } catch {
      productsReachable = false;
    }
  }

  return NextResponse.json(
    {
      etapa: 1,
      descripcion: "Schemas compartidos + semilla validada + cliente InstantDB preparado.",
      instantdb: {
        configuradoPublico: status.configuredPublic,
        configuradoAdmin: status.configuredAdmin,
        issues: status.issues,
        appIdMasked: maskSecret(data?.NEXT_PUBLIC_INSTANT_APP_ID),
        adminTokenMasked: maskSecret(data?.INSTANT_APP_ADMIN_TOKEN),
        apiUri: data?.INSTANT_API_URI ?? null,
      },
      catalogoSeed: {
        total: productosSeed.length,
        slugs: productosSeed.map((producto) => producto.slug),
      },
      health: {
        ...health,
        productsReachable,
        productsCount,
      },
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
