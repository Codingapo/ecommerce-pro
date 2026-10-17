import "server-only";
import { z } from "zod";
export function secret(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing server configuration: ${name}`);
  return value;
}
export const siteUrl = () =>
  z
    .url()
    .parse(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000")
    .replace(/\/$/, "");
export const currency = () =>
  z.literal("ZAR").parse(process.env.STORE_CURRENCY || "ZAR");
export const demoMode = () => process.env.NEXT_PUBLIC_DEMO_MODE === "true";
