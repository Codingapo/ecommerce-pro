"use client";
import { toast } from "sonner";
import { track } from "@/lib/tracking";
import { useState } from "react";
import { ShoppingBag, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/stores/cart";
import type { Product } from "@/lib/types";
export function AddToCart({ product }: { product: Product }) {
  const add = useCart((s) => s.add);
  const [added, setAdded] = useState(false);
  return (
    <Button
      className="w-full"
      disabled={product.stock < 1}
      onClick={() => {
        add(product);
        setAdded(true);
        track("add_to_cart", product.id);
        toast.success(`${product.name} added to your bag`);
      }}
    >
      <span aria-live="polite">
        {product.stock < 1
          ? "Out of stock"
          : added
            ? "Added to your bag"
            : "Add to bag"}
      </span>
      {added ? <Check size={17} /> : <ShoppingBag size={17} />}
    </Button>
  );
}
