"use client";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/types";
import { useCart } from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { money } from "@/lib/utils";
export function RecoverCart({
  items,
}: {
  items: (Product & { quantity: number })[];
}) {
  const router = useRouter();
  return (
    <div className="form-card">
      <h2>Your saved pieces</h2>
      {items.map((i) => (
        <div className="source-row" key={i.id}>
          <span>
            {i.name} × {i.quantity}
          </span>
          <strong>{money(i.price * i.quantity)}</strong>
        </div>
      ))}
      <p className="muted">
        Restoring replaces the bag on this device. Prices and stock reflect
        current availability.
      </p>
      <Button
        disabled={!items.length}
        onClick={() => {
          useCart.setState({
            items: items.map((i) => ({
              id: i.id,
              name: i.name,
              slug: i.slug,
              price: i.price,
              image_url: i.image_url,
              quantity: i.quantity,
            })),
          });
          router.push("/cart");
        }}
      >
        Restore saved bag
      </Button>
      {!items.length && (
        <p>
          These pieces are no longer available. Explore the collection for
          something new.
        </p>
      )}
    </div>
  );
}
