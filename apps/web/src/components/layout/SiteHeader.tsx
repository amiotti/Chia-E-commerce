import Image from "next/image";
import Link from "next/link";
import CartLink from "@/components/cart/CartLink";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { getCurrentSession } from "@/lib/auth/session";

type NavKey = "catalogo" | "bienestar" | "puntos" | "cuenta";
const baseNavItems: Array<{ key: Exclude<NavKey, "puntos">; label: string; href: string }> = [
  { key: "catalogo", label: "Catálogo", href: "/catalogo" },
  { key: "bienestar", label: "Bienestar", href: "/bienestar" },
  { key: "cuenta", label: "Cuenta", href: "/cuenta" },
];

export default async function SiteHeader({ current }: { current?: NavKey }) {
  const session = await getCurrentSession();
  const navItems = session && session.role !== "admin"
    ? [...baseNavItems.slice(0, 2), { key: "puntos" as const, label: "Puntos", href: "/cuenta/puntos" }, baseNavItems[2]]
    : baseNavItems;

  return (
    <nav className="panel-surface mb-6 rounded-3xl border border-[#587055]/15 px-4 py-3 sm:px-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/" className="flex items-center gap-3">
          <div className="relative h-12 w-12 overflow-hidden rounded-full ring-1 ring-[#587055]/15"><Image src="/branding/logo-simplificado.png" alt="Logo CHIA" fill className="object-cover" /></div>
          <div><p className="font-brand text-xl leading-none text-[#0B3816]">CHIA</p><p className="text-[10px] uppercase tracking-[0.3em] text-[#587055]">Espacio saludable</p></div>
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-xs sm:justify-end">
          <ThemeToggle variant="inline" />
          {session ? <CartLink variant="icon" /> : null}
          {navItems.map((item) => {
            const active = item.key === current;
            return <Link key={item.key} href={item.href} aria-current={active ? "page" : undefined} className={active ? "rounded-full border border-[#587055]/35 bg-[#0B3816] px-3 py-1.5 text-[#F0ECDF]" : "rounded-full border border-[#8BA37D]/40 bg-white/70 px-3 py-1.5 text-[#0B3816] transition hover:border-[#587055]/60 hover:bg-[#F0ECDF]"}>{item.label}</Link>;
          })}
        </div>
      </div>
    </nav>
  );
}