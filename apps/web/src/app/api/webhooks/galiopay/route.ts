import { NextResponse } from "next/server";
import { findLatestPaymentByOrder, findPaymentByProviderPaymentId, updatePaymentRecord } from "@/lib/payments/store";
import { updateOrderStatus } from "@/lib/commerce/orders-store";
import { rateLimit, requireWebhookSharedSecret } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function asObject(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function pickString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
    if (typeof value === "number") return String(value);
  }
  return null;
}

function mapGalioStatusToOrderStatus(status: string | null) {
  const normalized = (status ?? "").toLowerCase();
  if (["approved", "paid", "completed", "success", "succeeded"].includes(normalized)) return "PAGADA" as const;
  if (["refunded", "refund", "reimbursed"].includes(normalized)) return "REEMBOLSADA" as const;
  if (["cancelled", "canceled", "failed", "rejected", "expired"].includes(normalized)) return "CANCELADA" as const;
  if (["pending", "created", "processing", "in_process"].includes(normalized)) return "PENDIENTE_PAGO" as const;
  return null;
}

export async function POST(request: Request) {
  const secretCheck = requireWebhookSharedSecret(request, process.env.GALIOPAY_WEBHOOK_SECRET, "Galio Pay");
  if (secretCheck) return secretCheck;
  const limited = rateLimit(request, { namespace: "webhook:galiopay", limit: 120, windowMs: 60_000 });
  if (limited) return limited;

  const body = await request.json().catch(() => ({}));
  const root = asObject(body);
  const data = asObject(root.data);
  const paymentNode = asObject(root.payment);
  const nestedPaymentNode = asObject(data.payment);
  const eventNode = asObject(root.event);
  const eventData = asObject(eventNode.data);

  const eventId = pickString(root.id, eventNode.id, data.id, eventData.id);
  const providerPaymentId = pickString(
    root.paymentId,
    root.payment_id,
    paymentNode.id,
    data.paymentId,
    data.payment_id,
    nestedPaymentNode.id,
    eventData.paymentId,
    eventData.payment_id,
  );
  const orderId = pickString(
    root.referenceId,
    root.reference_id,
    root.externalReference,
    root.external_reference,
    data.referenceId,
    data.reference_id,
    data.externalReference,
    data.external_reference,
    paymentNode.referenceId,
    paymentNode.reference_id,
    nestedPaymentNode.referenceId,
    nestedPaymentNode.reference_id,
    eventData.referenceId,
    eventData.reference_id,
  );
  const rawStatus = pickString(
    root.status,
    root.state,
    data.status,
    data.state,
    paymentNode.status,
    paymentNode.state,
    nestedPaymentNode.status,
    nestedPaymentNode.state,
    eventData.status,
    eventData.state,
    root.type,
    eventNode.type,
  );

  let payment = providerPaymentId ? await findPaymentByProviderPaymentId("galiopay", providerPaymentId) : null;
  if (!payment && orderId) {
    payment = await findLatestPaymentByOrder("galiopay", orderId);
  }

  if (payment) {
    await updatePaymentRecord(payment.id, {
      providerPaymentId: providerPaymentId ?? payment.providerPaymentId,
      status: `GALIO_${(rawStatus ?? "EVENT").toUpperCase()}`,
      lastEventId: eventId,
      rawPayload: { webhook: body },
    });
  }

  const nextOrderStatus = mapGalioStatusToOrderStatus(rawStatus);
  if (orderId && nextOrderStatus) {
    await updateOrderStatus(orderId, nextOrderStatus);
  }

  return NextResponse.json({
    ok: true,
    provider: "galiopay",
    reconciled: true,
    eventId,
    providerPaymentId,
    orderId,
    rawStatus,
    orderStatusApplied: nextOrderStatus,
    paymentRecordUpdated: Boolean(payment),
  });
}
