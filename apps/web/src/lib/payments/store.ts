import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireInstantAdminClient } from "@/lib/instant/server";

export const paymentRecordSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  provider: z.enum(["mercadopago", "galiopay"]),
  providerPaymentId: z.string().nullable().default(null),
  status: z.string(),
  amountCents: z.number().int().nonnegative(),
  currency: z.string().default("ARS"),
  lastEventId: z.string().nullable().default(null),
  rawPayload: z.unknown().nullable().default(null),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type PaymentRecord = z.infer<typeof paymentRecordSchema>;

const dbRowSchema = z.object({
  id: z.string(),
  order_id: z.string(),
  provider: z.string(),
  provider_payment_id: z.string().nullable().optional(),
  status: z.string(),
  amount_cents: z.number().int().nonnegative(),
  currency: z.string(),
  last_event_id: z.string().nullable().optional(),
  raw_payload: z.unknown().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().optional(),
});

function toDbRow(payment: PaymentRecord) {
  return {
    order_id: payment.orderId,
    provider: payment.provider,
    provider_payment_id: payment.providerPaymentId,
    status: payment.status,
    amount_cents: payment.amountCents,
    currency: payment.currency,
    last_event_id: payment.lastEventId,
    raw_payload: payment.rawPayload,
    created_at: payment.createdAt,
    updated_at: payment.updatedAt,
  };
}

function fromDbRow(row: z.infer<typeof dbRowSchema>): PaymentRecord {
  return paymentRecordSchema.parse({
    id: row.id,
    orderId: row.order_id,
    provider: row.provider,
    providerPaymentId: row.provider_payment_id ?? null,
    status: row.status,
    amountCents: row.amount_cents,
    currency: row.currency,
    lastEventId: row.last_event_id ?? null,
    rawPayload: row.raw_payload ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  });
}

async function readRawPayments() {
  const db = requireInstantAdminClient();
  const result = await db.query({ payments: {} });
  const parsed = z.array(dbRowSchema).safeParse((result as { payments?: unknown }).payments ?? []);
  if (!parsed.success) throw new Error("La entidad payments devolvio filas invalidas en InstantDB.");
  return parsed.data;
}

export async function createPaymentRecord(input: Omit<PaymentRecord, "id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const payment = paymentRecordSchema.parse({
    id: randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  });

  const db = requireInstantAdminClient();
  await db.transact(db.tx.payments[payment.id].update(toDbRow(payment)));
  return payment;
}

export async function updatePaymentRecord(id: string, patch: Partial<PaymentRecord>) {
  const current = await getPaymentRecordById(id);
  if (!current) return null;

  const next = paymentRecordSchema.parse({
    ...current,
    ...patch,
    id: current.id,
    updatedAt: new Date().toISOString(),
  });

  const db = requireInstantAdminClient();
  await db.transact(db.tx.payments[id].update(toDbRow(next)));
  return next;
}

export async function getPaymentRecordById(id: string) {
  const rows = await readRawPayments();
  const found = rows.find((row) => row.id === id);
  return found ? fromDbRow(found) : null;
}

export async function listPaymentsByOrder(orderId: string) {
  const rows = await readRawPayments();
  return rows
    .filter((row) => row.order_id === orderId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map(fromDbRow);
}

export async function findPaymentByProviderPaymentId(provider: "mercadopago" | "galiopay", providerPaymentId: string) {
  const rows = await readRawPayments();
  const found = rows.find((row) => row.provider === provider && row.provider_payment_id === providerPaymentId);
  return found ? fromDbRow(found) : null;
}

export async function findLatestPaymentByOrder(provider: "mercadopago" | "galiopay", orderId: string) {
  const rows = await readRawPayments();
  const found = rows
    .filter((row) => row.provider === provider && row.order_id === orderId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0];
  return found ? fromDbRow(found) : null;
}
