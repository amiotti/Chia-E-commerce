"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export default function RedeemPointsButton({ productId, disabled = false }: { productId: string; disabled?: boolean }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRedeem() {
    setError(null);
    setSuccess(null);
    startTransition(async () => {
      try {
        const response = await fetch("/api/loyalty/redemptions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId }) });
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error(data.error ?? "No se pudo realizar el canje.");
        setSuccess(`Canje registrado: ${data.result.productName}.`);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error inesperado.");
      }
    });
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={handleRedeem} disabled={disabled || isPending} className="button-primary w-full rounded-2xl px-4 py-2.5 text-sm disabled:opacity-60">{isPending ? "Canjeando..." : "Canjear con puntos"}</button>
      {success ? <p className="text-xs text-[#587055]">{success}</p> : null}
      {error ? <p className="text-xs text-[#B8858E]">{error}</p> : null}
    </div>
  );
}