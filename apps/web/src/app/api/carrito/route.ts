import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthApi } from "@/lib/auth/guards";
import { getCartByUserId, setCartByUserId } from "@/lib/commerce/carts-store";
import { cartItemSchema } from "@/lib/commerce/types";
import { rateLimit, requireSameOriginMutation } from "@/lib/security/request";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cartUpdateSchema = z.object({
  items: z.array(cartItemSchema),
});

export async function GET() {
  const auth = await requireAuthApi();
  if (!auth.ok) return auth.response;

  const cart = await getCartByUserId(auth.session.userId);
  return NextResponse.json(
    { ok: true, cart: cart ?? { userId: auth.session.userId, items: [], updatedAt: null } },
    { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } },
  );
}

export async function PUT(request: Request) {
  const originCheck = requireSameOriginMutation(request);
  if (originCheck) return originCheck;

  const limited = rateLimit(request, { namespace: "carrito:update", limit: 60, windowMs: 60_000 });
  if (limited) return limited;

  const auth = await requireAuthApi();
  if (!auth.ok) return auth.response;

  try {
    const payload = cartUpdateSchema.parse(await request.json());
    const cart = await setCartByUserId(auth.session.userId, payload.items);
    return NextResponse.json(
      { ok: true, cart },
      { headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo actualizar el carrito" },
      { status: 400, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }
}