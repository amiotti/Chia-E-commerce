import Link from "next/link";
import { CuentaAuthShell } from "../_shared";

type SearchParams = Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;

function pickString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function LoginPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = await Promise.resolve(searchParams ?? {});
  const error = pickString(params.error);
  const logout = pickString(params.logout);
  const redirectTo = pickString(params.redirectTo) ?? "/cuenta";

  return (
    <CuentaAuthShell
      title="Ingresar"
      subtitle="Accedé a tu cuenta para guardar tus compras, revisar pedidos y continuar tu experiencia en CHIA Espacio Saludable."
    >
      <h2 className="font-brand text-3xl text-[#0B3816]">Login</h2>
      <p className="mt-2 text-sm text-[#0B3816]/75">Ingresá con tu email y contraseña para continuar tu compra.</p>
      {error ? <div className="mt-4 rounded-2xl border border-[#B8858E]/35 bg-[#B8858E]/12 px-4 py-3 text-sm text-[#0B3816]">{error}</div> : null}
      {logout === "ok" ? <div className="mt-4 rounded-2xl border border-[#8BA37D]/35 bg-[#8BA37D]/12 px-4 py-3 text-sm text-[#0B3816]">Sesión cerrada correctamente.</div> : null}
      {logout === "idle" ? <div className="mt-4 rounded-2xl border border-[#B8858E]/35 bg-[#B8858E]/12 px-4 py-3 text-sm text-[#0B3816]">Tu sesión se cerró por inactividad.</div> : null}
      <form action="/api/auth/login" method="post" className="mt-5 space-y-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div><label htmlFor="email" className="mb-1 block text-sm font-medium text-[#0B3816]">Email</label><input id="email" name="email" type="email" required className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/85 px-4 py-2.5 text-sm outline-none focus:border-[#587055]" /></div>
        <div><label htmlFor="password" className="mb-1 block text-sm font-medium text-[#0B3816]">Contraseña</label><input id="password" name="password" type="password" minLength={8} required className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/85 px-4 py-2.5 text-sm outline-none focus:border-[#587055]" /></div>
        <button type="submit" className="rounded-2xl bg-[#0B3816] px-4 py-2.5 text-sm font-medium text-[#F0ECDF] hover:bg-[#587055]">Ingresar</button>
      </form>
      <p className="mt-4 text-sm text-[#0B3816]/75">¿No tenés cuenta? <Link href={`/cuenta/registro?redirectTo=${encodeURIComponent(redirectTo)}`} className="text-[#587055] underline underline-offset-4">Crear cuenta</Link></p>
    </CuentaAuthShell>
  );
}