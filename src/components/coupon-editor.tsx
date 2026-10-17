"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Coupon } from "@/lib/types";
import { api } from "@/lib/client-api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export function CouponEditor({ coupon }: { coupon?: Coupon }) {
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  return (
    <form
      className="form-card coupon-editor"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        const form = e.currentTarget,
          f = new FormData(form);
        try {
          await api("/api/admin/coupons", {
            id: coupon?.id || null,
            coupon: {
              code: f.get("code"),
              percent: Number(f.get("percent")),
              min_subtotal: Math.round(Number(f.get("minimum")) * 100),
              expires_at: new Date(
                String(f.get("expiry")) + "T23:59:59.000Z",
              ).toISOString(),
              active: f.get("active") === "on",
            },
          });
          toast.success("Coupon saved");
          if (!coupon) form.reset();
          router.refresh();
        } catch (err) {
          toast.error(
            err instanceof Error ? err.message : "Coupon could not be saved",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>{coupon ? coupon.code : "Create a discount"}</h2>
      <div className="form-grid">
        <label>
          Code
          <Input
            name="code"
            defaultValue={coupon?.code}
            minLength={3}
            maxLength={32}
            required
          />
        </label>
        <label>
          Discount (%)
          <Input
            name="percent"
            type="number"
            min="1"
            max="90"
            defaultValue={coupon?.percent || 10}
            required
          />
        </label>
        <label>
          Minimum spend (ZAR)
          <Input
            name="minimum"
            type="number"
            min="0"
            step="0.01"
            defaultValue={(coupon?.min_subtotal || 0) / 100}
            required
          />
        </label>
        <label>
          Expires at end of day (UTC)
          <Input
            name="expiry"
            type="date"
            defaultValue={coupon?.expires_at.slice(0, 10)}
            required
          />
        </label>
      </div>
      <label className="consent-checkbox">
        <input
          type="checkbox"
          name="active"
          defaultChecked={coupon?.active ?? true}
        />
        Active
      </label>
      <Button disabled={busy}>{busy ? "Saving…" : "Save coupon"}</Button>
    </form>
  );
}
