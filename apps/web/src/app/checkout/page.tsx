import Link from "next/link";
import CheckoutClient from "@/components/cart/CheckoutClient";
import SiteHeader from "@/components/layout/SiteHeader";
import { listCatalogoProductos } from "@/lib/catalogo/repository";

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const catalogo = await listCatalogoProductos({});

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <div className="bg-grid-soft h-full w-full" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <SiteHeader />

        <header className="panel-surface mb-5 rounded-3xl border border-[#587055]/15 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#587055]">Finalizar compra</p>
              <h1 className="font-brand text-4xl leading-tight text-[#0B3816] sm:text-5xl">Checkout</h1>
              <p className="mt-2 text-sm text-[#0B3816]/75">
                Completá tus datos, elegí envío o retiro por el local y avanzá al pago.
              </p>
            </div>

            <Link
              href="/carrito"
              className="rounded-full border border-[#8BA37D]/40 bg-white/70 px-4 py-2 text-sm text-[#0B3816] hover:bg-[#F0ECDF]"
            >
              Volver al carrito
            </Link>
          </div>
        </header>

        <CheckoutClient products={catalogo.items} />
      </div>
    </main>
  );
}