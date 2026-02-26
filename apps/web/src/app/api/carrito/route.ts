import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/lib/auth/session";
import { getCartByUserId, setCartByUserId } from "@/lib/commerce/carts-store";
import { cartItemSchema } from "@/lib/commerce/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const cartUpdateSchema = z.object({
  items: z.array(cartItemSchema),
});

export async function GET() {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "No autenticado" },
      { status: 401, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }

  const cart = await getCartByUserId(session.userId);
  return NextResponse.json(
    { ok: true, cart: cart ?? { userId: session.userId, items: [], updatedAt: null } },
    { headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" } },
  );
}

export async function PUT(request: Request) {
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json(
      { ok: false, error: "No autenticado" },
      { status: 401, headers: { "Content-Type": "application/json; charset=utf-8" } },
    );
  }

  try {
    const payload = cartUpdateSchema.parse(await request.json());
    const cart = await setCartByUserId(session.userId, payload.items);
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
