import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/supabase/admin";
import { productSchema } from "@/lib/validation";
import { secret } from "@/lib/env";
import { checked, failure, sameOrigin, AppError } from "@/lib/http";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { user } = await requireAdmin();
    const { id, product: raw, expected_stock } = await request.json();
    const product = productSchema.parse(raw);
    const base = secret("R2_PUBLIC_URL").replace(/\/$/, "") + "/products/";
    if (
      ![product.image_url, ...product.images].every((url) =>
        url.startsWith(base),
      )
    )
      throw new AppError(
        400,
        "Upload a product image to your configured R2 bucket.",
      );
    const client = adminDb();
    const result = await client.rpc("save_product", {
      p_id: id ? z.uuid().parse(id) : null,
      p_data: product,
      p_expected_stock: id
        ? z.number().int().nonnegative().parse(expected_stock)
        : null,
      p_actor: user.id,
    });
    if (result.error)
      throw new AppError(
        409,
        "This product changed or the slug already exists. Refresh and try again.",
      );
    const data = result.data;
    return Response.json({ product: data });
  } catch (error) {
    return failure(error);
  }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    const { user } = await requireAdmin();
    const { id } = await request.json();
    checked(
      await adminDb().rpc("delete_product", {
        p_id: z.uuid().parse(id),
        p_actor: user.id,
      }),
    );
    return Response.json({ success: true });
  } catch (error) {
    return failure(error);
  }
}
