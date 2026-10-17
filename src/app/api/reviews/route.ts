import { z } from "zod";
import { db } from "@/lib/supabase/server";
import { requireUser } from "@/lib/auth";
import { sameOrigin, failure, checked, AppError } from "@/lib/http";
import { rateLimit } from "@/lib/limits";
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const id = z.uuid().parse(params.get("product"));
    const page = Math.max(1, Math.floor(Number(params.get("page")) || 1));
    const client = await db();
    const result = await client
      .from("reviews")
      .select("id,rating,body,created_at", { count: "exact" })
      .eq("product_id", id)
      .order("created_at", { ascending: false })
      .range((page - 1) * 10, page * 10 - 1);
    return Response.json({ reviews: checked(result), count: result.count });
  } catch (error) {
    return failure(error);
  }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { client, user } = await requireUser();
    await rateLimit(`review:${user.id}`, 5);
    const body = z
      .object({
        product_id: z.uuid(),
        rating: z.number().int().min(1).max(5),
        body: z.string().trim().min(10).max(2000),
      })
      .strict()
      .parse(await request.json());
    const result = await client
      .from("reviews")
      .insert({ ...body, user_id: user.id });
    if (result.error)
      throw new AppError(
        409,
        "Only verified purchasers can review a product, once per product.",
      );
    return Response.json({ saved: true });
  } catch (error) {
    return failure(error);
  }
}
