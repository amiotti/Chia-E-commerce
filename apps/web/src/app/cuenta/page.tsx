import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";
import { requireAuthPage } from "@/lib/auth/guards";
import { listOrdersByUser } from "@/lib/commerce/orders-store";

type SearchParams = Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;

function pickString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export const dynamic = "force-dynamic";

export default async function CuentaPage({ searchParams }: { searchParams?: SearchParams }) {
  const session = await requireAuthPage("/cuenta");
  const orders = await listOrdersByUser(session.userId);
  const params = await Promise.resolve(searchParams ?? {});
  const login = pickString(params.login);
  const registro = pickString(params.registro);
  const forbidden = pickString(params.error) === "forbidden";

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-25"><div className="bg-grid-soft h-full w-full" /></div>
      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <SiteHeader current="cuenta" />

        <section className="panel-surface rounded-3xl border border-[#587055]/15 p-6 sm:p-7">
          <p className="text-xs uppercase tracking-[0.3em] text-[#587055]">Cuenta</p>
          <h1 className="font-brand mt-2 text-4xl leading-tight text-[#0B3816] sm:text-5xl">Mi perfil</h1>
          <p className="mt-3 text-sm text-[#0B3816]/75 sm:text-base">Desde tu cuenta podes revisar tus datos, seguir tus pedidos y acceder rapidamente a tus compras.</p>

          {login === "ok" ? <div className="mt-4 rounded-2xl border border-[#8BA37D]/35 bg-[#8BA37D]/12 px-4 py-3 text-sm text-[#0B3816]">Login correcto.</div> : null}
          {registro === "ok" ? <div className="mt-4 rounded-2xl border border-[#8BA37D]/35 bg-[#8BA37D]/12 px-4 py-3 text-sm text-[#0B3816]">Registro correcto.</div> : null}
          {forbidden ? <div className="mt-4 rounded-2xl border border-[#B8858E]/35 bg-[#B8858E]/12 px-4 py-3 text-sm text-[#0B3816]">Tu usuario no tiene permisos de admin.</div> : null}

          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-2xl border border-[#587055]/10 bg-white/70 p-4"><p className="text-xs uppercase tracking-[0.2em] text-[#587055]">Email</p><p className="mt-1 text-sm text-[#0B3816]">{session.email}</p></div>
            <div className="rounded-2xl border border-[#587055]/10 bg-white/70 p-4"><p className="text-xs uppercase tracking-[0.2em] text-[#587055]">Rol</p><p className="mt-1 text-sm uppercase tracking-[0.15em] text-[#0B3816]">{session.role}</p></div>
            <div className="rounded-2xl border border-[#587055]/10 bg-white/70 p-4"><p className="text-xs uppercase tracking-[0.2em] text-[#587055]">Ordenes</p><p className="mt-1 text-sm text-[#0B3816]">{orders.length} registradas</p></div>
          </div>

          {session.role === "admin" ? (
            <div className="mt-6 flex flex-wrap gap-2">
              <Link href="/admin/productos" className="rounded-full border border-[#587055]/25 bg-[#0B3816] px-4 py-2 text-sm text-[#F0ECDF] hover:bg-[#587055]">Panel admin</Link>
            </div>
          ) : null}

          <div className="mt-6 rounded-3xl border border-[#587055]/10 bg-white/60 p-5">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#587055]">Tus compras</p>
                <h2 className="font-brand text-3xl text-[#0B3816]">Ordenes recientes</h2>
              </div>
              <Link href="/cuenta/ordenes" className="text-sm text-[#587055] underline underline-offset-4">Ver historial completo</Link>
            </div>

            {orders.length === 0 ? (
              <div className="rounded-2xl border border-[#587055]/10 bg-white/70 p-5 text-sm text-[#0B3816]/75">
                Todavia no tenes ordenes. <Link href="/catalogo" className="text-[#587055] underline underline-offset-4">Ir al catalogo</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map((order) => (
                  <article key={order.id} className="rounded-2xl border border-[#587055]/10 bg-white/70 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-medium text-[#0B3816]">{order.id}</p>
                        <p className="text-xs uppercase tracking-[0.15em] text-[#587055]">{order.status}</p>
                        <p className="mt-1 text-xs text-[#587055]">{new Date(order.createdAt).toLocaleString("es-AR")}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-[#0B3816]">{arsFormatter.format(order.totalCents)}</span>
                        <Link href={`/ordenes/${order.id}`} className="rounded-xl bg-[#0B3816] px-3 py-2 text-sm text-[#F0ECDF] hover:bg-[#587055]">Ver detalle</Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>

          <form action="/api/auth/logout" method="post" className="mt-6">
            <input type="hidden" name="redirectTo" value="/cuenta/login" />
            <button type="submit" className="rounded-2xl border border-[#B8858E]/35 bg-[#B8858E]/10 px-4 py-2.5 text-sm font-medium text-[#0B3816] hover:bg-[#B8858E]/20">Cerrar sesion</button>
          </form>
        </section>
      </div>
    </main>
  );
}