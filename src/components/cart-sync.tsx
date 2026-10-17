"use client";
import { useEffect, useRef } from "react";
import { useCart } from "@/stores/cart";
export function CartSync() {
  const items = useCart((s) => s.items);
  const hadItems = useRef(false);
  useEffect(() => {
    if (!items.length && !hadItems.current) return;
    if (items.length) hadItems.current = true;
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return;
    const timer = setTimeout(() => {
      if (!useCart.persist.hasHydrated()) return;
      const lines = items
        .map((i) => ({ product_id: i.id, quantity: i.quantity }))
        .sort((a, b) => a.product_id.localeCompare(b.product_id));
      void fetch("/api/cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: lines }),
      }).catch(() => {});
    }, 1200);
    return () => clearTimeout(timer);
  }, [items]);
  return null;
}
