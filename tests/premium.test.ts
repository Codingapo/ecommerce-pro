import { test } from "node:test";
import assert from "node:assert/strict";
import { csvCell } from "../src/lib/csv";
import { funnelReport, groupRevenue } from "../src/lib/funnel";
import {
  unsubscribeToken,
  validateUnsubscribe,
} from "../src/lib/unsubscribe-token";
test("CSV neutralizes spreadsheet formulas, preserves quoted content and phone values", () => {
  assert.equal(
    csvCell('=HYPERLINK("https://bad")'),
    '"\'=HYPERLINK(""https://bad"")"',
  );
  assert.equal(csvCell(" +cmd"), '"\' +cmd"');
  assert.equal(csvCell("+27821234567"), '"\'+27821234567"');
  assert.equal(csvCell("safe, text"), '"safe, text"');
});
test("funnel counts unique sessions and ordered steps, not raw event counts", () => {
  const event = (session_id: string, kind: string, second: number) => ({
    session_id,
    kind,
    source: "direct",
    created_at: `2026-10-17T12:00:${String(second).padStart(2, "0")}Z`,
  });
  const r = funnelReport([
    event("a", "page_view", 1),
    event("a", "product_view", 2),
    event("a", "product_view", 3),
    event("a", "add_to_cart", 4),
    event("a", "checkout_started", 5),
    event("a", "purchase_completed", 6),
    event("b", "page_view", 1),
    event("b", "purchase_completed", 2),
    event("c", "product_view", 3),
  ]);
  assert.equal(r.sessions, 2);
  assert.deepEqual(
    r.funnel.map((s) => s.value),
    [2, 1, 1, 1, 1],
  );
  assert.equal(r.conversion, 50);
});
test("reports group weekly and monthly paid revenue without losing value", () => {
  const rows = [
    { date: "2026-10-05", revenue: 200 },
    { date: "2026-10-06", revenue: 300 },
    { date: "2026-10-12", revenue: 400 },
  ];
  assert.deepEqual(groupRevenue(rows, "week"), [
    { date: "2026-10-05", revenue: 500 },
    { date: "2026-10-12", revenue: 400 },
  ]);
  assert.equal(groupRevenue(rows, "month")[0].revenue, 900);
});
test("unsubscribe tokens cannot be forged or reassigned", () => {
  const id = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    secret = "a-long-test-secret";
  const token = unsubscribeToken(id, secret);
  assert.equal(validateUnsubscribe(token, secret), id);
  assert.equal(validateUnsubscribe(token, "other"), null);
  assert.equal(
    validateUnsubscribe(token.replace("aaaa", "bbbb"), secret),
    null,
  );
  assert.equal(validateUnsubscribe("bad-token", secret), null);
});
