import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/supabase/admin";
import { sameOrigin, failure, checked } from "@/lib/http";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { user } = await requireAdmin();
    const { id, coupon } = z
      .object({
        id: z.uuid().nullable(),
        coupon: z
          .object({
            code: z
              .string()
              .trim()
              .toUpperCase()
              .regex(/^[A-Z0-9_-]{3,32}$/),
            percent: z.number().int().min(1).max(90),
            min_subtotal: z.number().int().min(0).max(100000000),
            expires_at: z.iso.datetime(),
            active: z.boolean(),
          })
          .strict(),
      })
      .strict()
      .parse(await request.json());
    const data = checked(
      await adminDb().rpc("save_coupon", {
        p_id: id,
        p_data: coupon,
        p_actor: user.id,
      }),
    );
    return Response.json({ coupon: data });
  } catch (error) {
    return failure(error);
  }
}
