import { NextResponse } from "next/server";
import { z } from "zod";
import { getOrderById } from "@/lib/commerce/orders-store";
import { createPaymentRecord, updatePaymentRecord } from "@/lib/payments/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const bodySchema = z.object({
  orderId: z.string(),
});

export async function POST(request: Request) {
  try {
    const { orderId } = bodySchema.parse(await request.json());
    const order = await getOrderById(orderId);
    if (!order) return NextResponse.json({ ok: false, error: "Orden no encontrada" }, { status: 404 });

    const apiBase = process.env.GALIOPAY_API_BASE_URL?.trim();
    const apiKey = process.env.GALIOPAY_API_KEY?.trim();
    const clientId = process.env.GALIOPAY_CLIENT_ID?.trim();
    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
    if (!apiBase || !apiKey || !clientId) {
      return NextResponse.json({ ok: false, error: "Faltan variables de Galio Pay en .env.local" }, { status: 400 });
    }

    const payment = await createPaymentRecord({
      orderId: order.id,
      provider: "galiopay",
      providerPaymentId: null,
      status: "PENDIENTE_PAGO",
      amountCents: order.totalCents,
      currency: order.currency,
      lastEventId: null,
      rawPayload: null,
    });

    const candidatePayload = {
      items: order.itemsSnapshot.map((item) => ({
        title: item.nombre,
        quantity: item.qty,
        unitPrice: Number(item.precioCents.toFixed(2)),
        currencyId: order.currency,
      })),
      referenceId: order.id,
      description: `Orden ${order.id} - CHIA`,
      backUrl: {
        success: `${appUrl}/ordenes/${order.id}?galio=success`,
        failure: `${appUrl}/ordenes/${order.id}?galio=failure`,
      },
    };

    let remoteResult: unknown = null;
    let remoteError: string | null = null;
    let remoteStatus: number | null = null;
    let remoteStatusText: string | null = null;

    try {
      const response = await fetch(`${apiBase.replace(/\/$/, "")}/payment-links`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "x-client-id": clientId,
        },
        body: JSON.stringify(candidatePayload),
      });

      remoteStatus = response.status;
      remoteStatusText = response.statusText;

      const rawText = await response.text();
      try {
        remoteResult = rawText ? JSON.parse(rawText) : null;
      } catch {
        remoteResult = { rawText };
      }

      if (!response.ok) {
        remoteError = `Galio Pay respondio con error (${response.status} ${response.statusText})`;
      }
    } catch (error) {
      remoteError = error instanceof Error ? error.message : "No se pudo contactar Galio Pay";
    }

    const remoteUrl =
      typeof remoteResult === "object" && remoteResult !== null && "url" in remoteResult && typeof (remoteResult as { url?: unknown }).url === "string"
        ? (remoteResult as { url: string }).url
        : null;

    await updatePaymentRecord(payment.id, {
      status: remoteError ? "PENDIENTE_GALIO_CONFIG" : "SOLICITUD_CREADA",
      rawPayload: {
        request: candidatePayload,
        response: remoteResult,
        remoteStatus,
        remoteStatusText,
        remoteError,
      },
    });

    return NextResponse.json({
      ok: true,
      provider: "galiopay",
      paymentId: payment.id,
      status: remoteError ? "PENDIENTE_GALIO_CONFIG" : "SOLICITUD_CREADA",
      mensaje: remoteError
        ? "Se registro la solicitud, pero la respuesta de Galio Pay requiere ajuste de endpoint/payload segun tu cuenta."
        : "Solicitud de pago creada en Galio Pay.",
      remoteError,
      remoteResult,
      remoteStatus,
      remoteStatusText,
      checkoutUrl: remoteUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo crear solicitud Galio Pay" },
      { status: 400 },
    );
  }
}
