import Link from "next/link";
import CartPageClient from "@/components/cart/CartPageClient";
import { listCatalogoProductos } from "@/lib/catalogo/repository";

export const dynamic = "force-dynamic";

export default async function CarritoPage() {
  const catalogo = await listCatalogoProductos({});

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <div className="bg-grid-soft h-full w-full" />
      </div>
      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="panel-surface mb-5 rounded-3xl border border-[#587055]/15 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#587055]">Paso 4</p>
              <h1 className="font-brand text-4xl leading-tight text-[#0B3816] sm:text-5xl">Carrito</h1>
              <p className="mt-2 text-sm text-[#0B3816]/75">Persistencia en localStorage + sincronización si hay sesión activa.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/catalogo" className="rounded-full border border-[#8BA37D]/40 bg-white/70 px-4 py-2 text-sm text-[#0B3816] hover:bg-[#F0ECDF]">Seguir comprando</Link>
              <Link href="/cuenta" className="rounded-full border border-[#587055]/20 bg-white/70 px-4 py-2 text-sm text-[#0B3816] hover:bg-[#F0ECDF]">Cuenta</Link>
            </div>
          </div>
        </header>

        <CartPageClient products={catalogo.items} />
      </div>
    </main>
  );
}
