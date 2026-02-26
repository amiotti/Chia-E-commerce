import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { importAdminProductos, type ImportMode } from "@/lib/catalogo/admin-store";
import { parseProductosImportFile } from "@/lib/catalogo/import-parser";
import { rateLimit, requireSameOriginMutation } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const originCheck = requireSameOriginMutation(request);
  if (originCheck) return originCheck;
  const limited = rateLimit(request, { namespace: "admin:productos:import", limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireAdminApi();
  if (!auth.ok) return auth.response;
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const modeRaw = formData.get("mode");
    const mode: ImportMode = modeRaw === "replace" ? "replace" : "merge";

    if (!(file instanceof File)) {
      return NextResponse.json(
        { ok: false, error: "Debés adjuntar un archivo (.json o .csv)." },
        { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } },
      );
    }

    const text = await file.text();
    const productos = parseProductosImportFile(file.name, text);
    const result = await importAdminProductos(productos, mode);

    return NextResponse.json({ ok: true, result }, { headers: { "Content-Type": "application/json; charset=utf-8" } });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Error al importar productos" },
      { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }
}
