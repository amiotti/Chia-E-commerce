import Link from "next/link";
import { requireAuthPage } from "@/lib/auth/guards";

type SearchParams = Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;

function pickString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export const dynamic = "force-dynamic";

export default async function CuentaPage({ searchParams }: { searchParams?: SearchParams }) {
  const session = await requireAuthPage("/cuenta");
  const params = await Promise.resolve(searchParams ?? {});
  const login = pickString(params.login);
  const registro = pickString(params.registro);
  const forbidden = pickString(params.error) === "forbidden";

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <div className="bg-grid-soft h-full w-full" />
      </div>
      <div className="relative mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="panel-surface rounded-3xl border border-[#587055]/15 p-6 sm:p-7">
          <p className="text-xs uppercase tracking-[0.3em] text-[#587055]">Cuenta</p>
          <h1 className="font-brand mt-2 text-4xl leading-tight text-[#0B3816] sm:text-5xl">Mi perfil</h1>
          <p className="mt-3 text-sm text-[#0B3816]/75 sm:text-base">
            Sesión activa (Paso 3 local). Más adelante migramos este flujo a Supabase Auth + verificación de email.
          </p>

          {login === "ok" ? <div className="mt-4 rounded-2xl border border-[#8BA37D]/35 bg-[#8BA37D]/12 px-4 py-3 text-sm text-[#0B3816]">Login correcto.</div> : null}
          {registro === "ok" ? <div className="mt-4 rounded-2xl border border-[#8BA37D]/35 bg-[#8BA37D]/12 px-4 py-3 text-sm text-[#0B3816]">Registro correcto.</div> : null}
          {forbidden ? <div className="mt-4 rounded-2xl border border-[#B8858E]/35 bg-[#B8858E]/12 px-4 py-3 text-sm text-[#0B3816]">Tu usuario no tiene permisos de admin.</div> : null}

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#587055]/10 bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#587055]">Email</p>
              <p className="mt-1 text-sm text-[#0B3816]">{session.email}</p>
            </div>
            <div className="rounded-2xl border border-[#587055]/10 bg-white/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-[#587055]">Rol</p>
              <p className="mt-1 text-sm uppercase tracking-[0.15em] text-[#0B3816]">{session.role}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <Link href="/" className="rounded-full border border-[#8BA37D]/35 bg-[#F0ECDF] px-4 py-2 text-sm text-[#0B3816] hover:bg-white">
              Inicio
            </Link>
            <Link href="/catalogo" className="rounded-full border border-[#8BA37D]/35 bg-[#F0ECDF] px-4 py-2 text-sm text-[#0B3816] hover:bg-white">
              Catálogo
            </Link>
            {session.role === "admin" ? (
              <Link
                href="/admin/productos"
                className="rounded-full border border-[#587055]/25 bg-[#0B3816] px-4 py-2 text-sm text-[#F0ECDF] hover:bg-[#587055]"
              >
                Panel admin (Perfil)
              </Link>
            ) : null}
            <Link href="/cuenta/ordenes" className="rounded-full border border-[#587055]/20 bg-white/80 px-4 py-2 text-sm text-[#0B3816] hover:bg-[#F0ECDF]">
              Mis órdenes
            </Link>
            <Link href="/carrito" className="rounded-full border border-[#587055]/20 bg-white/80 px-4 py-2 text-sm text-[#0B3816] hover:bg-[#F0ECDF]">
              Carrito
            </Link>
          </div>

          <form action="/api/auth/logout" method="post" className="mt-6">
            <input type="hidden" name="redirectTo" value="/cuenta/login" />
            <button type="submit" className="rounded-2xl border border-[#B8858E]/35 bg-[#B8858E]/10 px-4 py-2.5 text-sm font-medium text-[#0B3816] hover:bg-[#B8858E]/20">
              Cerrar sesión
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}