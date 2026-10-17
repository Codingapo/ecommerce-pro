import "server-only";
import { requireAdmin } from "@/lib/auth";
import { checked } from "@/lib/http";
import type { Order, OrderItem } from "@/lib/types";
export type SalesReport = {
  revenue: number;
  paidOrders: number;
  daily: { date: string; revenue: number }[];
  statuses: { name: string; value: number }[];
  top: { name: string; quantity: number; revenue: number }[];
};
export async function salesReport(
  start: string,
  end: string,
): Promise<SalesReport> {
  const { client } = await requireAdmin();
  const orders: Order[] = [];
  // Pagination prevents the default 1,000-row Data API cap from truncating reports.
  for (let offset = 0; ; offset += 1000) {
    const rows = checked(
      await client
        .from("orders")
        .select("*")
        .gte("created_at", start)
        .lt("created_at", end)
        .order("id")
        .range(offset, offset + 999),
    );
    orders.push(...rows);
    if (rows.length < 1000) break;
  }
  const paid: Order[] = [];
  for (let offset = 0; ; offset += 1000) {
    const rows = checked(
      await client
        .from("orders")
        .select("*")
        .eq("payment_status", "paid")
        .gte("paid_at", start)
        .lt("paid_at", end)
        .order("id")
        .range(offset, offset + 999),
    );
    paid.push(...rows);
    if (rows.length < 1000) break;
  }
  const daily = new Map<string, number>();
  for (
    let d = new Date(start);
    d < new Date(end);
    d.setUTCDate(d.getUTCDate() + 1)
  )
    daily.set(d.toISOString().slice(0, 10), 0);
  for (const o of paid) {
    const day = o.paid_at!.slice(0, 10);
    daily.set(day, (daily.get(day) || 0) + o.total);
  }
  const status = new Map<string, number>();
  for (const o of orders) status.set(o.status, (status.get(o.status) || 0) + 1);
  const items: OrderItem[] = [];
  for (let i = 0; i < paid.length; i += 100) {
    for (let offset = 0; ; offset += 1000) {
      const rows = checked(
        await client
          .from("order_items")
          .select("*")
          .in(
            "order_id",
            paid.slice(i, i + 100).map((o) => o.id),
          )
          .order("id")
          .range(offset, offset + 999),
      );
      items.push(...rows);
      if (rows.length < 1000) break;
    }
  }
  const products = new Map<
    string,
    { name: string; quantity: number; revenue: number }
  >();
  for (const i of items) {
    const key = i.product_id || i.name;
    const row = products.get(key) || { name: i.name, quantity: 0, revenue: 0 };
    row.quantity += i.quantity;
    row.revenue += i.quantity * i.unit_price;
    products.set(key, row);
  }
  return {
    revenue: paid.reduce((s, o) => s + o.total, 0),
    paidOrders: paid.length,
    daily: [...daily].map(([date, revenue]) => ({ date, revenue })),
    statuses: [...status].map(([name, value]) => ({ name, value })),
    top: [...products.values()]
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 8),
  };
}
