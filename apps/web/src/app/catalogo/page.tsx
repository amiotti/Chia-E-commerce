import SiteHeader from "@/components/layout/SiteHeader";
import { parseCatalogoFilters, type CatalogoSearchParams } from "@/lib/catalogo/filtros";
import { listCatalogoProductos } from "@/lib/catalogo/repository";
import CatalogoClient from "./CatalogoClient";

type Props = {
  searchParams?: Promise<CatalogoSearchParams> | CatalogoSearchParams;
};

export default async function CatalogoPage({ searchParams }: Props) {
  const resolved = await Promise.resolve(searchParams ?? {});
  const filters = parseCatalogoFilters(resolved);
  const allProductos = await listCatalogoProductos({});

  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-25">
        <div className="bg-grid-soft h-full w-full" />
      </div>
      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <SiteHeader current="catalogo" />

        <header className="panel-surface rounded-3xl border border-[#587055]/15 p-5 sm:p-6">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#587055]">Catalogo</p>
            <h1 className="font-brand text-4xl leading-tight text-[#0B3816] sm:text-5xl">Productos CHIA</h1>
            <p className="mt-2 text-sm text-[#0B3816]/75">
              {allProductos.total} producto(s) disponibles para acompanar una alimentacion saludable y consciente.
            </p>
          </div>
        </header>

        <CatalogoClient
          allItems={allProductos.items}
          categorias={allProductos.categorias}
          initialFilters={filters}
        />
      </div>
    </main>
  );
}
