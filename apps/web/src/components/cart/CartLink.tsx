"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export default function CartLink({ className }: { className?: string }) {
  const { totalUnits } = useCart();

  return (
    <Link
      href="/carrito"
      className={
        className ??
        "rounded-full border border-[#587055]/20 bg-white/80 px-3 py-2 text-sm text-[#0B3816] hover:bg-[#F0ECDF]"
      }
    >
      Carrito ({totalUnits})
    </Link>
  );
}
