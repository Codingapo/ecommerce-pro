import "server-only";
import { z } from "zod";
import { secret, siteUrl } from "@/lib/env";
const verifiedSchema = z.object({
  status: z.string(),
  id: z.union([z.number().int().safe(), z.string()]),
  reference: z.string(),
  amount: z.number().int(),
  currency: z.string(),
});
async function paystack(path: string, body?: unknown) {
  const response = await fetch(`https://api.paystack.co${path}`, {
    method: body ? "POST" : "GET",
    headers: {
      Authorization: `Bearer ${secret("PAYSTACK_SECRET_KEY")}`,
      "Content-Type": "application/json",
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
    signal: AbortSignal.timeout(15000),
  });
  const result = await response.json();
  if (!response.ok || result.status !== true)
    throw new Error("Payment provider request failed.");
  return result.data;
}
export async function initializePayment(order: {
  reference: string;
  email: string;
  total: number;
  currency: string;
  id: string;
}) {
  const data = z
    .object({ authorization_url: z.url(), reference: z.string() })
    .parse(
      await paystack("/transaction/initialize", {
        email: order.email,
        amount: order.total,
        currency: order.currency,
        reference: order.reference,
        callback_url: `${siteUrl()}/checkout/return`,
        metadata: { order_id: order.id },
      }),
    );
  const url = new URL(data.authorization_url);
  if (
    url.protocol !== "https:" ||
    url.hostname !== "checkout.paystack.com" ||
    data.reference !== order.reference
  )
    throw new Error("Unexpected payment URL.");
  return data.authorization_url;
}
export const verifyPayment = async (reference: string) =>
  verifiedSchema.parse(
    await paystack(`/transaction/verify/${encodeURIComponent(reference)}`),
  );
