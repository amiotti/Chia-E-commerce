import Link from "next/link";

export function CuentaAuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <div className="bg-grid-soft h-full w-full" />
      </div>
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid w-full gap-5 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="panel-surface rounded-3xl border border-[#587055]/15 p-6 sm:p-7">
            <p className="text-xs uppercase tracking-[0.28em] text-[#587055]">Cuenta</p>
            <h1 className="font-brand mt-2 text-4xl leading-tight text-[#0B3816] sm:text-5xl">{title}</h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#0B3816]/75 sm:text-base">{subtitle}</p>
            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              <Link href="/" className="rounded-full border border-[#8BA37D]/35 bg-[#F0ECDF] px-3 py-1.5 text-[#0B3816] hover:bg-white">
                Inicio
              </Link>
              <Link href="/catalogo" className="rounded-full border border-[#8BA37D]/35 bg-[#F0ECDF] px-3 py-1.5 text-[#0B3816] hover:bg-white">
                Catálogo
              </Link>
              <Link href="/admin/productos" className="rounded-full border border-[#8BA37D]/35 bg-[#F0ECDF] px-3 py-1.5 text-[#0B3816] hover:bg-white">
                Admin
              </Link>
            </div>
          </section>

          <section className="panel-surface rounded-3xl border border-[#587055]/15 p-6">{children}</section>
        </div>
      </div>
    </main>
  );
}
