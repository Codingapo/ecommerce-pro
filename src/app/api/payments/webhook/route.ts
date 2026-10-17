import { after } from "next/server";
import { secret } from "@/lib/env";
import { validSignature } from "@/lib/payment-checks";
import { settle } from "@/lib/orders";
import { dispatchEmails } from "@/lib/email";
import { failure } from "@/lib/http";
import { referenceSchema } from "@/lib/validation";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    const raw = await request.text();
    if (raw.length > 65536) return new Response("Too large", { status: 413 });
    if (
      !validSignature(
        raw,
        request.headers.get("x-paystack-signature"),
        secret("PAYSTACK_SECRET_KEY"),
      )
    )
      return new Response("Invalid signature", { status: 401 });
    const event = JSON.parse(raw);
    if (event.event === "charge.success") {
      const reference = referenceSchema.safeParse(event.data?.reference);
      if (!reference.success) return Response.json({ received: true });
      await settle(reference.data);
      after(() => dispatchEmails().then(() => {}));
    }
    return Response.json({ received: true });
  } catch (error) {
    return failure(error);
  }
}
