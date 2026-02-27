"use client";

import type { Producto } from "@chia/shared";
import Image from "next/image";
import Link from "next/link";
import { enrichCartItems, useCart } from "./CartProvider";

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function CartPageClient({ products }: { products: Producto[] }) {
  const { items, setQty, removeItem, clearCart, totalUnits, initialized, session } = useCart();
  const enriched = enrichCartItems(items, products);
  const totalCents = enriched.reduce((sum, item) => sum + item.subtotalCents, 0);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
      <section className="panel-surface rounded-3xl border border-[#587055]/15 p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-[#587055]">Carrito</p>
            <h2 className="font-brand text-3xl leading-tight text-[#0B3816]">Resumen de compra</h2>
          </div>
          <button type="button" onClick={clearCart} className="rounded-xl border border-[#B8858E]/25 bg-[#B8858E]/10 px-3 py-2 text-sm text-[#0B3816] hover:bg-[#B8858E]/20">
            Vaciar
          </button>
        </div>

        {!initialized ? (
          <p className="text-sm text-[#587055]">Cargando carrito...</p>
        ) : enriched.length === 0 ? (
          <div className="rounded-2xl border border-[#587055]/10 bg-white/70 p-5">
            <p className="text-sm text-[#0B3816]/75">Tu carrito está vacío.</p>
            <Link href="/catalogo" className="mt-3 inline-flex rounded-2xl bg-[#0B3816] px-4 py-2.5 text-sm font-medium text-[#F0ECDF] hover:bg-[#587055]">
              Ir al catálogo
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {enriched.map((item) => (
              <article key={item.productId} className="rounded-2xl border border-[#587055]/10 bg-white/70 p-3">
                <div className="grid gap-3 sm:grid-cols-[5.5rem_1fr_auto] sm:items-center">
                  <div className="relative aspect-square overflow-hidden rounded-xl border border-[#587055]/10 bg-[#F0ECDF]">
                    <Image src={item.product.imagenes[0] ?? "/branding/logo-principal-verde.png"} alt={item.product.nombre} fill className="object-cover" />
                  </div>
                  <div>
                    <Link href={`/catalogo/${item.product.slug}`} className="font-brand text-xl text-[#0B3816] hover:text-[#587055]">
                      {item.product.nombre}
                    </Link>
                    <p className="text-sm text-[#587055]">{arsFormatter.format(item.product.precioCents)} c/u</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <label className="text-xs text-[#587055]">
                      Cantidad
                      <input
                        type="number"
                        min={1}
                        value={item.qty}
                        onChange={(e) => setQty(item.productId, Math.max(1, Number(e.target.value || 1)))}
                        className="mt-1 block w-20 rounded-xl border border-[#8BA37D]/45 bg-white px-3 py-1.5 text-sm text-[#0B3816]"
                      />
                    </label>
                    <p className="text-sm font-medium text-[#0B3816]">{arsFormatter.format(item.subtotalCents)}</p>
                    <button type="button" onClick={() => removeItem(item.productId)} className="text-xs text-[#B8858E] hover:underline">
                      Quitar
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <aside className="panel-surface h-fit rounded-3xl border border-[#587055]/15 p-5">
        <p className="text-xs uppercase tracking-[0.24em] text-[#587055]">Totales</p>
        <h2 className="font-brand mt-1 text-2xl text-[#0B3816]">Checkout</h2>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex justify-between gap-3 text-[#0B3816]/80">
            <span>Items distintos</span>
            <span>{enriched.length}</span>
          </div>
          <div className="flex justify-between gap-3 text-[#0B3816]/80">
            <span>Unidades</span>
            <span>{totalUnits}</span>
          </div>
          <div className="mt-2 flex justify-between gap-3 border-t border-[#587055]/10 pt-3 text-[#0B3816]">
            <span className="font-medium">Total</span>
            <span className="font-semibold">{arsFormatter.format(totalCents)}</span>
          </div>
        </div>

        {session ? (
          <p className="mt-4 rounded-xl border border-[#8BA37D]/30 bg-[#8BA37D]/10 px-3 py-2 text-xs text-[#0B3816]">
            Carrito sincronizado con tu sesión ({session.email}).
          </p>
        ) : (
          <p className="mt-4 rounded-xl border border-[#587055]/15 bg-white/70 px-3 py-2 text-xs text-[#0B3816]/75">
            Carrito local. Si iniciás sesión, se sincroniza automáticamente.
          </p>
        )}

        <Link
          href="/checkout"
          className={`mt-4 inline-flex w-full items-center justify-center rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
            enriched.length === 0
              ? "pointer-events-none border border-[#587055]/15 bg-white/60 text-[#587055]/60"
              : "bg-[#0B3816] text-[#F0ECDF] hover:bg-[#587055]"
          }`}
        >
          Continuar al checkout
        </Link>
      </aside>
    </div>
  );
}
