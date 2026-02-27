import Link from "next/link";
import { requireAdminPage } from "@/lib/auth/guards";
import { readAdminProductos } from "@/lib/catalogo/admin-store";
import AdminProductosPanel from "./AdminProductosPanel";

export const dynamic = "force-dynamic";

export default async function AdminProductosPage() {
  const session = await requireAdminPage("/admin/productos");
  const initialItems = await readAdminProductos();
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 opacity-25"><div className="bg-grid-soft h-full w-full" /></div>
      <div className="relative mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="panel-surface mb-5 rounded-3xl border border-[#587055]/15 p-5 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div><p className="text-xs uppercase tracking-[0.3em] text-[#587055]">Panel de productos</p><h1 className="font-brand text-4xl leading-tight text-[#0B3816] sm:text-5xl">Gestión de productos</h1><p className="mt-2 text-sm text-[#0B3816]/75 sm:text-base">Cargá, importá y administrá el catálogo de CHÍA Espacio Saludable desde un solo lugar.</p><p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#587055]">Sesión: {session.email} ({session.role})</p></div>
            <div className="flex flex-wrap gap-2"><Link href="/" className="rounded-full border border-[#8BA37D]/40 bg-white/70 px-4 py-2 text-sm text-[#0B3816] hover:bg-[#F0ECDF]">Inicio</Link><Link href="/catalogo" className="rounded-full border border-[#587055]/25 bg-[#0B3816] px-4 py-2 text-sm text-[#F0ECDF] hover:bg-[#587055]">Ver catálogo</Link><Link href="/cuenta" className="rounded-full border border-[#B8858E]/35 bg-[#B8858E]/10 px-4 py-2 text-sm text-[#0B3816] hover:bg-[#B8858E]/20">Mi cuenta</Link></div>
          </div>
        </header>
        <AdminProductosPanel initialItems={initialItems} />
      </div>
    </main>
  );
}