import { NextResponse } from "next/server";
import { findLatestPaymentByOrder, findPaymentByProviderPaymentId, updatePaymentRecord } from "@/lib/payments/store";
import { updateOrderStatus } from "@/lib/commerce/orders-store";
import { rateLimit, requireWebhookSharedSecret } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mapMpPaymentStatusToOrderStatus(status: string | null) {
  const normalized = (status ?? "").toLowerCase();
  if (["approved", "accredited"].includes(normalized)) return "PAGADA" as const;
  if (["refunded", "charged_back"].includes(normalized)) return "REEMBOLSADA" as const;
  if (["cancelled", "rejected"].includes(normalized)) return "CANCELADA" as const;
  if (["pending", "in_process", "in_mediation", "authorized"].includes(normalized)) return "PENDIENTE_PAGO" as const;
  return null;
}

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

export async function POST(request: Request) {
  const secretCheck = requireWebhookSharedSecret(request, process.env.MERCADOPAGO_WEBHOOK_SECRET, "Mercado Pago");
  if (secretCheck) return secretCheck;
  const limited = rateLimit(request, { namespace: "webhook:mercadopago", limit: 120, windowMs: 60_000 });
  if (limited) return limited;

  const url = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const bodyObj = asObject(body);
  const data = asObject(bodyObj.data);

  const eventId = typeof bodyObj.id === "string" ? bodyObj.id : null;
  const type = typeof bodyObj.type === "string" ? bodyObj.type : url.searchParams.get("type");
  const topic = typeof bodyObj.topic === "string" ? bodyObj.topic : url.searchParams.get("topic");

  const paymentIdCandidate =
    typeof data.id === "string"
      ? data.id
      : typeof data.id === "number"
        ? String(data.id)
        : typeof bodyObj["data.id"] === "string"
          ? (bodyObj["data.id"] as string)
          : typeof url.searchParams.get("data.id") === "string"
            ? url.searchParams.get("data.id")
            : typeof url.searchParams.get("id") === "string"
              ? url.searchParams.get("id")
              : null;

  const isPaymentEvent = [type, topic].some((value) => (value ?? "").toLowerCase().includes("payment"));

  if (!isPaymentEvent || !paymentIdCandidate) {
    return NextResponse.json({
      ok: true,
      mensaje: "Webhook Mercado Pago recibido (sin reconciliacion: no es evento payment o falta id)",
      recibido: body,
    });
  }

  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
  if (!accessToken) {
    return NextResponse.json({ ok: false, error: "Falta MERCADOPAGO_ACCESS_TOKEN" }, { status: 400 });
  }

  const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentIdCandidate}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const mpPayment = await mpResponse.json().catch(() => ({}));

  if (!mpResponse.ok) {
    return NextResponse.json(
      { ok: false, error: "No se pudo consultar el pago en Mercado Pago", paymentIdCandidate, details: mpPayment },
      { status: 400 },
    );
  }

  const mpObj = asObject(mpPayment);
  const externalReference = typeof mpObj.external_reference === "string" ? mpObj.external_reference : null;
  const mpStatus = typeof mpObj.status === "string" ? mpObj.status : null;
  const providerPaymentId = typeof mpObj.id === "number" ? String(mpObj.id) : typeof mpObj.id === "string" ? mpObj.id : paymentIdCandidate;

  let payment = await findPaymentByProviderPaymentId("mercadopago", providerPaymentId);
  if (!payment && externalReference) {
    payment = await findLatestPaymentByOrder("mercadopago", externalReference);
  }

  if (payment) {
    await updatePaymentRecord(payment.id, {
      providerPaymentId,
      status: `MP_${(mpStatus ?? "UNKNOWN").toUpperCase()}`,
      lastEventId: eventId,
      rawPayload: {
        webhook: body,
        mpPayment,
      },
    });
  }

  const nextOrderStatus = mapMpPaymentStatusToOrderStatus(mpStatus);
  if (externalReference && nextOrderStatus) {
    await updateOrderStatus(externalReference, nextOrderStatus);
  }

  return NextResponse.json({
    ok: true,
    provider: "mercadopago",
    reconciled: true,
    paymentId: providerPaymentId,
    orderId: externalReference,
    mpStatus,
    orderStatusApplied: nextOrderStatus,
    paymentRecordUpdated: Boolean(payment),
  });
}
