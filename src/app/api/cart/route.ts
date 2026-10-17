import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { adminDb } from "@/lib/supabase/admin";
import { sameOrigin, failure, checked } from "@/lib/http";
import { rateLimit } from "@/lib/limits";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { user } = await requireUser();
    await rateLimit(`cart:${user.id}`, 40);
    const { items } = z
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
          .max(50),
      })
      .strict()
      .parse(await request.json());
    const unique = new Map(items.map((i) => [i.product_id, i]));
    checked(
      await adminDb().rpc("save_cart", {
        p_user: user.id,
        p_items: [...unique.values()].sort((a, b) =>
          a.product_id.localeCompare(b.product_id),
        ),
      }),
    );
    return Response.json({ saved: true });
  } catch (error) {
    return failure(error);
  }
}
