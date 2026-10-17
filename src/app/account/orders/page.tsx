import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { checked } from "@/lib/http";
import { OrderTable } from "@/components/order-table";
export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { client, user } = await requireUser();
  const page = Math.max(1, Math.floor(Number((await searchParams).page) || 1));
  const orders = checked(
    await client
      .from("orders")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range((page - 1) * 25, page * 25 - 1),
  );
  return (
    <section className="section">
      <p className="eyebrow">YOUR ACCOUNT</p>
      <h1>Your orders.</h1>
      <OrderTable orders={orders} />
      <div className="pagination">
        {page > 1 && <Link href={`?page=${page - 1}`}>← Previous</Link>}
        {orders.length === 25 && <Link href={`?page=${page + 1}`}>Next →</Link>}
      </div>
    </section>
  );
}
