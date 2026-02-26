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
    if (!order) {
      return NextResponse.json({ ok: false, error: "Orden no encontrada" }, { status: 404 });
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN?.trim();
    if (!accessToken) {
      return NextResponse.json({ ok: false, error: "Falta MERCADOPAGO_ACCESS_TOKEN en .env.local" }, { status: 400 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
    const isLocalAppUrl = /localhost|127\.0\.0\.1/i.test(appUrl);

    const payment = await createPaymentRecord({
      orderId: order.id,
      provider: "mercadopago",
      providerPaymentId: null,
      status: "PENDIENTE_PAGO",
      amountCents: order.totalCents,
      currency: order.currency,
      lastEventId: null,
      rawPayload: null,
    });

    const preferencePayload = {
      external_reference: order.id,
      items: order.itemsSnapshot.map((item) => ({
        id: item.productId,
        title: item.nombre,
        quantity: item.qty,
        currency_id: order.currency,
        unit_price: Number((item.precioCents / 100).toFixed(2)),
      })),
      metadata: {
        order_id: order.id,
        payment_record_id: payment.id,
      },
      back_urls: {
        success: `${appUrl}/ordenes/${order.id}?mp=success`,
        failure: `${appUrl}/ordenes/${order.id}?mp=failure`,
        pending: `${appUrl}/ordenes/${order.id}?mp=pending`,
      },
      // En localhost MP puede responder invalid_auto_return aunque back_urls exista.
      auto_return: isLocalAppUrl ? undefined : "approved",
      notification_url: process.env.MERCADOPAGO_WEBHOOK_SECRET ? `${appUrl}/api/webhooks/mercadopago` : undefined,
    };

    const mpResponse = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preferencePayload),
    });

    const mpJson = await mpResponse.json().catch(() => ({}));
    if (!mpResponse.ok) {
      await updatePaymentRecord(payment.id, {
        status: "ERROR_MP",
        rawPayload: {
          request: preferencePayload,
          response: mpJson,
        },
      });
      return NextResponse.json({ ok: false, error: "Mercado Pago devolvio un error", details: mpJson }, { status: 400 });
    }

    await updatePaymentRecord(payment.id, {
      providerPaymentId: typeof mpJson.id === "string" ? mpJson.id : null,
      status: "PREFERENCIA_CREADA",
      rawPayload: {
        request: preferencePayload,
        response: mpJson,
      },
    });

    return NextResponse.json({
      ok: true,
      paymentId: payment.id,
      provider: "mercadopago",
      preferenceId: mpJson.id ?? null,
      initPoint: mpJson.init_point ?? null,
      sandboxInitPoint: mpJson.sandbox_init_point ?? null,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo crear checkout de Mercado Pago" },
      { status: 400 },
    );
  }
}