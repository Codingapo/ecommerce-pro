import { createHmac, timingSafeEqual } from "node:crypto";
export function validSignature(
  raw: string,
  signature: string | null,
  secret: string,
): boolean {
  if (!signature || !/^[a-f0-9]{128}$/i.test(signature)) return false;
  const expected = createHmac("sha512", secret).update(raw).digest();
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}
export function assertPayment(
  payment: {
    status: string;
    reference: string;
    amount: number;
    currency: string;
  },
  order: { reference: string; total: number; currency: string },
) {
  if (
    payment.status !== "success" ||
    payment.reference !== order.reference ||
    payment.amount !== order.total ||
    payment.currency !== order.currency
  )
    throw new Error("Payment does not match the order.");
}
