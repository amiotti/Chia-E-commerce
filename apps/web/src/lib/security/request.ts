import { NextResponse } from "next/server";

type RateLimitOptions = {
  namespace: string;
  limit: number;
  windowMs: number;
};

type RateEntry = {
  count: number;
  resetAt: number;
};

const globalStore = globalThis as typeof globalThis & { __chiaRateStore?: Map<string, RateEntry> };
const rateStore = globalStore.__chiaRateStore ?? new Map<string, RateEntry>();
if (!globalStore.__chiaRateStore) globalStore.__chiaRateStore = rateStore;

function getClientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function rateLimit(request: Request, options: RateLimitOptions) {
  const now = Date.now();
  const key = `${options.namespace}:${getClientIp(request)}`;
  const current = rateStore.get(key);

  if (!current || current.resetAt <= now) {
    rateStore.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  if (current.count >= options.limit) {
    const retryAfter = Math.max(1, Math.ceil((current.resetAt - now) / 1000));
    return NextResponse.json(
      { ok: false, error: "Demasiadas solicitudes. Intentá nuevamente en unos segundos." },
      {
        status: 429,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Retry-After": String(retryAfter),
        },
      },
    );
  }

  current.count += 1;
  rateStore.set(key, current);
  return null;
}

export function requireSameOriginMutation(request: Request) {
  const method = request.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return null;

  const origin = request.headers.get("origin");
  if (!origin) {
    return NextResponse.json(
      { ok: false, error: "Falta header Origin en solicitud sensible." },
      { status: 403, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }

  const requestOrigin = new URL(request.url).origin;
  if (origin !== requestOrigin) {
    return NextResponse.json(
      { ok: false, error: "Origin inválido para esta operación." },
      { status: 403, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }

  return null;
}

export function requireWebhookSharedSecret(request: Request, secretEnvValue: string | undefined, providerName: string) {
  const expected = secretEnvValue?.trim();
  if (!expected) return null;

  const url = new URL(request.url);
  const provided =
    request.headers.get("x-webhook-secret")
    ?? request.headers.get("x-signature-secret")
    ?? url.searchParams.get("secret")
    ?? url.searchParams.get("token");

  if (!provided || provided !== expected) {
    return NextResponse.json(
      { ok: false, error: `Webhook ${providerName} rechazado: secreto inválido.` },
      { status: 401, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }

  return null;
}

