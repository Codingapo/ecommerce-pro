import { after } from "next/server";
import { dispatchEmails } from "@/lib/email";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { adminDb } from "@/lib/supabase/admin";
import { sameOrigin, failure, AppError } from "@/lib/http";
import { statusSchema } from "@/lib/validation";
export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    const { user } = await requireAdmin();
    const body = await request.json();
    const { data, error } = await adminDb().rpc("admin_order_status", {
      p_actor: user.id,
      p_order: z.uuid().parse(body.id),
      p_status: statusSchema.parse(body.status),
    });
    if (error)
      throw new AppError(409, "That status transition is not allowed.");
    after(() => dispatchEmails().then(() => {}));
    return Response.json({ order: data });
  } catch (error) {
    return failure(error);
  }
}
