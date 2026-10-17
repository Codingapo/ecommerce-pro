import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { adminDb } from "@/lib/supabase/admin";
import { sameOrigin, failure, checked, AppError } from "@/lib/http";
import { rateLimit } from "@/lib/limits";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { user } = await requireUser();
    await rateLimit(`quote:${user.id}`, 20);
    const body = z
      .object({
        items: z
          .array(
            z
              .object({
                product_id: z.uuid(),
                quantity: z.number().int().min(1).max(20),
              })
              .strict(),
          )
          .min(1)
          .max(50),
        coupon: z
          .string()
          .trim()
          .max(32)
          .transform((v) => v.toUpperCase()),
      })
      .strict()
      .parse(await request.json());
    if (new Set(body.items.map((i) => i.product_id)).size !== body.items.length)
      throw new AppError(400, "Duplicate items");
    const client = adminDb();
    const products = checked(
      await client
        .from("products")
        .select("id,price,stock")
        .eq("active", true)
        .in(
          "id",
          body.items.map((i) => i.product_id),
        ),
    );
    let subtotal = 0;
    for (const i of body.items) {
      const p = products.find((p) => p.id === i.product_id);
      if (!p || p.stock < i.quantity)
        throw new AppError(409, "One of your products is unavailable.");
      subtotal += p.price * i.quantity;
    }
    let discount = 0;
    if (body.coupon) {
      const coupon = checked(
        await client
          .from("coupons")
          .select("*")
          .eq("code", body.coupon)
          .eq("active", true)
          .gt("expires_at", new Date().toISOString())
          .maybeSingle(),
      );
      if (!coupon || subtotal < coupon.min_subtotal)
        throw new AppError(400, "Coupon not valid for this order.");
      discount = Math.floor((subtotal * coupon.percent) / 100);
    }
    return Response.json({
      subtotal,
      discount,
      total: subtotal - discount,
      coupon: body.coupon,
    });
  } catch (error) {
    return failure(error);
  }
}
