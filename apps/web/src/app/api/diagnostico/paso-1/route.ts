import { productosSeed } from "@chia/shared";
import { NextResponse } from "next/server";
import { maskSecret, readSupabaseEnv } from "@/lib/env.server";
import { getSupabaseHealthSnapshot } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, status } = readSupabaseEnv();
  const health = getSupabaseHealthSnapshot();

  return NextResponse.json(
    {
      etapa: 1,
      descripcion: "Schemas compartidos + semilla validada + clientes Supabase preparados.",
      supabase: {
        configuradoPublico: status.configuredPublic,
        configuradoServidor: status.configuredServer,
        issues: status.issues,
        url: data?.NEXT_PUBLIC_SUPABASE_URL ?? null,
        anonKeyMasked: maskSecret(data?.NEXT_PUBLIC_SUPABASE_ANON_KEY),
        serviceKeyMasked: maskSecret(data?.SUPABASE_SERVICE_ROLE_KEY),
      },
      catalogoSeed: {
        total: productosSeed.length,
        slugs: productosSeed.map((producto) => producto.slug),
      },
      health,
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