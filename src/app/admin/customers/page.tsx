import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { checked } from "@/lib/http";
import { date } from "@/lib/utils";
export default async function Customers({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { client } = await requireAdmin();
  const page = Math.max(1, Math.floor(Number((await searchParams).page) || 1));
  const customers = checked(
    await client
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false })
      .range((page - 1) * 25, page * 25 - 1),
  );
  return (
    <>
      <p className="eyebrow">THE PEOPLE BEHIND YOUR ORDERS</p>
      <div className="section-heading">
        <h1>Customers.</h1>
        <a className="text-link" href="/api/admin/export?kind=customers">
          Export CSV ↓
        </a>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Joined</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id}>
                <td>{c.full_name || "Customer"}</td>
                <td>{c.email}</td>
                <td>{c.phone || "—"}</td>
                <td>{date(c.created_at)}</td>
                <td>
                  <Link href={`/admin/customers/${c.id}`} className="text-link">
                    View orders ↗
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!customers.length && <p className="muted">No customers yet.</p>}
      <div className="pagination">
        {page > 1 && <Link href={`?page=${page - 1}`}>← Previous</Link>}
        {customers.length === 25 && (
          <Link href={`?page=${page + 1}`}>Next →</Link>
        )}
      </div>
    </>
  );
}
