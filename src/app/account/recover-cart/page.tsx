import { requireUser } from "@/lib/auth";
import { checked } from "@/lib/http";
import { RecoverCart } from "@/components/recover-cart";
export default async function Recovery() {
  const { user, client } = await requireUser();
  const cart = checked(
    await client
      .from("carts")
      .select("items")
      .eq("user_id", user.id)
      .maybeSingle(),
  );
  const saved = (cart?.items || []) as {
    product_id: string;
    quantity: number;
  }[];
  const products = saved.length
    ? checked(
        await client
          .from("products")
          .select("*")
          .in(
            "id",
            saved.map((i) => i.product_id),
          )
          .eq("active", true)
          .gt("stock", 0),
      )
    : [];
  const items = products.map((p) => ({
    ...p,
    quantity: Math.min(
      p.stock,
      saved.find((i) => i.product_id === p.id)?.quantity || 1,
    ),
  }));
  return (
    <section className="section">
      <p className="eyebrow">PICK UP WHERE YOU LEFT OFF</p>
      <h1>Still a good choice.</h1>
      <RecoverCart items={items} />
    </section>
  );
}
