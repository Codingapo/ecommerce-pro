import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { checked } from "@/lib/http";
import { date } from "@/lib/utils";
export default async function Inventory({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { client } = await requireAdmin();
  const page = Math.max(1, Math.floor(Number((await searchParams).page) || 1));
  const rows = checked(
    await client
      .from("inventory_history")
      .select("*")
      .order("created_at", { ascending: false })
      .range((page - 1) * 50, page * 50 - 1),
  );
  return (
    <>
      <p className="eyebrow">EVERY MOVEMENT ACCOUNTED FOR</p>
      <h1>Inventory history.</h1>
      <p className="muted">
        Stock changes from payments and admin adjustments. Low-stock warnings
        appear on the Products page and overview.
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Change</th>
              <th>Stock after</th>
              <th>Reason</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.product_name}</td>
                <td>
                  {r.delta > 0 ? "+" : ""}
                  {r.delta}
                </td>
                <td>{r.stock_after}</td>
                <td>{r.reason}</td>
                <td>{date(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <p className="muted">No stock movements yet.</p>}
      <div className="pagination">
        {page > 1 && <Link href={`?page=${page - 1}`}>← Previous</Link>}
        {rows.length === 50 && <Link href={`?page=${page + 1}`}>Next →</Link>}
      </div>
    </>
  );
}
