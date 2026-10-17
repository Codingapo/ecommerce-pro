import "server-only";
import { adminDb } from "@/lib/supabase/admin";
import { verifyPayment } from "@/lib/paystack";
import { assertPayment } from "@/lib/payment-checks";
import { AppError, checked } from "@/lib/http";
export async function settle(reference: string, userId?: string) {
  const client = adminDb();
  const result = await client
    .from("orders")
    .select("*")
    .eq("reference", reference)
    .maybeSingle();
  if (result.error) throw new Error("Order lookup failed");
  const order = result.data;
  if (!order || (userId && order.user_id !== userId))
    throw new AppError(404, "Order not found.");
  const payment = await verifyPayment(reference);
  if (payment.status !== "success")
    throw new AppError(
      409,
      "Payment is not confirmed yet. Please retry shortly.",
    );
  assertPayment(payment, order);
  return checked(
    await client.rpc("complete_payment", {
      p_reference: reference,
      p_amount: payment.amount,
      p_currency: payment.currency,
      p_transaction: String(payment.id),
    }),
  );
}
