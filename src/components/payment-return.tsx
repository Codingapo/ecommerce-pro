"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useCart } from "@/stores/cart";
import { api } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
export function PaymentReturn({ reference }: { reference: string }) {
  const [error, setError] = useState("");
  const [order, setOrder] = useState("");
  const once = useRef(false);
  async function verify() {
    setError("");
    try {
      const result = await api<{ order_id: string }>("/api/payments/verify", {
        reference,
      });
      await useCart.persist.rehydrate();
      useCart.getState().complete(reference);
      sessionStorage.removeItem("checkout-attempt");
      setOrder(result.order_id);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Payment confirmation failed",
      );
    }
  }
  useEffect(() => {
    if (!once.current) {
      once.current = true;
      void verify();
    }
  }, []);
  return (
    <div className="empty-state">
      <h1>{order ? "It's yours." : "Confirming your payment."}</h1>
      {order ? (
        <>
          <p>Thank you. Your order is confirmed.</p>
          <Button asChild>
            <Link href={`/account/orders/${order}`}>View your order</Link>
          </Button>
        </>
      ) : error ? (
        <>
          <p role="alert" className="error-message">
            {error}
          </p>
          <p>
            If you were charged, do not pay again. Your payment can still be
            confirmed.
          </p>
          <Button onClick={verify}>Check payment again</Button>
          <Link href="/login?next=/account/orders">
            Sign in to see your orders
          </Link>
        </>
      ) : (
        <p role="status">Checking securely with Paystack…</p>
      )}
    </div>
  );
}
