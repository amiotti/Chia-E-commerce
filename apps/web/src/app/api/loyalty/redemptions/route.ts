import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthApi } from "@/lib/auth/guards";
import { redeemProductWithPoints } from "@/lib/loyalty/store";
import { rateLimit, requireSameOriginMutation } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const payloadSchema = z.object({ productId: z.string().min(1) });

export async function POST(request: Request) {
  const originCheck = requireSameOriginMutation(request);
  if (originCheck) return originCheck;
  const limited = rateLimit(request, { namespace: "loyalty:redemptions:create", limit: 12, windowMs: 60_000 });
  if (limited) return limited;
  const auth = await requireAuthApi();
  if (!auth.ok) return auth.response;
  try {
    const payload = payloadSchema.parse(await request.json());
    const result = await redeemProductWithPoints(auth.session.userId, payload.productId);
    return NextResponse.json({ ok: true, result }, { status: 201, headers: { "Content-Type": "application/json; charset=utf-8" } });
  } catch (error) {
    return NextResponse.json({ ok: false, error: error instanceof Error ? error.message : "No se pudo realizar el canje." }, { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } });
  }
}