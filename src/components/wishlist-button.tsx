"use client";
import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client-api";
export function WishlistButton({ productId }: { productId: string }) {
  const [saved, setSaved] = useState(false),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return;
    void api<{ saved: boolean }>(
      `/api/wishlist?product=${productId}`,
      undefined,
      "GET",
    )
      .then((r) => setSaved(r.saved))
      .catch(() => {});
  }, [productId]);
  return (
    <Button
      variant="outline"
      className="wishlist-button"
      disabled={busy || process.env.NEXT_PUBLIC_DEMO_MODE === "true"}
      onClick={async () => {
        setBusy(true);
        try {
          const r = await api<{ saved: boolean }>("/api/wishlist", {
            product_id: productId,
            saved: !saved,
          });
          setSaved(r.saved);
          toast.success(
            r.saved ? "Saved to your wishlist" : "Removed from wishlist",
          );
        } catch (err) {
          toast.error(
            err instanceof Error
              ? err.message
              : "Please sign in to save favourites",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <Heart size={17} fill={saved ? "currentColor" : "none"} />
      {saved ? "Saved to wishlist" : "Save for later"}
    </Button>
  );
}
