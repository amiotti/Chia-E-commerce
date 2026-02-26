import Link from "next/link";
import { CuentaAuthShell } from "../_shared";

type SearchParams = Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;

function pickString(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function RegistroPage({ searchParams }: { searchParams?: SearchParams }) {
  const params = await Promise.resolve(searchParams ?? {});
  const error = pickString(params.error);
  const redirectTo = pickString(params.redirectTo) ?? "/cuenta";

  return (
    <CuentaAuthShell
      title="Crear cuenta"
      subtitle="Registro básico local para continuar el flujo del MVP. El primer usuario creado obtiene rol admin para pruebas."
    >
      <h2 className="font-brand text-3xl text-[#0B3816]">Registro</h2>
      <p className="mt-2 text-sm text-[#0B3816]/75">Paso 3 (temporal): persistencia local hasta migrar a Supabase Auth.</p>

      {error ? <div className="mt-4 rounded-2xl border border-[#B8858E]/35 bg-[#B8858E]/12 px-4 py-3 text-sm text-[#0B3816]">{error}</div> : null}

      <form action="/api/auth/register" method="post" className="mt-5 space-y-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium text-[#0B3816]">Email</label>
          <input id="email" name="email" type="email" required className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/85 px-4 py-2.5 text-sm outline-none focus:border-[#587055]" />
        </div>
        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium text-[#0B3816]">Contraseña</label>
          <input id="password" name="password" type="password" minLength={8} required className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/85 px-4 py-2.5 text-sm outline-none focus:border-[#587055]" />
          <p className="mt-1 text-xs text-[#587055]">Mínimo 8 caracteres.</p>
        </div>
        <button type="submit" className="rounded-2xl bg-[#0B3816] px-4 py-2.5 text-sm font-medium text-[#F0ECDF] hover:bg-[#587055]">
          Crear cuenta
        </button>
      </form>

      <p className="mt-4 text-sm text-[#0B3816]/75">
        ¿Ya tenés cuenta?{" "}
        <Link href={`/cuenta/login?redirectTo=${encodeURIComponent(redirectTo)}`} className="text-[#587055] underline underline-offset-4">
          Ingresar
        </Link>
      </p>
    </CuentaAuthShell>
  );
}
