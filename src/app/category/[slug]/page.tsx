import { notFound } from "next/navigation";
import Link from "next/link";
import { catalog, categories } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
export const dynamic = "force-dynamic";
export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}) {
  const { slug } = await params;
  const category = (await categories()).find((c) => c.slug === slug);
  if (!category) notFound();
  const page = Math.max(1, Math.floor(Number((await searchParams).page) || 1));
  const { products, count } = await catalog("", slug, page);
  return (
    <section className="section">
      <p className="eyebrow">THE CONSIDERED COLLECTION</p>
      <h1>{category.name}.</h1>
      <p className="muted">
        Thoughtfully chosen pieces for your kind of living.
      </p>
      {products.length ? (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>New pieces are on their way.</p>
          <Link href="/shop">Explore all products →</Link>
        </div>
      )}
      <div className="pagination">
        {page > 1 && <Link href={`?page=${page - 1}`}>← Previous</Link>}
        {page * 12 < count && <Link href={`?page=${page + 1}`}>Next →</Link>}
      </div>
    </section>
  );
}
