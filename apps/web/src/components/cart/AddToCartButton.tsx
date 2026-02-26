"use client";

import { useState } from "react";
import { useCart } from "./CartProvider";

export default function AddToCartButton({
  productId,
  label = "Agregar al carrito",
  className,
}: {
  productId: string;
  label?: string;
  className?: string;
}) {
  const { addItem, getQty } = useCart();
  const [justAdded, setJustAdded] = useState(false);
  const qty = getQty(productId);

  return (
    <button
      type="button"
      onClick={() => {
        addItem(productId, 1);
        setJustAdded(true);
        window.setTimeout(() => setJustAdded(false), 1000);
      }}
      className={
        className ??
        "rounded-2xl bg-[#0B3816] px-4 py-2.5 text-sm font-medium text-[#F0ECDF] transition hover:bg-[#587055]"
      }
    >
      {justAdded ? "Agregado" : label}
      {qty > 0 ? ` (${qty})` : ""}
    </button>
  );
}
