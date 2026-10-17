import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { sameOrigin, failure, checked } from "@/lib/http";
export async function GET(request: Request) {
  try {
    const { client, user } = await requireUser();
    const product = z
      .uuid()
      .parse(new URL(request.url).searchParams.get("product"));
    const row = checked(
      await client
        .from("wishlists")
        .select("product_id")
        .eq("user_id", user.id)
        .eq("product_id", product)
        .maybeSingle(),
    );
    return Response.json({ saved: !!row });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { client, user } = await requireUser();
    const { product_id, saved } = z
      .object({ product_id: z.uuid(), saved: z.boolean() })
      .strict()
      .parse(await request.json());
    if (saved) {
      const result = await client
        .from("wishlists")
        .insert({ user_id: user.id, product_id });
      if (result.error && result.error.code !== "23505")
        throw new Error("Unable to save favourite");
    } else
      checked(
        await client
          .from("wishlists")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", product_id),
      );
    return Response.json({ saved });
  } catch (error) {
    return failure(error);
  }
}
