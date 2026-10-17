import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { checked } from "@/lib/http";
import { OrderDetailView } from "@/components/order-detail";
import { OrderStatusForm } from "@/components/order-status";
export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  if (!z.uuid().safeParse(id).success) notFound();
  const { client } = await requireAdmin();
  const order = checked(
    await client.from("orders").select("*").eq("id", id).maybeSingle(),
  );
  if (!order) notFound();
  const items = checked(
    await client.from("order_items").select("*").eq("order_id", id),
  );
  return (
    <>
      <OrderDetailView order={order} items={items} />
      <OrderStatusForm order={order} />
    </>
  );
}
