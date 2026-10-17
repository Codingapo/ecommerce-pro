import { notFound } from "next/navigation";
import { z } from "zod";
import { requireUser } from "@/lib/auth";
import { checked } from "@/lib/http";
import { OrderDetailView } from "@/components/order-detail";
export default async function OrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const id = (await params).id;
  if (!z.uuid().safeParse(id).success) notFound();
  const { client, user } = await requireUser();
  const order = checked(
    await client
      .from("orders")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .maybeSingle(),
  );
  if (!order) notFound();
  const items = checked(
    await client.from("order_items").select("*").eq("order_id", id),
  );
  return (
    <section className="section">
      <OrderDetailView order={order} items={items} />
    </section>
  );
}
