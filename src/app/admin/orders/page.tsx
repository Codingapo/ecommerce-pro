import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { checked } from "@/lib/http";
import { OrderTable } from "@/components/order-table";
export default async function AdminOrders({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const page = Math.max(1, Math.floor(Number((await searchParams).page) || 1));
  const { client } = await requireAdmin();
  const orders = checked(
    await client
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })
      .range((page - 1) * 25, page * 25 - 1),
  );
  return (
    <>
      <p className="eyebrow">FULFILMENT</p>
      <div className="section-heading">
        <h1>Orders.</h1>
        <a className="text-link" href="/api/admin/export?kind=orders">
          Export CSV ↓
        </a>
      </div>
      <OrderTable orders={orders} admin />
      <div className="pagination">
        {page > 1 && <Link href={`?page=${page - 1}`}>← Previous</Link>}
        {orders.length === 25 && <Link href={`?page=${page + 1}`}>Next →</Link>}
      </div>
    </>
  );
}
