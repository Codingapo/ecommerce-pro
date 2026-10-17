import "server-only";
import { db } from "@/lib/supabase/server";
import { AppError } from "@/lib/http";
export async function requireUser() {
  const client = await db();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();
  if (error || !user || !user.email || !user.email_confirmed_at)
    throw new AppError(401, "Please sign in with a verified account.");
  return { client, user };
}
export async function requireAdmin() {
  const { client, user } = await requireUser();
  const { data, error } = await client
    .from("accounts")
    .select("role")
    .eq("user_id", user.id)
    .single();
  if (error || data?.role !== "admin")
    throw new AppError(403, "Admin access required.");
  return { client, user };
}
