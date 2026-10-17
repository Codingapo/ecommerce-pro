import "server-only";
import { Resend } from "resend";
import { adminDb } from "@/lib/supabase/admin";
import { secret, siteUrl } from "@/lib/env";
import { checked } from "@/lib/http";
import { money } from "@/lib/utils";
const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export async function dispatchEmails(limit = 10) {
  const client = adminDb();
  const jobs = checked(await client.rpc("claim_emails", { p_limit: limit }));
  let sent = 0;
  for (const job of jobs) {
    try {
      const order = checked(
        await client.from("orders").select("*").eq("id", job.order_id).single(),
      );
      if (!order) throw new Error("Order missing from email queue");
      const { error } = await new Resend(secret("RESEND_API_KEY")).emails.send(
        {
          from: secret("RESEND_FROM"),
          to: order.email,
          subject: `Order ${order.reference.slice(-8)} — ${job.kind.replaceAll("_", " ")}`,
          html: `<h1>Thank you for shopping with Mulaba</h1><p>Order ${escape(order.reference)}: ${escape(job.kind.replaceAll("_", " "))}.</p><p>Current status: ${escape(order.status.replaceAll("_", " "))}.</p><p>Total: ${escape(money(order.total, order.currency))}</p><p><a href="${siteUrl()}/account/orders/${order.id}">View your order</a></p>`,
        },
        { idempotencyKey: `order/${job.order_id}/${job.kind}` },
      );
      if (error) throw new Error(error.message);
      checked(
        await client
          .from("email_outbox")
          .update({ sent_at: new Date().toISOString(), lease_until: null })
          .eq("id", job.id),
      );
      sent++;
    } catch (error) {
      console.error(
        "Email delivery deferred",
        job.id,
        error instanceof Error ? error.message : "error",
      );
    }
  }
  return { sent, attempted: jobs.length };
}
