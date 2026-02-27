import Image from "next/image";
import Link from "next/link";
import SiteHeader from "@/components/layout/SiteHeader";

const bienestarPillars = [
  {
    title: "Alimentaci\u00f3n consciente",
    description: "Opciones pensadas para sumar calidad a tu rutina, con ingredientes nobles y categor\u00edas funcionales.",
    href: "/catalogo?busqueda=semillas",
  },
  {
    title: "Sin TACC y keto",
    description: "Explora productos para necesidades espec\u00edficas sin resignar sabor ni practicidad.",
    href: "/catalogo?busqueda=keto",
  },
  {
    title: "Suplementos y energ\u00eda",
    description: "Encontr\u00e1 aliados para complementar tu d\u00eda con foco en bienestar y h\u00e1bitos sostenibles.",
    href: "/catalogo?busqueda=suplementos",
  },
];

export default function BienestarPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <div className="bg-grid-soft h-full w-full" />
      </div>
      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <SiteHeader current="bienestar" />

        <header className="panel-surface mb-5 rounded-3xl border border-[#587055]/15 p-6 sm:p-7">
          <div className="grid gap-5 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-[#587055]">Bienestar</p>
              <h1 className="font-brand mt-3 text-4xl leading-[0.95] text-[#0B3816] sm:text-5xl lg:text-6xl">
                {"Peque\u00f1os h\u00e1bitos, grandes cambios"}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#0B3816]/80 sm:text-base">
                {"CHIA Espacio Saludable acompa\u00f1a una forma de alimentarte m\u00e1s simple y consciente, con productos seleccionados para sumar equilibrio, energ\u00eda y practicidad a tu d\u00eda."}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link href="/catalogo" className="rounded-2xl bg-[#0B3816] px-4 py-2.5 text-sm font-medium text-[#F0ECDF] hover:bg-[#587055]">
                  {"Explorar cat\u00e1logo"}
                </Link>
                <Link href="/cuenta" className="rounded-2xl border border-[#587055]/20 bg-white/70 px-4 py-2.5 text-sm text-[#0B3816] hover:bg-[#F0ECDF]">
                  Mi cuenta
                </Link>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-3xl border border-[#587055]/15 bg-white/60 p-4">
              <Image src="/branding/logo-principal-verde.png" alt="CHIA Espacio Saludable" width={768} height={768} className="mx-auto h-auto w-full max-w-sm" priority />
            </div>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          {bienestarPillars.map((pillar, index) => (
            <article key={pillar.title} className="panel-surface rounded-3xl border border-[#587055]/15 p-5">
              <div className={`mb-4 h-1 rounded-full ${index === 0 ? "bg-[#587055]" : index === 1 ? "bg-[#8BA37D]" : "bg-[#B8858E]"}`} />
              <h2 className="font-brand text-2xl text-[#0B3816]">{pillar.title}</h2>
              <p className="mt-3 text-sm leading-relaxed text-[#0B3816]/75">{pillar.description}</p>
              <Link href={pillar.href} className="mt-4 inline-flex text-sm font-medium text-[#587055] underline underline-offset-4">
                Ver productos relacionados
              </Link>
            </article>
          ))}
        </section>

        <section className="panel-surface mt-5 rounded-3xl border border-[#587055]/15 p-6">
          <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr] lg:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#587055]">{"Rutina diaria"}</p>
              <h2 className="font-brand mt-2 text-3xl leading-tight text-[#0B3816] sm:text-4xl">Ideas para sumar bienestar</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl border border-[#587055]/10 bg-white/70 p-4"><p className="text-sm font-medium text-[#0B3816]">Desayunos nutritivos</p><p className="mt-2 text-sm text-[#0B3816]/75">{"Suma semillas, harinas integrales y mezclas funcionales a tus ma\u00f1anas."}</p></div>
              <div className="rounded-2xl border border-[#587055]/10 bg-white/70 p-4"><p className="text-sm font-medium text-[#0B3816]">Snacks inteligentes</p><p className="mt-2 text-sm text-[#0B3816]/75">{"Eleg\u00ed opciones pr\u00e1cticas para sostener tu energ\u00eda durante el d\u00eda."}</p></div>
              <div className="rounded-2xl border border-[#587055]/10 bg-white/70 p-4"><p className="text-sm font-medium text-[#0B3816]">Cocina sin resignar sabor</p><p className="mt-2 text-sm text-[#0B3816]/75">Explora alternativas sin TACC y keto con ingredientes nobles.</p></div>
              <div className="rounded-2xl border border-[#587055]/10 bg-white/70 p-4"><p className="text-sm font-medium text-[#0B3816]">{"Complementos diarios"}</p><p className="mt-2 text-sm text-[#0B3816]/75">{"Suplementos y productos funcionales para acompa\u00f1ar tus h\u00e1bitos."}</p></div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}