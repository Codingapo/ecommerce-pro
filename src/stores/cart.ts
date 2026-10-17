"use client";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Product } from "@/lib/types";
type Item = Pick<Product, "id" | "name" | "slug" | "price" | "image_url"> & {
  quantity: number;
};
type Cart = {
  items: Item[];
  pending: {
    reference: string;
    items: { id: string; quantity: number }[];
  } | null;
  add: (product: Product) => void;
  setQuantity: (id: string, quantity: number) => void;
  pendingPayment: (reference: string) => void;
  complete: (reference: string) => void;
};
export const useCart = create<Cart>()(
  persist(
    (set, get) => ({
      items: [],
      pending: null,
      add: (p) =>
        set((state) => {
          const found = state.items.find((i) => i.id === p.id);
          return {
            items: found
              ? state.items.map((i) =>
                  i.id === p.id
                    ? { ...i, quantity: Math.min(20, i.quantity + 1) }
                    : i,
                )
              : [
                  ...state.items,
                  {
                    id: p.id,
                    name: p.name,
                    slug: p.slug,
                    price: p.price,
                    image_url: p.image_url,
                    quantity: 1,
                  },
                ],
          };
        }),
      setQuantity: (id, quantity) =>
        set((state) => ({
          items: state.items
            .map((i) =>
              i.id === id
                ? {
                    ...i,
                    quantity: Math.max(0, Math.min(20, Math.floor(quantity))),
                  }
                : i,
            )
            .filter((i) => i.quantity > 0),
        })),
      pendingPayment: (reference) =>
        set({
          pending: {
            reference,
            items: get().items.map((i) => ({ id: i.id, quantity: i.quantity })),
          },
        }),
      complete: (reference) =>
        set((state) =>
          state.pending?.reference !== reference
            ? state
            : {
                items: state.items
                  .map((i) => ({
                    ...i,
                    quantity: Math.max(
                      0,
                      i.quantity -
                        (state.pending?.items.find((p) => p.id === i.id)
                          ?.quantity || 0),
                    ),
                  }))
                  .filter((i) => i.quantity > 0),
                pending: null,
              },
        ),
    }),
    {
      name: "mulaba-pro-cart",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);
