import Link from "next/link";
import { getOrderById } from "@/lib/commerce/orders-store";
import OrderPaymentActions from "@/components/payments/OrderPaymentActions";
import { listPaymentsByOrder } from "@/lib/payments/store";

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

function pick(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export const dynamic = "force-dynamic";

export default async function OrdenDetallePage({ params, searchParams }: Props) {
  const { id } = await params;
  const order = await getOrderById(id);
  const payments = order ? await listPaymentsByOrder(order.id) : [];
  const q = await Promise.resolve(searchParams ?? {});
  const creada = pick(q.creada) === "1";

  if (!order) {
    return (
      <main className="relative min-h-screen overflow-hidden">
        <div className="relative mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
          <section className="panel-surface rounded-3xl border border-[#587055]/15 p-6">
            <h1 className="font-brand text-4xl text-[#0B3816]">Orden no encontrada</h1>
            <Link href="/catalogo" className="mt-4 inline-flex rounded-2xl bg-[#0B3816] px-4 py-2.5 text-sm font-medium text-[#F0ECDF] hover:bg-[#587055]">
              Ir al catálogo
            </Link>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <div className="bg-grid-soft h-full w-full" />
      </div>
      <div className="relative mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="panel-surface mb-5 rounded-3xl border border-[#587055]/15 p-5 sm:p-6">
          <p className="text-xs uppercase tracking-[0.3em] text-[#587055]">Órdenes</p>
          <h1 className="font-brand mt-2 text-4xl leading-tight text-[#0B3816] sm:text-5xl">Orden {order.id}</h1>
          <p className="mt-2 text-sm text-[#0B3816]/75">
            Estado actual: <strong>{order.status}</strong>. En Paso 5 se conecta al pago y webhooks.
          </p>
          {creada ? (
            <div className="mt-4 rounded-2xl border border-[#8BA37D]/35 bg-[#8BA37D]/10 px-4 py-3 text-sm text-[#0B3816]">
              Orden creada correctamente en estado pendiente de pago.
            </div>
          ) : null}
        </header>

        <div className="grid gap-5 lg:grid-cols-[1fr_20rem]">
          <section className="panel-surface rounded-3xl border border-[#587055]/15 p-5">
            <h2 className="font-brand text-3xl text-[#0B3816]">Items</h2>
            <div className="mt-4 space-y-3">
              {order.itemsSnapshot.map((item) => (
                <article key={`${item.productId}-${item.qty}`} className="rounded-2xl border border-[#587055]/10 bg-white/70 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-[#0B3816]">{item.nombre}</p>
                      <p className="text-xs text-[#587055]">
                        {item.qty} x {arsFormatter.format(item.precioCents / 100)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-[#0B3816]">{arsFormatter.format(item.subtotalCents / 100)}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="panel-surface h-fit rounded-3xl border border-[#587055]/15 p-5">
            <h2 className="font-brand text-2xl text-[#0B3816]">Resumen</h2>
            <div className="mt-4 space-y-2 text-sm text-[#0B3816]/80">
              <div className="flex justify-between gap-3">
                <span>Total</span>
                <span className="font-semibold text-[#0B3816]">{arsFormatter.format(order.totalCents / 100)}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Moneda</span>
                <span>{order.currency}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span>Creada</span>
                <span>{new Date(order.createdAt).toLocaleString("es-AR")}</span>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-[#587055]/10 bg-white/70 p-4 text-sm text-[#0B3816]/80">
              <p className="font-medium">Comprador</p>
              <p className="mt-1">{order.shipping.nombreCompleto}</p>
              <p>{order.shipping.email}</p>
              {order.shipping.telefono ? <p>{order.shipping.telefono}</p> : null}
            </div>

            <div className="mt-4 rounded-2xl border border-[#587055]/10 bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#587055]">Pagos (Paso 5)</p>
              <p className="mt-1 text-sm text-[#0B3816]/75">
                Generá el checkout de Mercado Pago o una solicitud base de transferencia por Galio Pay.
              </p>
              <OrderPaymentActions orderId={order.id} />
            </div>

            {payments.length > 0 ? (
              <div className="mt-4 rounded-2xl border border-[#587055]/10 bg-white/70 p-4">
                <p className="text-xs uppercase tracking-[0.2em] text-[#587055]">Intentos de pago</p>
                <div className="mt-3 space-y-2">
                  {payments.map((payment) => (
                    <div key={payment.id} className="rounded-xl border border-[#587055]/10 bg-white/80 px-3 py-2">
                      <div className="flex items-center justify-between gap-2 text-sm">
                        <span className="uppercase tracking-[0.14em] text-[#587055]">{payment.provider}</span>
                        <span className="text-[#0B3816]">{payment.status}</span>
                      </div>
                      <p className="mt-1 text-xs text-[#587055]">
                        {new Date(payment.createdAt).toLocaleString("es-AR")}
                        {payment.providerPaymentId ? ` · provider id: ${payment.providerPaymentId}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            <div className="mt-4 flex flex-col gap-2">
              <Link href="/catalogo" className="rounded-2xl bg-[#0B3816] px-4 py-2.5 text-center text-sm font-medium text-[#F0ECDF] hover:bg-[#587055]">
                Seguir comprando
              </Link>
              <Link href="/cuenta" className="rounded-2xl border border-[#587055]/20 bg-white/70 px-4 py-2.5 text-center text-sm text-[#0B3816] hover:bg-[#F0ECDF]">
                Mi cuenta
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
