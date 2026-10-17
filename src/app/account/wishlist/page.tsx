import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { checked } from "@/lib/http";
import { ProductCard } from "@/components/product-card";
import { WishlistButton } from "@/components/wishlist-button";
export default async function Wishlist({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { client, user } = await requireUser();
  const page = Math.max(1, Math.floor(Number((await searchParams).page) || 1));
  const saved = checked(
    await client
      .from("wishlists")
      .select("product_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .range((page - 1) * 24, page * 24 - 1),
  );
  const products = saved.length
    ? checked(
        await client
          .from("products")
          .select("*")
          .in(
            "id",
            saved.map((s) => s.product_id),
          )
          .eq("active", true),
      )
    : [];
  return (
    <section className="section">
      <p className="eyebrow">KEPT CLOSE</p>
      <h1>Your wishlist.</h1>
      {products.length ? (
        <div className="product-grid">
          {products.map((p) => (
            <div key={p.id}>
              <ProductCard product={p} />
              <WishlistButton productId={p.id} />
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>Your favourites are waiting to be found.</h2>
          <Link href="/shop">Explore the collection →</Link>
        </div>
      )}
      <div className="pagination">
        {page > 1 && <Link href={`?page=${page - 1}`}>← Previous</Link>}
        {saved.length === 24 && <Link href={`?page=${page + 1}`}>Next →</Link>}
      </div>
    </section>
  );
}
