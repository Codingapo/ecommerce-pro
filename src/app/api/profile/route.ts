import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { checked, failure, sameOrigin } from "@/lib/http";
import { addressSchema } from "@/lib/validation";
export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    const { client, user } = await requireUser();
    const body = z
      .object({
        full_name: z.string().trim().min(2).max(100),
        phone: z.string().min(7).max(30),
        address: addressSchema,
        recovery_opt_in: z.boolean(),
      })
      .strict()
      .parse(await request.json());
    checked(
      await client
        .from("profiles")
        .update(body)
        .eq("id", user.id)
        .select()
        .single(),
    );
    return Response.json({ saved: true });
  } catch (error) {
    return failure(error);
  }
}
