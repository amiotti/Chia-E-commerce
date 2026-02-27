import { APP_NAME } from "@chia/shared";
import Image from "next/image";
import Link from "next/link";
import ProductImage from "@/components/product/ProductImage";
import SiteHeader from "@/components/layout/SiteHeader";
import { listCatalogoProductos } from "@/lib/catalogo/repository";

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

export default async function HomePage() {
  const featuredProducts = (await listCatalogoProductos({})).items.slice(0, 3);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-35">
        <div className="bg-grid-soft h-full w-full" />
      </div>

      <Image
        src="/branding/ondas-verde-claro.png"
        alt=""
        width={768}
        height={768}
        className="floaty pointer-events-none absolute -left-36 top-20 hidden w-72 rotate-[-8deg] opacity-50 md:block"
        aria-hidden="true"
      />
      <Image
        src="/branding/hojas-rosa.png"
        alt=""
        width={768}
        height={768}
        className="floaty pointer-events-none absolute -right-24 top-8 hidden w-64 rotate-12 opacity-70 lg:block"
        aria-hidden="true"
      />
      <Image
        src="/branding/ondas-verde.png"
        alt=""
        width={768}
        height={768}
        className="floaty pointer-events-none absolute bottom-12 right-[-7rem] hidden w-80 opacity-25 md:block"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 pb-10 pt-4 sm:px-6 lg:px-8">
        <SiteHeader />

        <section className="scroll-reveal reveal-delay-1 mb-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="panel-surface interactive-card relative overflow-hidden rounded-3xl border border-[#587055]/15 p-6 sm:p-7">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#8BA37D] via-[#B8858E] to-[#587055]" />
            <Image src="/branding/ondas-verde.png" alt="" width={768} height={768} className="pointer-events-none absolute -right-20 top-4 w-56 opacity-[0.09]" aria-hidden="true" />

            <p className="mb-3 text-xs uppercase tracking-[0.34em] text-[#587055]">{APP_NAME}</p>
            <h1 className="font-brand max-w-2xl text-4xl leading-[0.95] text-[#0B3816] sm:text-5xl lg:text-6xl">
              Alimentos saludables
              <span className="block text-[#B8858E]">para tu bienestar diario</span>
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#0B3816]/80 sm:text-base">
              {"En CHIA Espacio Saludable encontr\u00e1s alimentos sin TACC, opciones keto, integrales, semillas, suplementos y productos seleccionados para acompa\u00f1ar una alimentaci\u00f3n consciente."}
            </p>

            <form action="/catalogo" method="get" className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
              <label htmlFor="busqueda-home" className="sr-only">{"Buscar en el cat\u00e1logo"}</label>
              <input id="busqueda-home" name="busqueda" type="search" placeholder="Buscar semillas, suplementos, productos sin TACC o keto..." className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/85 px-4 py-3 text-sm text-[#0B3816] outline-none transition placeholder:text-[#587055]/70 focus:border-[#587055] focus:bg-white" />
              <div className="flex gap-2">
                <button type="submit" className="interactive-chip inline-flex items-center justify-center rounded-2xl bg-[#0B3816] px-4 py-3 text-sm font-medium text-[#F0ECDF] transition hover:bg-[#587055] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B8858E]">Buscar</button>
                <Link href="/cuenta" className="interactive-chip inline-flex items-center justify-center rounded-2xl border border-[#587055]/20 bg-white/80 px-4 py-3 text-sm font-medium text-[#0B3816] transition hover:bg-[#F0ECDF] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B8858E]">Mi cuenta</Link>
              </div>
            </form>

            <div className="mt-4 flex flex-wrap gap-2">
              {[{ label: "Sin TACC", href: "/catalogo?busqueda=sin+tacc" }, { label: "Keto", href: "/catalogo?busqueda=keto" }, { label: "Integrales", href: "/catalogo?busqueda=integral" }, { label: "Suplementos", href: "/catalogo?busqueda=suplementos" }].map((tag) => (
                <Link key={tag.label} href={tag.href} className="interactive-chip rounded-full border border-[#8BA37D]/35 bg-[#F0ECDF] px-3 py-1.5 text-xs tracking-wide text-[#587055] transition hover:border-[#587055]/50 hover:text-[#0B3816] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B8858E]">{tag.label}</Link>
              ))}
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl border border-[#587055]/10 bg-white/70 px-4 py-3"><p className="text-xs uppercase tracking-[0.2em] text-[#587055]">{"Selecci\u00f3n"}</p><p className="mt-1 font-brand text-lg text-[#0B3816]">Productos naturales y funcionales</p></div>
              <div className="rounded-2xl border border-[#587055]/10 bg-white/70 px-4 py-3"><p className="text-xs uppercase tracking-[0.2em] text-[#587055]">Especialidades</p><p className="mt-1 font-brand text-lg text-[#0B3816]">{"Sin TACC, keto, integral y m\u00e1s"}</p></div>
              <div className="rounded-2xl border border-[#587055]/10 bg-white/70 px-4 py-3"><p className="text-xs uppercase tracking-[0.2em] text-[#587055]">Compra simple</p><p className="mt-1 font-brand text-lg text-[#0B3816]">{"Explor\u00e1, eleg\u00ed y pag\u00e1 online"}</p></div>
            </div>
          </div>

          <aside className="panel-surface interactive-card relative overflow-hidden rounded-3xl border border-[#587055]/15 p-6">
            <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-[#B8858E]/15 blur-xl" />
            <div className="absolute -left-6 bottom-10 h-20 w-20 rounded-full bg-[#8BA37D]/20 blur-xl" />
            <div className="mx-auto mb-5 max-w-[18rem]"><Image src="/branding/logo-principal-verde.png" alt="Logo principal CHIA Espacio Saludable" width={768} height={768} className="h-auto w-full" priority /></div>
            <h2 className="font-brand text-2xl text-[#0B3816]">Una tienda pensada para cuidarte</h2>
            <ul className="mt-3 space-y-2 text-sm text-[#0B3816]/80">
              <li>{"Alimentos saludables para desayunos, snacks, cocina y suplementaci\u00f3n."}</li>
              <li>Opciones sin TACC, keto, integrales y naturales seleccionadas con criterio.</li>
              <li>{"Semillas, harinas, aceites, mixes y suplementos para todos los d\u00edas."}</li>
              <li>{"Una experiencia c\u00e1lida, simple y alineada con el universo de CHIA."}</li>
            </ul>
            <div className="mt-5 rounded-2xl border border-[#B8858E]/25 bg-[#B8858E]/10 p-4">
              <p className="text-xs uppercase tracking-[0.22em] text-[#587055]">Nuestra propuesta</p>
              <p className="mt-2 text-sm leading-relaxed text-[#0B3816]/80">{"Queremos acercarte productos nobles y pr\u00e1cticos para una alimentaci\u00f3n m\u00e1s equilibrada, con categor\u00edas pensadas para quienes buscan bienestar, energ\u00eda y opciones de calidad."}</p>
            </div>
          </aside>
        </section>

        <section className="scroll-reveal reveal-delay-2 mb-6">
          <div className="mb-3 flex items-end justify-between gap-3">
            <div><p className="text-xs uppercase tracking-[0.3em] text-[#587055]">{"Selecci\u00f3n CHIA"}</p><h2 className="font-brand text-3xl leading-tight text-[#0B3816]">Productos destacados</h2></div>
            <div className="hidden items-center gap-2 rounded-full border border-[#8BA37D]/35 bg-white/65 px-3 py-1.5 text-xs text-[#587055] sm:flex"><span className="inline-block h-2 w-2 rounded-full bg-[#8BA37D]" />Elegidos para tu rutina saludable</div>
          </div>
          {featuredProducts.length === 0 ? (
            <div className="panel-surface rounded-3xl border border-[#587055]/15 p-6 text-sm text-[#0B3816]/75">{"Todav\u00eda no hay productos destacados cargados en esta base."}</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-3">
              {featuredProducts.map((producto, index) => (
                <article key={producto.id} className="panel-surface interactive-card scroll-reveal reveal-delay-3 group relative overflow-hidden rounded-3xl border border-[#587055]/15 p-4">
                  <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-2xl border border-[#587055]/10 bg-[#F0ECDF]">
                    <ProductImage src={producto.imagenes[0]} alt={producto.nombre} fill className="object-cover transition duration-500 group-hover:scale-[1.03]" sizes="(min-width: 768px) 33vw, 100vw" unoptimized />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B3816]/35 via-transparent to-transparent" />
                    <div className={`absolute inset-x-0 top-0 h-1 ${index % 3 === 0 ? "bg-[#587055]" : index % 3 === 1 ? "bg-[#8BA37D]" : "bg-[#B8858E]"}`} />
                    <Image src={index % 2 === 0 ? "/branding/logo-principal-rosa.png" : "/branding/logo-principal-verde.png"} alt="" width={768} height={768} className="absolute -right-8 -top-10 w-40 opacity-[0.1] transition duration-300 group-hover:scale-105" aria-hidden="true" />
                    <Image src={index === 1 ? "/branding/hojas-rosa.png" : "/branding/ondas-verde-claro.png"} alt="" width={768} height={768} className="absolute bottom-0 left-0 w-28 opacity-[0.12]" aria-hidden="true" />
                    <div className="relative flex h-full flex-col justify-end p-4"><p className="text-xs uppercase tracking-[0.22em] text-[#F0ECDF]/90">{producto.categoria}</p><h3 className="font-brand mt-2 text-2xl leading-tight text-[#F0ECDF]">{producto.nombre}</h3></div>
                  </div>
                  <p className="min-h-12 text-sm leading-relaxed text-[#0B3816]/78">{producto.descripcion}</p>
                  <p className="mt-4 text-2xl font-semibold text-[#0B3816]">{arsFormatter.format(producto.precioCents)}</p>
                  <div className="mt-1 flex items-center justify-between gap-2 text-sm text-[#587055]"><span>Stock: {producto.stock}</span><span className="rounded-full bg-[#8BA37D]/15 px-2 py-0.5 text-xs">{producto.tags[0]}</span></div>
                  <Link href={`/catalogo/${producto.slug}`} className="interactive-chip mt-4 block w-full rounded-2xl border border-[#587055]/20 bg-[#0B3816] px-4 py-2.5 text-center text-sm font-medium text-[#F0ECDF] transition hover:bg-[#587055] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#B8858E]">Ver producto</Link>
                </article>
              ))}
            </div>
          )}
        </section>

        <footer className="panel-surface interactive-card scroll-reveal reveal-delay-4 rounded-3xl border border-[#587055]/15 p-4 sm:p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3"><Image src="/branding/logo-simplificado.png" alt={"S\u00edmbolo CHIA"} width={48} height={48} className="h-10 w-10 rounded-full" /><div><p className="font-brand text-lg leading-none text-[#0B3816]">CHIA</p><p className="text-xs uppercase tracking-[0.26em] text-[#587055]">Espacio saludable</p></div></div>
            <div className="text-sm text-[#0B3816]/75">{"Productos seleccionados para acompa\u00f1ar una vida m\u00e1s natural, pr\u00e1ctica y consciente."}</div>
          </div>
        </footer>
      </div>
    </main>
  );
}