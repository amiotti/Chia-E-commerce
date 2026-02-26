import type { ProductoFiltro } from "@chia/shared";
import Image from "next/image";
import Link from "next/link";
import AddToCartButton from "@/components/cart/AddToCartButton";
import CartLink from "@/components/cart/CartLink";
import { parseCatalogoFilters, toCatalogoQueryString, type CatalogoSearchParams } from "@/lib/catalogo/filtros";
import { listCatalogoProductos } from "@/lib/catalogo/repository";

type Props = {
  searchParams?: Promise<CatalogoSearchParams> | CatalogoSearchParams;
};

const arsFormatter = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

function buildFilterHref(current: ProductoFiltro, patch: Partial<ProductoFiltro>) {
  const query = toCatalogoQueryString({ ...current, ...patch });
  return query ? `/catalogo?${query}` : "/catalogo";
}

export default async function CatalogoPage({ searchParams }: Props) {
  const resolved = await Promise.resolve(searchParams ?? {});
  const filters = parseCatalogoFilters(resolved);
  const resultado = await listCatalogoProductos(filters);

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <div className="bg-grid-soft h-full w-full" />
      </div>
      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="panel-surface rounded-3xl border border-[#587055]/15 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-[#587055]">Catálogo</p>
              <h1 className="font-brand text-4xl leading-tight text-[#0B3816] sm:text-5xl">Productos CHÍA</h1>
              <p className="mt-2 text-sm text-[#0B3816]/75">
                {resultado.total} producto(s) encontrados. Fuente: <span className="font-medium uppercase tracking-[0.15em] text-[#587055]">{resultado.source}</span>
              </p>
              {resultado.warnings[0] ? <p className="mt-2 text-sm text-[#587055]">{resultado.warnings[0]}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Link href="/" className="rounded-full border border-[#8BA37D]/40 bg-white/70 px-4 py-2 text-sm text-[#0B3816] hover:bg-[#F0ECDF]">Inicio</Link>
              <Link href="/api/catalogo/productos" className="rounded-full border border-[#B8858E]/35 bg-[#B8858E]/10 px-4 py-2 text-sm text-[#0B3816] hover:bg-[#B8858E]/20">API catálogo</Link>
              <CartLink />
            </div>
          </div>
        </header>

        <section className="mt-5 grid gap-5 lg:grid-cols-[18rem_1fr]">
          <aside className="panel-surface h-fit rounded-3xl border border-[#587055]/15 p-5">
            <div className="mb-4 flex items-center gap-3">
              <Image src="/branding/logo-simplificado.png" alt="Símbolo CHÍA" width={44} height={44} className="h-11 w-11 rounded-full" />
              <div>
                <h2 className="font-brand text-2xl leading-none text-[#0B3816]">Filtros</h2>
                <p className="text-xs uppercase tracking-[0.2em] text-[#587055]">Paso 2 / Paso 4</p>
              </div>
            </div>

            <form action="/catalogo" method="get" className="space-y-4">
              <div>
                <label htmlFor="busqueda" className="mb-1 block text-sm font-medium text-[#0B3816]">Búsqueda</label>
                <input id="busqueda" name="busqueda" defaultValue={filters.busqueda ?? ""} placeholder="chia, aceite, pack..." className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-[#587055]" />
              </div>

              <div>
                <label htmlFor="categoria" className="mb-1 block text-sm font-medium text-[#0B3816]">Categoría</label>
                <select id="categoria" name="categoria" defaultValue={filters.categoria ?? ""} className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-[#587055]">
                  <option value="">Todas</option>
                  {resultado.categorias.map((categoria) => (
                    <option key={categoria} value={categoria}>{categoria}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="precioMinCents" className="mb-1 block text-sm font-medium text-[#0B3816]">Min (centavos)</label>
                  <input id="precioMinCents" name="precioMinCents" type="number" min="0" step="100" defaultValue={filters.precioMinCents ?? ""} className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-[#587055]" />
                </div>
                <div>
                  <label htmlFor="precioMaxCents" className="mb-1 block text-sm font-medium text-[#0B3816]">Max (centavos)</label>
                  <input id="precioMaxCents" name="precioMaxCents" type="number" min="0" step="100" defaultValue={filters.precioMaxCents ?? ""} className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-[#587055]" />
                </div>
              </div>

              <div>
                <label htmlFor="orden" className="mb-1 block text-sm font-medium text-[#0B3816]">Orden</label>
                <select id="orden" name="orden" defaultValue={filters.orden ?? ""} className="w-full rounded-2xl border border-[#8BA37D]/45 bg-white/80 px-4 py-2.5 text-sm outline-none focus:border-[#587055]">
                  <option value="">Relevancia</option>
                  <option value="novedades">Novedades</option>
                  <option value="precio_asc">Precio ascendente</option>
                  <option value="precio_desc">Precio descendente</option>
                </select>
              </div>

              <div className="flex gap-2">
                <button type="submit" className="flex-1 rounded-2xl bg-[#0B3816] px-4 py-2.5 text-sm font-medium text-[#F0ECDF] hover:bg-[#587055]">Aplicar</button>
                <Link href="/catalogo" className="rounded-2xl border border-[#587055]/20 bg-white/70 px-4 py-2.5 text-sm text-[#0B3816] hover:bg-[#F0ECDF]">Limpiar</Link>
              </div>
            </form>

            <div className="mt-5 border-t border-[#587055]/10 pt-4">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-[#587055]">Accesos rápidos</p>
              <div className="flex flex-wrap gap-2">
                {resultado.categorias.map((categoria) => (
                  <Link key={categoria} href={buildFilterHref(filters, { categoria })} className="rounded-full border border-[#8BA37D]/35 bg-[#F0ECDF] px-3 py-1.5 text-xs text-[#587055] hover:text-[#0B3816]">
                    {categoria}
                  </Link>
                ))}
              </div>
            </div>
          </aside>

          <section>
            {resultado.items.length === 0 ? (
              <div className="panel-surface rounded-3xl border border-[#587055]/15 p-8 text-center">
                <h2 className="font-brand text-3xl text-[#0B3816]">Sin resultados</h2>
                <p className="mt-2 text-sm text-[#0B3816]/75">Ajustá filtros o volvé al listado completo.</p>
                <Link href="/catalogo" className="mt-4 inline-flex rounded-2xl bg-[#0B3816] px-4 py-2.5 text-sm font-medium text-[#F0ECDF] hover:bg-[#587055]">Ver catálogo completo</Link>
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {resultado.items.map((producto) => (
                  <article key={producto.id} className="panel-surface group overflow-hidden rounded-3xl border border-[#587055]/15 p-4">
                    <Link href={`/catalogo/${producto.slug}`} className="block">
                      <div className="relative mb-4 aspect-[4/3] overflow-hidden rounded-2xl border border-[#587055]/10 bg-[#F0ECDF]">
                        <Image src={producto.imagenes[0] ?? "/branding/logo-principal-verde.png"} alt={producto.nombre} fill className="object-cover transition duration-300 group-hover:scale-[1.03]" sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" />
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-[#587055] via-[#8BA37D] to-[#B8858E]" />
                        <span className="absolute left-3 top-3 rounded-full bg-white/85 px-2.5 py-1 text-xs tracking-wide text-[#587055]">{producto.categoria}</span>
                      </div>
                    </Link>

                    <h2 className="line-clamp-2 font-brand text-2xl leading-tight text-[#0B3816]">
                      <Link href={`/catalogo/${producto.slug}`}>{producto.nombre}</Link>
                    </h2>
                    <p className="mt-2 line-clamp-3 text-sm text-[#0B3816]/75">{producto.descripcion}</p>

                    <div className="mt-4">
                      <p className="text-2xl font-semibold text-[#0B3816]">{arsFormatter.format(producto.precioCents / 100)}</p>
                      <p className="text-xs text-[#587055]">Stock: {producto.stock}</p>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2">
                      <AddToCartButton productId={producto.id} label="Agregar" className="rounded-2xl border border-[#587055]/20 bg-white/80 px-3 py-2 text-sm font-medium text-[#0B3816] transition hover:bg-[#F0ECDF]" />
                      <Link href={`/catalogo/${producto.slug}`} className="rounded-2xl bg-[#0B3816] px-3 py-2 text-center text-sm font-medium text-[#F0ECDF] hover:bg-[#587055]">Ver</Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}