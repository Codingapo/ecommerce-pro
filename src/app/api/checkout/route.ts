import { createHash } from "node:crypto";
import { requireUser } from "@/lib/auth";
import { adminDb } from "@/lib/supabase/admin";
import { checkoutSchema } from "@/lib/validation";
import { AppError, checked, failure, sameOrigin } from "@/lib/http";
import { currency, demoMode } from "@/lib/env";
import { rateLimit } from "@/lib/limits";
import { initializePayment } from "@/lib/paystack";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    if (demoMode())
      throw new AppError(503, "Checkout is disabled in demo mode.");
    const { user } = await requireUser();
    await rateLimit(`checkout:${user.id}`, 10);
    const body = checkoutSchema.parse(await request.json());
    const lines = [...body.items].sort((a, b) =>
      a.product_id.localeCompare(b.product_id),
    );
    if (new Set(lines.map((i) => i.product_id)).size !== lines.length)
      throw new AppError(400, "Duplicate cart items.");
    const hash = createHash("sha256")
      .update(
        JSON.stringify({ lines, address: body.address, coupon: body.coupon }),
      )
      .digest("hex");
    const client = adminDb();
    const result = await client.rpc("create_checkout", {
      p_user: user.id,
      p_email: user.email!,
      p_lines: lines,
      p_address: body.address,
      p_key: body.idempotency_key,
      p_hash: hash,
      p_currency: currency(),
      p_coupon: body.coupon,
      p_session: body.analytics_session,
      p_source: body.traffic_source,
    });
    if (result.error)
      throw new AppError(
        409,
        "Your cart changed, an item is unavailable, or the coupon is invalid. Refresh your cart and check your coupon before trying again.",
      );
    const order = result.data;
    if (order.payment_status === "paid")
      return Response.json({
        url: `/account/orders/${order.id}`,
        reference: order.reference,
      });
    const url = order.authorization_url || (await initializePayment(order));
    checked(
      await client
        .from("orders")
        .update({ authorization_url: url })
        .eq("id", order.id),
    );
    return Response.json({ url, reference: order.reference });
  } catch (error) {
    return failure(error);
  }
}
