import "server-only";
import { adminDb } from "@/lib/supabase/admin";
import { AppError, checked } from "@/lib/http";
export async function rateLimit(key: string, max = 15, seconds = 60) {
  const allowed = checked(
    await adminDb().rpc("consume_limit", {
      p_key: key,
      p_max: max,
      p_seconds: seconds,
    }),
  );
  if (!allowed)
    throw new AppError(429, "Too many requests. Please wait a moment.");
}
