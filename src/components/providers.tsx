"use client";
import { Toaster } from "sonner";
import { TrackingConsent } from "@/components/tracking-consent";
import { CartSync } from "@/components/cart-sync";
import { useEffect } from "react";
import { useCart } from "@/stores/cart";
export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    void useCart.persist.rehydrate();
  }, []);
  return (
    <>
      {children}
      <Toaster theme="light" position="bottom-right" richColors />
      <TrackingConsent />
      <CartSync />
    </>
  );
}
