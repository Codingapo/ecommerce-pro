"use client";
import { useEffect } from "react";
import { track } from "@/lib/tracking";
export function ProductView({ id }: { id: string }) {
  useEffect(() => {
    track("product_view", id);
    const onConsent = () => track("product_view", id);
    window.addEventListener("mulaba-analytics-enabled", onConsent);
    return () =>
      window.removeEventListener("mulaba-analytics-enabled", onConsent);
  }, [id]);
  return null;
}
