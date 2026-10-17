import "server-only";
import { Resend } from "resend";
import { adminDb } from "@/lib/supabase/admin";
import { secret, siteUrl } from "@/lib/env";
import { checked } from "@/lib/http";
import { unsubscribeToken } from "@/lib/unsubscribe-token";
export async function recoverCarts() {
  const client = adminDb();
  const carts = checked(await client.rpc("claim_recovery_carts", {}));
  let sent = 0;
  for (const cart of carts) {
    try {
      const [profileResult, cartResult, ordersResult] = await Promise.all([
        client
          .from("profiles")
          .select("recovery_opt_in,email")
          .eq("id", cart.user_id)
          .single(),
        client
          .from("carts")
          .select("updated_at,items")
          .eq("user_id", cart.user_id)
          .maybeSingle(),
        client
          .from("orders")
          .select("id")
          .eq("user_id", cart.user_id)
          .eq("payment_status", "paid")
          .gte("paid_at", cart.updated_at)
          .limit(1),
      ]);
      const profile = checked(profileResult),
        current = checked(cartResult),
        orders = checked(ordersResult);
      if (
        !profile?.recovery_opt_in ||
        !current ||
        current.updated_at !== cart.updated_at ||
        orders.length
      )
        continue;
      const token = unsubscribeToken(
        cart.user_id,
        secret("UNSUBSCRIBE_SECRET"),
      );
      const unsubscribe = `${siteUrl()}/unsubscribe?token=${encodeURIComponent(token)}`;
      const { error } = await new Resend(secret("RESEND_API_KEY")).emails.send(
        {
          from: secret("RESEND_FROM"),
          to: profile.email,
          subject: "A few good things are still in your bag",
          html: `<h1>Still on your mind?</h1><p>You saved a few pieces at Mulaba. Your bag is here whenever you are ready.</p><p><a href="${siteUrl()}/account/recover-cart">Return to your saved bag</a></p><p>Prices and availability are checked when you return.</p><p>You opted in to shopping reminders. <a href="${unsubscribe}">Unsubscribe from reminders</a>.</p>`,
        },
        { idempotencyKey: `recovery/${cart.user_id}/${cart.updated_at}` },
      );
      if (error) throw new Error(error.message);
      checked(
        await client
          .from("carts")
          .update({
            last_reminded_at: new Date().toISOString(),
            recovery_lease: null,
          })
          .eq("user_id", cart.user_id)
          .eq("updated_at", cart.updated_at),
      );
      sent++;
    } catch (error) {
      console.error(
        "Recovery deferred",
        error instanceof Error ? error.message : "email error",
      );
    }
  }
  return { sent, attempted: carts.length };
}
