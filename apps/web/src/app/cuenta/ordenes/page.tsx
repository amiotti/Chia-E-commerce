import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import { requireAuthPage } from "@/lib/auth/guards";
import { listAllOrders, listOrdersByUser } from "@/lib/commerce/orders-store";
import OrdersPanel from "./OrdersPanel";

export const dynamic = "force-dynamic";

export default async function CuentaOrdenesPage() {
  const session = await requireAuthPage("/cuenta/ordenes");
  const orders = session.role === "admin" ? await listAllOrders() : await listOrdersByUser(session.userId);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-25"><div className="bg-grid-soft h-full w-full" /></div>
      <div className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <SiteHeader current="cuenta" />

        <header className="panel-surface hero-overlay mb-5 rounded-3xl border border-[#587055]/15 p-5 sm:p-6">
          <div className="relative z-[1]">
            <p className="text-brand-muted text-xs uppercase tracking-[0.28em]">Cuenta</p>
            <h1 className="font-brand text-brand-primary mt-2 text-4xl leading-tight sm:text-5xl">
              {session.role === "admin" ? "Ordenes del sitio" : "Mis ordenes"}
            </h1>
            <p className="text-brand-secondary mt-2 text-sm">
              {session.role === "admin"
                ? "Como admin podes revisar todas las ordenes y marcar manualmente como pagadas las que sigan pendientes."
                : "Segui el estado de tus pedidos y revisa el detalle de cada compra."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/cuenta" className="button-secondary rounded-full px-4 py-2 text-sm">Mi cuenta</Link>
              <Link href="/catalogo" className="button-secondary rounded-full px-4 py-2 text-sm">Catalogo</Link>
              <Link href="/carrito" className="button-secondary rounded-full px-4 py-2 text-sm">Carrito</Link>
            </div>
          </div>
        </header>

        <OrdersPanel initialOrders={orders} isAdmin={session.role === "admin"} />
      </div>
    </main>
  );
}