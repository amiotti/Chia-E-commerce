"use client";

import type { Producto } from "@chia/shared";
import { useState, useTransition } from "react";

type AdminProductosResponse = {
  items: Producto[];
  total: number;
};

const initialManualForm = {
  slug: "",
  nombre: "",
  descripcion: "",
  precioPesos: "",
  moneda: "ARS",
  imagenes: "",
  stock: "",
  categoria: "",
  tags: "",
  activo: true,
};

export default function AdminProductosPanel({ initialItems }: { initialItems: Producto[] }) {
  const [items, setItems] = useState<Producto[]>(initialItems);
  const [manualForm, setManualForm] = useState(initialManualForm);
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [importMode, setImportMode] = useState<"merge" | "replace">("merge");
  const [importFile, setImportFile] = useState<File | null>(null);

  async function refreshProductos() {
    const response = await fetch("/api/admin/productos", { cache: "no-store" });
    const data = (await response.json()) as AdminProductosResponse;
    setItems(data.items ?? []);
  }

  function clearAlerts() {
    setMensaje(null);
    setError(null);
  }

  async function handleManualSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearAlerts();

    startTransition(async () => {
      try {
        const response = await fetch("/api/admin/productos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...manualForm,
            precioCents: Number(manualForm.precioPesos),
            stock: Number(manualForm.stock),
            imagenes: manualForm.imagenes.split(/[|;,]/g).map((v) => v.trim()).filter(Boolean),
            tags: manualForm.tags.split(/[|;,]/g).map((v) => v.trim()).filter(Boolean),
          }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error ?? "No se pudo crear el producto");

        setMensaje(`Producto creado: ${data.producto.nombre}`);
        setManualForm(initialManualForm);
        await refreshProductos();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  async function handleImportSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearAlerts();
    if (!importFile) {
      setError("Seleccioná un archivo .json o .csv para importar.");
      return;
    }

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set("file", importFile);
        formData.set("mode", importMode);

        const response = await fetch("/api/admin/productos/import", { method: "POST", body: formData });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error ?? "No se pudo importar el archivo");

        setMensaje(
          `Importación ${data.result.mode}: ${data.result.importedCount} producto(s). Total en Supabase: ${data.result.totalAfter}.`,
        );
        setImportFile(null);
        const input = document.getElementById("archivo-productos") as HTMLInputElement | null;
        if (input) input.value = "";
        await refreshProductos();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado");
      }
    });
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
      <section className="panel-surface rounded-3xl border border-[#587055]/15 p-5">
        <div className="mb-4">
          <p className="text-xs uppercase tracking-[0.24em] text-[#587055]">Importación por archivo</p>
          <h2 className="font-brand text-3xl leading-tight text-[#0B3816]">Agregar producto</h2>
          <p className="mt-2 text-sm text-[#0B3816]/75">
            Guarda productos directamente en Supabase (`public.products`).
          </p>
        </div>

        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="slug" className="mb-1 block text-sm font-medium text-[#0B3816]">Slug</label>
              <input id="slug" value={manualForm.slug} onChange={(e) => setManualForm((p) => ({ ...p, slug: e.target.value }))} className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/85 px-4 py-2.5 text-sm outline-none focus:border-[#587055]" required />
            </div>
            <div>
              <label htmlFor="categoria" className="mb-1 block text-sm font-medium text-[#0B3816]">Categoría</label>
              <input id="categoria" value={manualForm.categoria} onChange={(e) => setManualForm((p) => ({ ...p, categoria: e.target.value }))} className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/85 px-4 py-2.5 text-sm outline-none focus:border-[#587055]" required />
            </div>
          </div>

          <div>
            <label htmlFor="nombre" className="mb-1 block text-sm font-medium text-[#0B3816]">Nombre</label>
            <input id="nombre" value={manualForm.nombre} onChange={(e) => setManualForm((p) => ({ ...p, nombre: e.target.value }))} className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/85 px-4 py-2.5 text-sm outline-none focus:border-[#587055]" required />
          </div>

          <div>
            <label htmlFor="descripcion" className="mb-1 block text-sm font-medium text-[#0B3816]">Descripción</label>
            <textarea id="descripcion" value={manualForm.descripcion} onChange={(e) => setManualForm((p) => ({ ...p, descripcion: e.target.value }))} rows={4} className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/85 px-4 py-2.5 text-sm outline-none focus:border-[#587055]" required />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="precioPesos" className="mb-1 block text-sm font-medium text-[#0B3816]">Precio (pesos)</label>
              <input id="precioPesos" type="number" min={0} value={manualForm.precioPesos} onChange={(e) => setManualForm((p) => ({ ...p, precioPesos: e.target.value }))} className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/85 px-4 py-2.5 text-sm outline-none focus:border-[#587055]" required />
            </div>
            <div>
              <label htmlFor="stock" className="mb-1 block text-sm font-medium text-[#0B3816]">Stock</label>
              <input id="stock" type="number" min={0} value={manualForm.stock} onChange={(e) => setManualForm((p) => ({ ...p, stock: e.target.value }))} className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/85 px-4 py-2.5 text-sm outline-none focus:border-[#587055]" required />
            </div>
            <div>
              <label htmlFor="moneda" className="mb-1 block text-sm font-medium text-[#0B3816]">Moneda</label>
              <input id="moneda" value={manualForm.moneda} onChange={(e) => setManualForm((p) => ({ ...p, moneda: e.target.value }))} className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/85 px-4 py-2.5 text-sm outline-none focus:border-[#587055]" required />
            </div>
          </div>

          <div>
            <label htmlFor="imagenes" className="mb-1 block text-sm font-medium text-[#0B3816]">Imágenes (URLs separadas por `|`)</label>
            <input id="imagenes" value={manualForm.imagenes} onChange={(e) => setManualForm((p) => ({ ...p, imagenes: e.target.value }))} className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/85 px-4 py-2.5 text-sm outline-none focus:border-[#587055]" />
          </div>

          <div>
            <label htmlFor="tags" className="mb-1 block text-sm font-medium text-[#0B3816]">Tags (separados por `|`)</label>
            <input id="tags" value={manualForm.tags} onChange={(e) => setManualForm((p) => ({ ...p, tags: e.target.value }))} className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/85 px-4 py-2.5 text-sm outline-none focus:border-[#587055]" />
          </div>

          <label className="flex items-center gap-2 text-sm text-[#0B3816]">
            <input type="checkbox" checked={manualForm.activo} onChange={(e) => setManualForm((p) => ({ ...p, activo: e.target.checked }))} className="h-4 w-4" />
            Producto activo
          </label>

          <button type="submit" disabled={isPending} className="rounded-2xl bg-[#0B3816] px-4 py-2.5 text-sm font-medium text-[#F0ECDF] hover:bg-[#587055] disabled:opacity-60">
            {isPending ? "Guardando..." : "Guardar producto"}
          </button>
        </form>
      </section>

      <div className="space-y-5">
        <section className="panel-surface rounded-3xl border border-[#587055]/15 p-5">
          <div className="mb-4">
            <p className="text-xs uppercase tracking-[0.24em] text-[#587055]">Importación por archivo</p>
            <h2 className="font-brand text-3xl leading-tight text-[#0B3816]">Cargar listado</h2>
            <p className="mt-2 text-sm text-[#0B3816]/75">Soporta `.json` (array) y `.csv`.</p>
          </div>

          <form onSubmit={handleImportSubmit} className="space-y-4">
            <div>
              <label htmlFor="archivo-productos" className="mb-1 block text-sm font-medium text-[#0B3816]">Archivo</label>
              <input id="archivo-productos" type="file" accept=".json,.csv" onChange={(e) => setImportFile(e.target.files?.[0] ?? null)} className="block w-full rounded-2xl border border-[#8BA37D]/45 bg-white/85 px-4 py-2.5 text-sm" />
            </div>
            <div>
              <label htmlFor="modo-importacion" className="mb-1 block text-sm font-medium text-[#0B3816]">Modo</label>
              <select id="modo-importacion" value={importMode} onChange={(e) => setImportMode(e.target.value === "replace" ? "replace" : "merge")} className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/85 px-4 py-2.5 text-sm outline-none focus:border-[#587055]">
                <option value="merge">Merge (por slug)</option>
                <option value="replace">Replace (reemplaza productos existentes)</option>
              </select>
            </div>
            <button type="submit" disabled={isPending} className="rounded-2xl bg-[#0B3816] px-4 py-2.5 text-sm font-medium text-[#F0ECDF] hover:bg-[#587055] disabled:opacity-60">
              {isPending ? "Importando..." : "Importar archivo"}
            </button>
          </form>

          <div className="mt-5 rounded-2xl border border-[#B8858E]/25 bg-[#B8858E]/10 p-4 text-sm text-[#0B3816]/85">
            <p className="font-medium">CSV esperado:</p>
            <code className="mt-2 block overflow-x-auto rounded-xl bg-white/70 p-3 text-xs">
              slug,nombre,descripcion,precioPesos,moneda,imagenes,stock,categoria,tags,activo
            </code>
            <p className="mt-2 text-xs text-[#587055]">`imagenes` y `tags`: separadores `|`, `;` o `,`.</p>
          </div>
        </section>

        <section className="panel-surface rounded-3xl border border-[#587055]/15 p-5">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-[#587055]">Importación por archivo</p>
              <h2 className="font-brand text-2xl leading-tight text-[#0B3816]">{items.length} cargado(s)</h2>
            </div>
            <button type="button" onClick={() => void refreshProductos()} className="rounded-xl border border-[#587055]/20 bg-white/70 px-3 py-2 text-sm text-[#0B3816] hover:bg-[#F0ECDF]">
              Refrescar
            </button>
          </div>

          {mensaje ? <div className="mb-3 rounded-xl border border-[#8BA37D]/30 bg-[#8BA37D]/12 px-3 py-2 text-sm text-[#0B3816]">{mensaje}</div> : null}
          {error ? <div className="mb-3 rounded-xl border border-[#B8858E]/35 bg-[#B8858E]/12 px-3 py-2 text-sm text-[#0B3816]">{error}</div> : null}

          <div className="max-h-[28rem] space-y-2 overflow-auto pr-1">
            {items.length === 0 ? (
              <p className="text-sm text-[#0B3816]/70">Todavía no hay productos cargados en Supabase.</p>
            ) : (
              items.map((item) => (
                <div key={item.id} className="rounded-2xl border border-[#587055]/10 bg-white/70 px-3 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-[#0B3816]">{item.nombre}</p>
                      <p className="text-xs text-[#587055]">{item.slug} · {item.categoria}</p>
                    </div>
                    <span className="rounded-full bg-[#F0ECDF] px-2 py-0.5 text-xs text-[#587055]">{item.stock} u.</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
