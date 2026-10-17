import { notFound } from "next/navigation";
import Link from "next/link";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { checked } from "@/lib/http";
import { OrderTable } from "@/components/order-table";
export default async function Customer({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const page = Math.max(1, Math.floor(Number((await searchParams).page) || 1));
  const { client } = await requireAdmin();
  const customer = checked(
    await client.from("profiles").select("*").eq("id", id).maybeSingle(),
  );
  if (!customer) notFound();
  const orders = checked(
    await client
      .from("orders")
      .select("*")
      .eq("user_id", id)
      .order("created_at", { ascending: false })
      .range((page - 1) * 25, page * 25 - 1),
  );
  return (
    <>
      <p className="eyebrow">CUSTOMER</p>
      <h1>{customer.full_name || "Customer"}</h1>
      <p>
        {customer.email} · {customer.phone || "No phone saved"}
      </p>
      <OrderTable orders={orders} admin />
      <div className="pagination">
        {page > 1 && <Link href={`?page=${page - 1}`}>← Previous</Link>}
        {orders.length === 25 && <Link href={`?page=${page + 1}`}>Next →</Link>}
      </div>
    </>
  );
}
