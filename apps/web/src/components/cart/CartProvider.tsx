"use client";

import type { Producto } from "@chia/shared";
import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

export type CartItem = { productId: string; qty: number };
type SessionData = { userId: string; email: string; role: "user" | "admin" } | null;

type CartContextValue = {
  items: CartItem[];
  initialized: boolean;
  session: SessionData;
  addItem: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  getQty: (productId: string) => number;
  totalItems: number;
  totalUnits: number;
};

type CartProviderProps = {
  children: React.ReactNode;
  initialSession?: SessionData | undefined;
};

const CART_STORAGE_KEY = "chia_cart_v1";
const CartContext = createContext<CartContextValue | null>(null);

function normalizeCart(items: CartItem[]) {
  const map = new Map<string, number>();
  for (const item of items) {
    if (!item.productId) continue;
    const qty = Number.isFinite(item.qty) ? Math.floor(item.qty) : 0;
    if (qty <= 0) continue;
    map.set(item.productId, (map.get(item.productId) ?? 0) + qty);
  }
  return [...map.entries()].map(([productId, qty]) => ({ productId, qty }));
}

function mergeCarts(a: CartItem[], b: CartItem[]) {
  const map = new Map<string, number>();
  for (const item of [...a, ...b]) {
    if (!item.productId) continue;
    const qty = Number.isFinite(item.qty) ? Math.floor(item.qty) : 0;
    if (qty <= 0) continue;
    map.set(item.productId, Math.max(map.get(item.productId) ?? 0, qty));
  }
  return [...map.entries()].map(([productId, qty]) => ({ productId, qty }));
}

function readLocalCart() {
  if (typeof window === "undefined") return [] as CartItem[];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CartItem[];
    return normalizeCart(parsed);
  } catch {
    return [];
  }
}

function writeLocalCart(items: CartItem[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(normalizeCart(items)));
}

export function CartProvider({ children, initialSession }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [session, setSession] = useState<SessionData>(initialSession ?? null);
  const hasBootstrappedRef = useRef(false);
  const lastSyncedRef = useRef<string>("");

  useEffect(() => {
    if (hasBootstrappedRef.current) return;
    hasBootstrappedRef.current = true;

    const localItems = readLocalCart();
    setItems(localItems);

    void (async () => {
      try {
        let currentSession = initialSession ?? null;
        if (typeof initialSession === "undefined") {
          const sessionResponse = await fetch("/api/auth/session", { cache: "no-store" });
          const sessionJson = (await sessionResponse.json()) as { session: SessionData };
          currentSession = sessionJson.session ?? null;
          setSession(currentSession);
        }

        if (currentSession) {
          const cartResponse = await fetch("/api/carrito", { cache: "no-store" });
          if (cartResponse.ok) {
            const cartJson = (await cartResponse.json()) as { cart?: { items?: CartItem[] } };
            const remoteItems = normalizeCart(cartJson.cart?.items ?? []);
            const merged = mergeCarts(localItems, remoteItems);
            setItems(merged);
            writeLocalCart(merged);
            await fetch("/api/carrito", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ items: merged }),
            });
            lastSyncedRef.current = JSON.stringify(merged);
          }
        }
      } catch {
        // si falla red o auth, se mantiene el carrito del navegador hasta reintentar sync
      } finally {
        setInitialized(true);
      }
    })();
  }, [initialSession]);

  useEffect(() => {
    if (!initialized) return;
    writeLocalCart(items);
    if (!session) return;

    const payload = JSON.stringify(normalizeCart(items));
    if (lastSyncedRef.current === payload) return;
    lastSyncedRef.current = payload;

    void fetch("/api/carrito", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    }).catch(() => {
      // si falla el sync, conservamos temporalmente el carrito del navegador
    });
  }, [items, session, initialized]);

  const value = useMemo<CartContextValue>(() => {
    const normalized = normalizeCart(items);
    return {
      items: normalized,
      initialized,
      session,
      addItem: (productId, qty = 1) =>
        setItems((prev) =>
          normalizeCart([...prev, { productId, qty }]),
        ),
      setQty: (productId, qty) =>
        setItems((prev) =>
          normalizeCart(prev.map((item) => (item.productId === productId ? { ...item, qty } : item))),
        ),
      removeItem: (productId) => setItems((prev) => prev.filter((item) => item.productId !== productId)),
      clearCart: () => setItems([]),
      getQty: (productId) => normalized.find((item) => item.productId === productId)?.qty ?? 0,
      totalItems: normalized.length,
      totalUnits: normalized.reduce((sum, item) => sum + item.qty, 0),
    };
  }, [items, initialized, session]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart debe usarse dentro de CartProvider");
  return context;
}

export function enrichCartItems(items: CartItem[], products: Producto[]) {
  const productMap = new Map(products.map((product) => [product.id, product]));
  return items
    .map((item) => {
      const product = productMap.get(item.productId);
      if (!product) return null;
      return {
        ...item,
        product,
        subtotalCents: product.precioCents * item.qty,
      };
    })
    .filter(Boolean) as Array<CartItem & { product: Producto; subtotalCents: number }>;
}