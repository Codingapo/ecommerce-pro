import { after } from "next/server";
import { requireUser } from "@/lib/auth";
import { sameOrigin, failure } from "@/lib/http";
import { referenceSchema } from "@/lib/validation";
import { settle } from "@/lib/orders";
import { dispatchEmails } from "@/lib/email";
import { rateLimit } from "@/lib/limits";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const { user } = await requireUser();
    await rateLimit(`verify:${user.id}`, 20);
    const body = await request.json();
    const order = await settle(referenceSchema.parse(body.reference), user.id);
    after(() => dispatchEmails().then(() => {}));
    return Response.json({ order_id: order.id, status: order.status });
  } catch (error) {
    return failure(error);
  }
}
