"use client";

import type { Producto } from "@chia/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { enrichCartItems, useCart } from "./CartProvider";

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function CheckoutClient({ products }: { products: Producto[] }) {
  const router = useRouter();
  const { items, clearCart } = useCart();
  const enriched = useMemo(() => enrichCartItems(items, products), [items, products]);
  const totalCents = enriched.reduce((sum, item) => sum + item.subtotalCents, 0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    if (enriched.length === 0) {
      setError("El carrito está vacío.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    setSubmitting(true);

    try {
      const payload = {
        items: enriched.map((item) => ({ productId: item.productId, qty: item.qty })),
        shipping: {
          nombreCompleto: String(formData.get("nombreCompleto") ?? ""),
          email: String(formData.get("email") ?? ""),
          telefono: String(formData.get("telefono") ?? ""),
          direccion: String(formData.get("direccion") ?? ""),
          ciudad: String(formData.get("ciudad") ?? ""),
          provincia: String(formData.get("provincia") ?? ""),
          codigoPostal: String(formData.get("codigoPostal") ?? ""),
          notas: String(formData.get("notas") ?? ""),
        },
      };

      const response = await fetch("/api/ordenes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "No se pudo crear la orden");
      }

      clearCart();
      router.push(`/ordenes/${data.order.id}?creada=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
      <section className="panel-surface rounded-3xl border border-[#587055]/15 p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-[#587055]">Checkout</p>
        <h1 className="font-brand mt-1 text-4xl leading-tight text-[#0B3816] sm:text-5xl">Datos de compra</h1>
        <p className="mt-2 text-sm text-[#0B3816]/75">
          Paso 4: se crea la orden con estado <strong>PENDIENTE_PAGO</strong>. El pago real se integra en Paso 5.
        </p>

        {error ? (
          <div className="mt-4 rounded-2xl border border-[#B8858E]/35 bg-[#B8858E]/12 px-4 py-3 text-sm text-[#0B3816]">
            {error}
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nombreCompleto" className="mb-1 block text-sm font-medium text-[#0B3816]">
                Nombre completo
              </label>
              <input id="nombreCompleto" name="nombreCompleto" required className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/85 px-4 py-2.5 text-sm outline-none focus:border-[#587055]" />
            </div>
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-[#0B3816]">
                Email
              </label>
              <input id="email" name="email" type="email" required className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/85 px-4 py-2.5 text-sm outline-none focus:border-[#587055]" />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="telefono" className="mb-1 block text-sm font-medium text-[#0B3816]">Teléfono</label>
              <input id="telefono" name="telefono" className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/85 px-4 py-2.5 text-sm outline-none focus:border-[#587055]" />
            </div>
            <div>
              <label htmlFor="codigoPostal" className="mb-1 block text-sm font-medium text-[#0B3816]">Código postal</label>
              <input id="codigoPostal" name="codigoPostal" className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/85 px-4 py-2.5 text-sm outline-none focus:border-[#587055]" />
            </div>
          </div>

          <div>
            <label htmlFor="direccion" className="mb-1 block text-sm font-medium text-[#0B3816]">Dirección</label>
            <input id="direccion" name="direccion" className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/85 px-4 py-2.5 text-sm outline-none focus:border-[#587055]" />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ciudad" className="mb-1 block text-sm font-medium text-[#0B3816]">Ciudad</label>
              <input id="ciudad" name="ciudad" className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/85 px-4 py-2.5 text-sm outline-none focus:border-[#587055]" />
            </div>
            <div>
              <label htmlFor="provincia" className="mb-1 block text-sm font-medium text-[#0B3816]">Provincia</label>
              <input id="provincia" name="provincia" className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/85 px-4 py-2.5 text-sm outline-none focus:border-[#587055]" />
            </div>
          </div>

          <div>
            <label htmlFor="notas" className="mb-1 block text-sm font-medium text-[#0B3816]">Notas</label>
            <textarea id="notas" name="notas" rows={3} className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/85 px-4 py-2.5 text-sm outline-none focus:border-[#587055]" />
          </div>

          <button
            type="submit"
            disabled={submitting || enriched.length === 0}
            className="rounded-2xl bg-[#0B3816] px-4 py-2.5 text-sm font-medium text-[#F0ECDF] hover:bg-[#587055] disabled:opacity-60"
          >
            {submitting ? "Creando orden..." : "Crear orden pendiente de pago"}
          </button>
        </form>
      </section>

      <aside className="panel-surface h-fit rounded-3xl border border-[#587055]/15 p-5">
        <h2 className="font-brand text-2xl text-[#0B3816]">Resumen</h2>
        {enriched.length === 0 ? (
          <div className="mt-3 rounded-xl border border-[#587055]/10 bg-white/70 p-4 text-sm text-[#0B3816]/75">
            El carrito está vacío.{" "}
            <Link href="/catalogo" className="text-[#587055] underline underline-offset-4">
              Ir al catálogo
            </Link>
          </div>
        ) : (
          <>
            <div className="mt-3 space-y-2">
              {enriched.map((item) => (
                <div key={item.productId} className="flex items-start justify-between gap-3 rounded-xl border border-[#587055]/10 bg-white/70 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#0B3816]">{item.product.nombre}</p>
                    <p className="text-xs text-[#587055]">{item.qty} x {arsFormatter.format(item.product.precioCents / 100)}</p>
                  </div>
                  <span className="text-sm text-[#0B3816]">{arsFormatter.format(item.subtotalCents / 100)}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#587055]/10 pt-3 text-sm">
              <span className="font-medium text-[#0B3816]">Total</span>
              <span className="font-semibold text-[#0B3816]">{arsFormatter.format(totalCents / 100)}</span>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
