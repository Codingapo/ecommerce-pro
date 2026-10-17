import { requireAdmin } from "@/lib/auth";
import { money } from "@/lib/utils";
import { checked } from "@/lib/http";
import { OrderTable } from "@/components/order-table";
export default async function AdminPage() {
  const { client } = await requireAdmin();
  const [summary, orders] = await Promise.all([
    client.from("orders").select("total.sum()").eq("payment_status", "paid"),
    client
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);
  let total = 0;
  if (!summary.error)
    total = Number((summary.data as unknown as { sum: number }[])[0]?.sum || 0);
  else {
    // Aggregate queries can be disabled by PostgREST; page through all paid orders.
    let offset = 0;
    while (true) {
      const rows = checked(
        await client
          .from("orders")
          .select("total")
          .eq("payment_status", "paid")
          .order("id")
          .range(offset, offset + 999),
      );
      total += rows.reduce((s, o) => s + o.total, 0);
      if (rows.length < 1000) break;
      offset += 1000;
    }
  }
  const low = checked(
    await client
      .from("products")
      .select("*")
      .eq("active", true)
      .order("stock")
      .limit(100),
  ).filter((p) => p.stock <= p.low_stock_threshold);
  return (
    <>
      <p className="eyebrow">YOUR STORE AT A GLANCE</p>
      <h1>Overview.</h1>
      <div className="stat-grid">
        <div className="stat-card">
          <span>Total paid sales</span>
          <strong>{money(total, process.env.STORE_CURRENCY || "ZAR")}</strong>
          <small>Confirmed payments only</small>
        </div>
      </div>
      {low.length > 0 && (
        <div className="stock-notice">
          <strong>Low stock needs attention</strong>
          <p>
            {low
              .slice(0, 10)
              .map((p) => `${p.name} (${p.stock})`)
              .join(" · ")}
          </p>
          <a href="/admin/products">Manage stock →</a>
        </div>
      )}
      <div className="section-heading">
        <h2>Recent orders</h2>
      </div>
      <OrderTable orders={checked(orders)} admin />
    </>
  );
}
