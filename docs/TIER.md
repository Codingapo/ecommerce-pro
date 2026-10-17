# Pro version

Everything in Mild, plus:

- Consent-aware Supabase event tracking: page views, product views, add to cart, checkout started and purchase completed. No PostHog account is required.
- Ordered session funnel, tracked conversion rate, revenue, AOV, sources and top products, with date filters and daily/weekly/monthly grouping.
- Verified-purchase reviews and ratings; private customer wishlists.
- Percentage coupons with minimum spend, expiry, activation and server-side quote/settlement calculations.
- Transactional stock history and admin activity logs.
- Streamed orders/customers CSV exports with spreadsheet-formula protection.
- Opt-in abandoned cart reminders, durable saved carts and signed unsubscribe links.
- Product metadata and structured data, robots/sitemap, optimized/lazy product images and toast notifications.

**Presentation:** light theme throughout, following the user's updated instruction. No dark-mode toggle is included.

**Optional features not included:** staff/super-admin role separation and generated PDF invoices. Admin/customer roles and a printable invoice-style order receipt are implemented. The receipt is not a VAT tax invoice.

### Pro setup

Set `UNSUBSCRIBE_SECRET` to an independently generated secret of at least 32 characters. The daily `/api/cron/recovery` job uses the same `CRON_SECRET` protection as the email outbox. Signed opt-out links do not require login; a confirmation POST changes the preference, so email link scanners cannot unsubscribe someone just by opening a URL.

Customers must explicitly enable shopping reminders on their account profile. Signed-in carts are saved after a short debounce. A reminder is eligible after 24 hours of inactivity, within 14 days, only when no later paid order exists. Workers claim cart leases, re-check consent and cart freshness, and use Resend idempotency keys. A reminder links to `/account/recover-cart`; restoring the saved bag is an explicit action and uses current product availability. One reminder is sent per unchanged saved cart.

Analytics starts only after opt-in and can be disabled through the footer preference control. Browser events cannot submit a purchase or checkout event; those are written by trusted transaction functions. Conversion is based only on consenting sessions that follow the ordered funnel **within the selected date range**. Revenue/AOV include all confirmed payments. Browser event tracking is telemetry, not fraud-proof financial evidence. Dates are UTC.

Coupons do not have redemption caps or stacking. The database revalidates active state, expiry and minimum spend during checkout and snapshots the discount on the order. Checkout attempts keep that snapshot. Reports show net paid order revenue and gross top-product item sales.

Stock is checked at checkout and allocated on verified payment. A paid order that cannot be allocated is held for restock/refund attention; it is never silently fulfilled with negative inventory. Refund execution remains in the Paystack dashboard.
