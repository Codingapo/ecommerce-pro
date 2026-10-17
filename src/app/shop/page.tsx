import Link from "next/link";
import { Search } from "lucide-react";
import { catalog, categories } from "@/lib/catalog";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
export const dynamic = "force-dynamic";
export default async function Shop({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; category?: string; page?: string }>;
}) {
  const params = await searchParams;
  const q = (params.q || "").slice(0, 100),
    category = params.category || "",
    page = Math.min(10000, Math.max(1, Number(params.page) || 1));
  const [{ products, count }, cats] = await Promise.all([
    catalog(q, category, page),
    categories(),
  ]);
  const href = (p: number) =>
    `/shop?${new URLSearchParams({ q, category, page: String(p) })}`;
  return (
    <section className="section shop-page">
      <p className="eyebrow">THE CONSIDERED COLLECTION</p>
      <h1>Find your good thing.</h1>
      <div className="shop-controls">
        <div className="category-tabs">
          <Link className={!category ? "selected" : ""} href="/shop">
            All pieces
          </Link>
          {cats.map((c) => (
            <Link
              key={c.slug}
              className={category === c.slug ? "selected" : ""}
              href={`/shop?category=${c.slug}`}
            >
              {c.name}
            </Link>
          ))}
        </div>
        <form className="search-form">
          <input type="hidden" name="category" value={category} />
          <Input
            name="q"
            aria-label="Search products"
            placeholder="Search the collection"
            defaultValue={q}
          />
          <Button size="icon" variant="ghost" aria-label="Search">
            <Search size={18} />
          </Button>
        </form>
      </div>
      <p className="result-count">
        {count} pieces {q && `matching “${q}”`}
      </p>
      {products.length ? (
        <div className="product-grid">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h2>No pieces found.</h2>
          <p>Try a different search or explore the full collection.</p>
          <Button asChild variant="outline">
            <Link href="/shop">Clear filters</Link>
          </Button>
        </div>
      )}
      <div className="pagination">
        {page > 1 && <Link href={href(page - 1)}>← Previous</Link>}
        {page * 12 < count && <Link href={href(page + 1)}>Next →</Link>}
      </div>
    </section>
  );
}
