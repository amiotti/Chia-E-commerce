import Image from "next/image";
import Link from "next/link";
import ThemeToggle from "@/components/theme/ThemeToggle";

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
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[#587055]">Cuenta</p>
                <h1 className="font-brand mt-2 text-4xl leading-tight text-[#0B3816] sm:text-5xl">{title}</h1>
              </div>
              <ThemeToggle variant="inline" />
            </div>

            <div className="mt-5 flex items-center gap-4 rounded-3xl border border-[#587055]/10 bg-white/60 p-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-full ring-1 ring-[#587055]/15">
                <Image src="/branding/logo-principal-verde.png" alt="Logo CHIA Espacio Saludable" fill className="object-cover" priority />
              </div>
              <div>
                <p className="font-brand text-2xl leading-none text-[#0B3816]">CHIA</p>
                <p className="mt-1 text-xs uppercase tracking-[0.28em] text-[#587055]">Espacio saludable</p>
              </div>
            </div>

            <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#0B3816]/75 sm:text-base">{subtitle}</p>

            <div className="mt-5 flex flex-wrap gap-2 text-sm">
              <Link href="/" className="rounded-full border border-[#8BA37D]/35 bg-[#F0ECDF] px-3 py-1.5 text-[#0B3816] hover:bg-white">
                Inicio
              </Link>
              <Link href="/catalogo" className="rounded-full border border-[#8BA37D]/35 bg-[#F0ECDF] px-3 py-1.5 text-[#0B3816] hover:bg-white">
                Catálogo
              </Link>
              <Link href="/bienestar" className="rounded-full border border-[#8BA37D]/35 bg-[#F0ECDF] px-3 py-1.5 text-[#0B3816] hover:bg-white">
                Bienestar
              </Link>
            </div>
          </section>

          <section className="panel-surface rounded-3xl border border-[#587055]/15 p-6">{children}</section>
        </div>
      </div>
    </main>
  );
}