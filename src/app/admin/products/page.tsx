import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { checked } from "@/lib/http";
import { money } from "@/lib/utils";
import { Button } from "@/components/ui/button";
export default async function AdminProducts({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { client } = await requireAdmin();
  const page = Math.max(1, Math.floor(Number((await searchParams).page) || 1));
  const products = checked(
    await client
      .from("products")
      .select("*")
      .order("created_at", { ascending: false })
      .range((page - 1) * 25, page * 25 - 1),
  );
  return (
    <>
      <div className="section-heading">
        <div>
          <p className="eyebrow">YOUR COLLECTION</p>
          <h1>Products.</h1>
        </div>
        <Button asChild>
          <Link href="/admin/products/new">+ Add product</Link>
        </Button>
      </div>
      {products.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Visibility</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="table-product">
                      <img src={p.image_url} alt="" />
                      {p.name}
                    </div>
                  </td>
                  <td>{p.category}</td>
                  <td>{money(p.price)}</td>
                  <td>
                    <span
                      className={
                        p.stock <= p.low_stock_threshold ? "stock-warning" : ""
                      }
                    >
                      {p.stock}
                      {p.stock <= p.low_stock_threshold ? " · Low stock" : ""}
                    </span>
                  </td>
                  <td>{p.active ? "Published" : "Draft"}</td>
                  <td>
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="text-link"
                    >
                      Edit ↗
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <h2>Your collection starts here.</h2>
          <p>Add your first product to bring your storefront to life.</p>
        </div>
      )}
      <div className="pagination">
        {page > 1 && <Link href={`?page=${page - 1}`}>← Previous</Link>}
        {products.length === 25 && (
          <Link href={`?page=${page + 1}`}>Next →</Link>
        )}
      </div>
    </>
  );
}
