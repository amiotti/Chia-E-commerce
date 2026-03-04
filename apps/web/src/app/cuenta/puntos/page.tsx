import Link from "next/link";
import { redirect } from "next/navigation";
import ProductImage from "@/components/product/ProductImage";
import SiteHeader from "@/components/layout/SiteHeader";
import { requireAuthPage } from "@/lib/auth/guards";
import {
  LOYALTY_POINTS_EARNING_DIVISOR,
  getLoyaltyWallet,
  listLoyaltyRedemptionsByUser,
  listLoyaltyTransactionsByUser,
  listRedeemableProducts,
} from "@/lib/loyalty/store";
import RedeemPointsButton from "./RedeemPointsButton";

export const dynamic = "force-dynamic";
const arsFormatter = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });

export default async function CuentaPuntosPage() {
  const session = await requireAuthPage("/cuenta/puntos");
  if (session.role === "admin") {
    redirect("/cuenta");
  }

  const [wallet, transactions, redemptions, redeemableProducts] = await Promise.all([
    getLoyaltyWallet(session.userId),
    listLoyaltyTransactionsByUser(session.userId, 10),
    listLoyaltyRedemptionsByUser(session.userId, 6),
    listRedeemableProducts(),
  ]);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-25"><div className="bg-grid-soft h-full w-full" /></div>
      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <SiteHeader current="puntos" />
        <section className="panel-surface rounded-3xl border border-[#587055]/15 p-6 sm:p-7">
          <p className="text-xs uppercase tracking-[0.3em] text-[#587055]">Programa de fidelidad</p>
          <h1 className="font-brand mt-2 text-4xl leading-tight text-[#0B3816] sm:text-5xl">Tus puntos CHÍA</h1>
          <p className="mt-3 max-w-3xl text-sm text-[#0B3816]/75 sm:text-base">
            Inspirado en modelos de tienda de puntos, acá acumulás puntos con compras pagadas y luego canjeás productos adheridos.
            En esta etapa sumás 1 punto cada {LOYALTY_POINTS_EARNING_DIVISOR} pesos gastados en productos, sin contar servicio ni envío.
          </p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border border-[#587055]/10 bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#587055]">Saldo actual</p>
              <p className="mt-1 text-4xl font-mono font-semibold tracking-tight tabular-nums text-[#0B3816]">{wallet.balancePoints}</p>
              <p className="text-xs text-[#587055]">Puntos disponibles para canjear</p>
            </div>
            <div className="rounded-2xl border border-[#587055]/10 bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#587055]">Acumulados</p>
              <p className="mt-1 text-4xl font-mono font-semibold tracking-tight tabular-nums text-[#0B3816]">{wallet.lifetimeEarned}</p>
              <p className="text-xs text-[#587055]">Total histórico acreditado</p>
            </div>
            <div className="rounded-2xl border border-[#587055]/10 bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#587055]">Canjeados</p>
              <p className="mt-1 text-4xl font-mono font-semibold tracking-tight tabular-nums text-[#0B3816]">{wallet.lifetimeRedeemed}</p>
              <p className="text-xs text-[#587055]">Puntos usados en productos</p>
            </div>
          </div>
        </section>

        <section className="mt-6 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-5">
            <section className="panel-surface rounded-3xl border border-[#587055]/15 p-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#587055]">Movimientos</p>
                  <h2 className="font-brand text-3xl text-[#0B3816]">Actividad reciente</h2>
                </div>
                <Link href="/cuenta" className="text-sm text-[#587055] underline underline-offset-4">Volver a mi cuenta</Link>
              </div>
              {transactions.length === 0 ? (
                <p className="rounded-2xl border border-[#587055]/10 bg-white/70 p-4 text-sm text-[#0B3816]/75">
                  Todavía no tenés movimientos. Cuando una compra pase a pagada, los puntos se acreditarán automáticamente.
                </p>
              ) : (
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <article key={transaction.id} className="rounded-2xl border border-[#587055]/10 bg-white/70 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-[#0B3816]">{transaction.reason}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#587055]">
                            {transaction.kind === "earn" ? "Acreditación" : transaction.kind === "redeem" ? "Canje" : transaction.kind}
                          </p>
                          <p className="mt-1 text-xs text-[#587055]">{new Date(transaction.createdAt).toLocaleString("es-AR")}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${transaction.kind === "earn" ? "bg-[#8BA37D]/18 text-[#0B3816]" : "bg-[#B8858E]/18 text-[#0B3816]"}`}>
                          {transaction.kind === "earn" ? `+${transaction.points}` : `-${transaction.points}`} pts
                        </span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <section className="panel-surface rounded-3xl border border-[#587055]/15 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-[#587055]">Canjes realizados</p>
              <h2 className="font-brand mt-1 text-3xl text-[#0B3816]">Tus últimas solicitudes</h2>
              {redemptions.length === 0 ? (
                <p className="mt-3 rounded-2xl border border-[#587055]/10 bg-white/70 p-4 text-sm text-[#0B3816]/75">
                  Aún no realizaste canjes. Elegí un producto adherido y usá tus puntos cuando tengas saldo suficiente.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {redemptions.map((redemption) => (
                    <article key={redemption.id} className="rounded-2xl border border-[#587055]/10 bg-white/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-[#0B3816]">{redemption.productSnapshot.nombre}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.14em] text-[#587055]">{redemption.status}</p>
                          <p className="mt-1 text-xs text-[#587055]">{new Date(redemption.createdAt).toLocaleString("es-AR")}</p>
                        </div>
                        <span className="rounded-full bg-[#F0ECDF] px-3 py-1 text-xs text-[#587055]">{redemption.pointsCost} pts</span>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>
          </div>

          <section className="panel-surface rounded-3xl border border-[#587055]/15 p-5">
            <div className="mb-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#587055]">Catálogo de canje</p>
              <h2 className="font-brand text-3xl text-[#0B3816]">Productos adheridos</h2>
              <p className="mt-2 text-sm text-[#0B3816]/75">
                Canjeá los productos que participen del programa. El canje descuenta tus puntos y genera una solicitud manual para el equipo de CHÍA.
              </p>
            </div>
            {redeemableProducts.length === 0 ? (
              <p className="rounded-2xl border border-[#587055]/10 bg-white/70 p-4 text-sm text-[#0B3816]/75">
                Todavía no hay productos configurados para canjear con puntos.
              </p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                {redeemableProducts.map((product) => {
                  const canAfford = wallet.balancePoints >= (product.puntosCanje ?? 0);
                  return (
                    <article key={product.id} className="rounded-3xl border border-[#587055]/10 bg-white/70 p-4">
                      <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-2xl border border-[#587055]/10 bg-[#F0ECDF]">
                        <ProductImage src={product.imagenes[0]} alt={product.nombre} fill className="object-cover" unoptimized />
                      </div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-brand text-2xl leading-tight text-[#0B3816]">{product.nombre}</p>
                          <p className="mt-1 text-sm text-[#587055]">{product.categoria}</p>
                        </div>
                        <span className="rounded-full bg-[#8BA37D]/18 px-3 py-1 text-xs font-medium text-[#0B3816]">{product.puntosCanje} pts</span>
                      </div>
                      <p className="mt-3 text-sm text-[#0B3816]/75">{product.descripcion}</p>
                      <div className="mt-4 flex items-center justify-between gap-3 text-xs text-[#587055]">
                        <span>Precio referencial: {arsFormatter.format(product.precioCents)}</span>
                        <span>Stock: {product.stock}</span>
                      </div>
                      <div className="mt-4">
                        <RedeemPointsButton productId={product.id} disabled={!canAfford || product.stock < 1} />
                        {!canAfford ? <p className="mt-2 text-xs text-[#587055]">Necesitás {product.puntosCanje! - wallet.balancePoints} puntos más para este canje.</p> : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}