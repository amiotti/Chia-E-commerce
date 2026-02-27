"use client";

import Link from "next/link";
import { useCart } from "./CartProvider";

export default function CartLink({
  className,
  variant = "text",
}: {
  className?: string;
  variant?: "text" | "icon";
}) {
  const { totalUnits } = useCart();

  if (variant === "icon") {
    return (
      <Link
        href="/carrito"
        aria-label={`Carrito con ${totalUnits} item(s)`}
        className={
          className ??
          "relative inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#587055]/20 bg-white/80 text-[#0B3816] shadow-[0_8px_20px_rgba(11,56,22,0.10)] backdrop-blur-md transition hover:-translate-y-0.5 hover:scale-[1.03] hover:bg-[#F0ECDF]"
        }
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
          <path
            d="M3.5 5.5h1.9l1.7 8.1a1 1 0 0 0 1 .8h8a1 1 0 0 0 1-.8l1.3-5.6H7.1"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="10" cy="18.3" r="1.2" fill="currentColor" />
          <circle cx="16.7" cy="18.3" r="1.2" fill="currentColor" />
        </svg>
        <span className="absolute -right-1.5 -top-1.5 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-[#B8858E] px-1 text-[10px] font-semibold leading-none text-white">
          {totalUnits}
        </span>
      </Link>
    );
  }

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
