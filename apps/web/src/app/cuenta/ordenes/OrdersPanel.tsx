"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import type { Order } from "@/lib/commerce/types";

type Props = {
  initialOrders: Order[];
  isAdmin: boolean;
};

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default function OrdersPanel({ initialOrders, isAdmin }: Props) {
  const [orders, setOrders] = useState(initialOrders);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function markAsPaid(orderId: string) {
    setError(null);
    setSuccess(null);
    setPendingId(orderId);

    startTransition(async () => {
      try {
        const response = await fetch(`/api/ordenes/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "PAGADA" }),
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          throw new Error(data.error ?? "No se pudo actualizar la orden.");
        }

        setOrders((current) => current.map((order) => (order.id === orderId ? data.order : order)));
        setSuccess(`Orden ${orderId} marcada como pagada.`);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado.");
      } finally {
        setPendingId(null);
      }
    });
  }

  return (
    <section className="panel-surface hero-overlay rounded-3xl border border-[#587055]/15 p-5">
      <div className="relative z-[1]">
        {success ? <div className="surface-muted text-brand-primary mb-3 rounded-xl px-3 py-2 text-sm">{success}</div> : null}
        {error ? <div className="surface-muted text-brand-primary mb-3 rounded-xl px-3 py-2 text-sm">{error}</div> : null}

        {orders.length === 0 ? (
          <div className="surface-soft text-brand-secondary rounded-2xl p-5 text-sm">
            Todavía no hay órdenes. <Link href="/catalogo" className="text-brand-muted underline underline-offset-4">Ir al catálogo</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => (
              <article key={order.id} className="surface-soft rounded-2xl p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-brand-primary font-medium">{order.id}</p>
                    <p className="text-brand-muted text-xs uppercase tracking-[0.15em]">{order.status}</p>
                    <p className="text-brand-muted mt-1 text-xs">{new Date(order.createdAt).toLocaleString("es-AR")}</p>
                    {isAdmin ? (
                      <p className="text-brand-muted mt-1 text-xs">Cliente: {order.shipping.nombreCompleto} · {order.shipping.email}</p>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                    <span className="text-brand-primary text-sm font-semibold">{arsFormatter.format(order.totalCents)}</span>
                    <Link href={`/ordenes/${order.id}`} className="button-secondary rounded-xl px-3 py-2 text-center text-sm">
                      Ver detalle
                    </Link>
                    {isAdmin && order.status === "PENDIENTE_PAGO" ? (
                      <button
                        type="button"
                        onClick={() => markAsPaid(order.id)}
                        disabled={isPending && pendingId === order.id}
                        className="button-primary rounded-xl px-3 py-2 text-sm disabled:opacity-60"
                      >
                        {isPending && pendingId === order.id ? "Actualizando..." : "Marcar como pagada"}
                      </button>
                    ) : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}