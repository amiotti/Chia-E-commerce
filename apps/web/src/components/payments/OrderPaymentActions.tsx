"use client";

import { useState } from "react";

type PaymentActionState =
  | { type: "idle" }
  | { type: "loading"; provider: "galiopay" }
  | { type: "result"; message: string }
  | { type: "error"; message: string };

export default function OrderPaymentActions({
  orderId,
}: {
  orderId: string;
}) {
  const [state, setState] = useState<PaymentActionState>({ type: "idle" });

  async function createGalioRequest() {
    setState({ type: "loading", provider: "galiopay" });
    try {
      const response = await fetch("/api/pagos/galiopay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await response.json();
      if (!response.ok || !data.ok) {
        throw new Error(data.error ?? "No se pudo crear la solicitud en Galio Pay");
      }

      if (typeof data.checkoutUrl === "string" && data.checkoutUrl.startsWith("http")) {
        window.location.href = data.checkoutUrl;
        return;
      }

      setState({
        type: "result",
        message: data.mensaje ?? "Solicitud registrada en Galio Pay.",
      });
    } catch (error) {
      setState({ type: "error", message: error instanceof Error ? error.message : "Error inesperado" });
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <button
        type="button"
        onClick={createGalioRequest}
        disabled={state.type === "loading"}
        className="w-full rounded-2xl bg-[#0B3816] px-4 py-2.5 text-sm font-medium text-[#F0ECDF] transition hover:bg-[#587055] disabled:opacity-60"
      >
        {state.type === "loading" && state.provider === "galiopay" ? "Solicitando..." : "Pagar por transferencia (Galio Pay)"}
      </button>

      {state.type === "result" ? (
        <div className="rounded-xl border border-[#8BA37D]/35 bg-[#8BA37D]/12 px-3 py-2 text-sm text-[#0B3816]">
          {state.message}
        </div>
      ) : null}
      {state.type === "error" ? (
        <div className="rounded-xl border border-[#B8858E]/35 bg-[#B8858E]/12 px-3 py-2 text-sm text-[#0B3816]">
          {state.message}
        </div>
      ) : null}
    </div>
  );
}