"use client";
import { trackingContext } from "@/lib/tracking";
import { toast } from "sonner";
import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/stores/cart";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/client-api";
import { money } from "@/lib/utils";
export function CheckoutForm({
  savedAddress = {},
}: {
  savedAddress?: Record<string, string>;
}) {
  const [coupon, setCoupon] = useState("");
  const [quote, setQuote] = useState<{
    subtotal: number;
    discount: number;
    total: number;
    coupon: string;
  } | null>(null);
  const [quoting, setQuoting] = useState(false);
  const { items, pendingPayment } = useCart();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const f = new FormData(e.currentTarget);
      const address = {
        name: f.get("name"),
        phone: f.get("phone"),
        line1: f.get("line1"),
        city: f.get("city"),
        province: f.get("province"),
        postal_code: f.get("postal_code"),
        country: "ZA",
      };
      const lines = items.map((i) => ({
        product_id: i.id,
        quantity: i.quantity,
      }));
      const fingerprint = JSON.stringify({ lines, address, coupon });
      const previous = JSON.parse(
        sessionStorage.getItem("checkout-attempt") || "null",
      ) as { fingerprint: string; key: string } | null;
      const key =
        previous?.fingerprint === fingerprint
          ? previous.key
          : crypto.randomUUID();
      sessionStorage.setItem(
        "checkout-attempt",
        JSON.stringify({ fingerprint, key }),
      );
      const result = await api<{ url: string; reference: string }>(
        "/api/checkout",
        {
          items: lines,
          address,
          idempotency_key: key,
          coupon,
          ...trackingContext(),
        },
      );
      pendingPayment(result.reference);
      window.location.assign(result.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed");
      setBusy(false);
    }
  }
  if (!items.length)
    return (
      <div className="empty-state">
        <p>Your bag is empty.</p>
        <Link href="/shop">Explore the collection →</Link>
      </div>
    );
  return (
    <form onSubmit={submit} className="cart-layout">
      <div className="form-card">
        <h2>Delivery details</h2>
        <div className="form-grid">
          {[
            { name: "name", label: "Full name", auto: "name" },
            { name: "phone", label: "Phone number", auto: "tel" },
            { name: "line1", label: "Street address", auto: "address-line1" },
            { name: "city", label: "City", auto: "address-level2" },
            { name: "province", label: "Province", auto: "address-level1" },
            { name: "postal_code", label: "Postal code", auto: "postal-code" },
          ].map((field) => (
            <label key={field.name}>
              {field.label}
              <Input
                name={field.name}
                defaultValue={savedAddress[field.name] || ""}
                required
                maxLength={180}
                autoComplete={field.auto}
              />
            </label>
          ))}
        </div>
        <p className="muted">
          South Africa · Delivery included in the item price.
        </p>
      </div>
      <aside className="summary-card">
        <h2>Your order</h2>
        {items.map((i) => (
          <div key={i.id}>
            <span>
              {i.name} × {i.quantity}
            </span>
            <span>{money(i.price * i.quantity)}</span>
          </div>
        ))}
        <div className="coupon">
          <label htmlFor="coupon">Discount code</label>
          <div>
            <Input
              id="coupon"
              value={coupon}
              maxLength={32}
              onChange={(e) => {
                setCoupon(e.target.value.toUpperCase());
                setQuote(null);
              }}
              placeholder="Enter a code"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={quoting || process.env.NEXT_PUBLIC_DEMO_MODE === "true"}
              onClick={async () => {
                setQuoting(true);
                try {
                  const r = await api<{
                    subtotal: number;
                    discount: number;
                    total: number;
                    coupon: string;
                  }>("/api/checkout/quote", {
                    items: items.map((i) => ({
                      product_id: i.id,
                      quantity: i.quantity,
                    })),
                    coupon,
                  });
                  setQuote(r);
                  toast.success(
                    r.discount ? "Discount applied" : "Prices updated",
                  );
                } catch (err) {
                  setQuote(null);
                  toast.error(
                    err instanceof Error ? err.message : "Invalid coupon",
                  );
                } finally {
                  setQuoting(false);
                }
              }}
            >
              {quoting ? "…" : "Apply"}
            </Button>
          </div>
        </div>
        {quote && quote.discount > 0 && (
          <div>
            <span>Discount</span>
            <strong>−{money(quote.discount)}</strong>
          </div>
        )}
        <div className="summary-total">
          <span>{quote ? "Total" : "Estimated total"}</span>
          <strong>
            {money(
              quote?.total ??
                items.reduce((n, i) => n + i.price * i.quantity, 0),
            )}
          </strong>
        </div>
        {error && (
          <p role="alert" className="error-message">
            {error}
          </p>
        )}
        <Button
          disabled={busy || process.env.NEXT_PUBLIC_DEMO_MODE === "true"}
          className="w-full"
        >
          {busy ? "Opening secure checkout…" : "Pay securely with Paystack"}
        </Button>
        <p>
          You will be redirected to Paystack. We confirm your payment securely
          before processing your order.
        </p>
      </aside>
    </form>
  );
}
