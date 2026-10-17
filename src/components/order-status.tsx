"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import type { Order } from "@/lib/types";
export function OrderStatusForm({ order }: { order: Order }) {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const router = useRouter();
  const next =
    order.status === "on_hold"
      ? "processing"
      : order.status === "pending"
        ? "cancelled"
        : order.status === "processing"
          ? "shipped"
          : order.status === "shipped"
            ? "delivered"
            : null;
  if (!next) return null;
  return (
    <div className="status-form">
      {order.status === "on_hold" && (
        <p className="error-message">
          Payment received, but stock needs attention. Restock or arrange a
          refund before proceeding.
        </p>
      )}
      <Button
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          setError("");
          try {
            await api(
              "/api/admin/orders",
              { id: order.id, status: next },
              "PATCH",
            );
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Update failed");
          } finally {
            setBusy(false);
          }
        }}
      >
        {busy ? "Updating…" : `Mark as ${next}`}
      </Button>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
    </div>
  );
}
