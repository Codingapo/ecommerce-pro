"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/types";
export function browserDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error("Connect Supabase to enable accounts.");
  return createBrowserClient<Database>(url, key);
}
