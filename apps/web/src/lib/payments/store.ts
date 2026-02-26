import "server-only";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { requireSupabaseServiceClient } from "@/lib/supabase/server";

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

function toDbRow(payment: PaymentRecord) {
  return {
    id: payment.id,
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

const dbRowSchema = z.object({
  id: z.string().uuid().or(z.string()),
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

export async function createPaymentRecord(input: Omit<PaymentRecord, "id" | "createdAt" | "updatedAt">) {
  const now = new Date().toISOString();
  const payment = paymentRecordSchema.parse({
    id: randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  });

  const client = requireSupabaseServiceClient() as any;
  const { error } = await client.from("payments").insert(toDbRow(payment));
  if (error) throw new Error(`Error creando payment en Supabase: ${error.message}`);
  return payment;
}

export async function updatePaymentRecord(id: string, patch: Partial<PaymentRecord>) {
  const client = requireSupabaseServiceClient() as any;
  const { data: currentData, error: currentError } = await client
    .from("payments")
    .select("id, order_id, provider, provider_payment_id, status, amount_cents, currency, last_event_id, raw_payload, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (currentError) throw new Error(`Error leyendo payment en Supabase: ${currentError.message}`);
  if (!currentData) return null;

  const current = fromDbRow(dbRowSchema.parse(currentData));
  const next = paymentRecordSchema.parse({
    ...current,
    ...patch,
    id: current.id,
    updatedAt: new Date().toISOString(),
  });

  const { error } = await client.from("payments").upsert(toDbRow(next), { onConflict: "id" });
  if (error) throw new Error(`Error actualizando payment en Supabase: ${error.message}`);
  return next;
}

export async function getPaymentRecordById(id: string) {
  const client = requireSupabaseServiceClient() as any;
  const { data, error } = await client
    .from("payments")
    .select("id, order_id, provider, provider_payment_id, status, amount_cents, currency, last_event_id, raw_payload, created_at, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`Error leyendo payment por id en Supabase: ${error.message}`);
  if (!data) return null;
  return fromDbRow(dbRowSchema.parse(data));
}

export async function listPaymentsByOrder(orderId: string) {
  const client = requireSupabaseServiceClient() as any;
  const { data, error } = await client
    .from("payments")
    .select("id, order_id, provider, provider_payment_id, status, amount_cents, currency, last_event_id, raw_payload, created_at, updated_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Error listando payments en Supabase: ${error.message}`);
  const parsed = z.array(dbRowSchema).safeParse(data ?? []);
  if (!parsed.success) throw new Error("La tabla payments devolvió filas inválidas.");
  return parsed.data.map(fromDbRow);
}

export async function findPaymentByProviderPaymentId(provider: "mercadopago" | "galiopay", providerPaymentId: string) {
  const client = requireSupabaseServiceClient() as any;
  const { data, error } = await client
    .from("payments")
    .select("id, order_id, provider, provider_payment_id, status, amount_cents, currency, last_event_id, raw_payload, created_at, updated_at")
    .eq("provider", provider)
    .eq("provider_payment_id", providerPaymentId)
    .maybeSingle();
  if (error) throw new Error(`Error buscando payment por provider_payment_id: ${error.message}`);
  if (!data) return null;
  return fromDbRow(dbRowSchema.parse(data));
}

export async function findLatestPaymentByOrder(provider: "mercadopago" | "galiopay", orderId: string) {
  const client = requireSupabaseServiceClient() as any;
  const { data, error } = await client
    .from("payments")
    .select("id, order_id, provider, provider_payment_id, status, amount_cents, currency, last_event_id, raw_payload, created_at, updated_at")
    .eq("provider", provider)
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(`Error buscando payment por orden/proveedor en Supabase: ${error.message}`);
  if (!data) return null;
  return fromDbRow(dbRowSchema.parse(data));
}
