import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { validSignature, assertPayment } from "../src/lib/payment-checks";
import { checkoutSchema } from "../src/lib/validation";
test("webhooks require the exact signed body and reject malformed signatures", () => {
  const raw = '{"event":"charge.success"}',
    secret = "test-secret";
  const sig = createHmac("sha512", secret).update(raw).digest("hex");
  assert.equal(validSignature(raw, sig, secret), true);
  for (const s of [null, "bad", "0".repeat(128)])
    assert.equal(validSignature(raw, s, secret), false);
  assert.equal(validSignature(raw + " ", sig, secret), false);
});
test("settlement rejects changed amount, currency, reference and pending payments", () => {
  const order = { reference: "reference", total: 50000, currency: "ZAR" };
  const payment = {
    reference: "reference",
    amount: 50000,
    currency: "ZAR",
    status: "success",
  };
  assert.doesNotThrow(() => assertPayment(payment, order));
  for (const change of [
    { amount: 1 },
    { currency: "USD" },
    { reference: "other" },
    { status: "pending" },
  ])
    assert.throws(() => assertPayment({ ...payment, ...change }, order));
});
test("checkout rejects client prices and invalid quantities", () => {
  const address = {
    name: "Test Buyer",
    phone: "0123456789",
    line1: "12 Test Street",
    city: "Polokwane",
    province: "Limpopo",
    postal_code: "0700",
    country: "ZA",
  };
  const good = {
    items: [
      { product_id: "11111111-1111-4111-8111-111111111111", quantity: 2 },
    ],
    address,
    idempotency_key: "22222222-2222-4222-8222-222222222222",
  };
  assert.equal(checkoutSchema.safeParse(good).success, true);
  assert.equal(checkoutSchema.safeParse({ ...good, total: 1 }).success, false);
  for (const quantity of [0, -1, 1.5, 21])
    assert.equal(
      checkoutSchema.safeParse({
        ...good,
        items: [{ ...good.items[0], quantity }],
      }).success,
      false,
    );
});
