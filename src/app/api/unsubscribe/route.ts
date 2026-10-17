import { z } from "zod";
import { validateUnsubscribe } from "@/lib/unsubscribe-token";
import { adminDb } from "@/lib/supabase/admin";
import { secret } from "@/lib/env";
import { failure, sameOrigin, AppError, checked } from "@/lib/http";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { token } = z
      .object({ token: z.string().max(110) })
      .parse(await request.json());
    const id = validateUnsubscribe(token, secret("UNSUBSCRIBE_SECRET"));
    if (!id) throw new AppError(400, "This unsubscribe link is not valid.");
    checked(
      await adminDb()
        .from("profiles")
        .update({ recovery_opt_in: false })
        .eq("id", id),
    );
    return Response.json({ unsubscribed: true });
  } catch (error) {
    return failure(error);
  }
}
