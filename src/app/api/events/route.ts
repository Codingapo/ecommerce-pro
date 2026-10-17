import { createHash } from "node:crypto";
import { z } from "zod";
import { db } from "@/lib/supabase/server";
import { adminDb } from "@/lib/supabase/admin";
import { sameOrigin, failure, checked } from "@/lib/http";
import { rateLimit } from "@/lib/limits";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const value = z
      .object({
        id: z.uuid(),
        session_id: z.uuid(),
        kind: z.enum(["page_view", "product_view", "add_to_cart"]),
        product_id: z.uuid().optional(),
        source: z.string().max(100),
        path: z.string().startsWith("/").max(250),
      })
      .strict()
      .parse(await request.json());
    const ip =
      request.headers.get("x-vercel-forwarded-for") ||
      request.headers.get("x-forwarded-for") ||
      "local";
    const key = createHash("sha256").update(ip).digest("hex");
    await rateLimit(`events:${key}`, 120);
    const {
      data: { user },
    } = await (await db()).auth.getUser();
    checked(
      await adminDb()
        .from("events")
        .upsert(
          { ...value, user_id: user?.id || null },
          { onConflict: "id", ignoreDuplicates: true },
        ),
    );
    return Response.json({ received: true });
  } catch (error) {
    return failure(error);
  }
}
