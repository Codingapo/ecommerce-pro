import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { checked } from "@/lib/http";
export default async function Activity({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { client } = await requireAdmin();
  const page = Math.max(1, Math.floor(Number((await searchParams).page) || 1));
  const rows = checked(
    await client
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .range((page - 1) * 50, page * 50 - 1),
  );
  return (
    <>
      <p className="eyebrow">A CLEAR TRAIL</p>
      <h1>Store activity.</h1>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Action</th>
              <th>Entity</th>
              <th>Actor</th>
              <th>Time (UTC)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.action}</td>
                <td>
                  {r.entity} · {r.entity_id.slice(0, 8)}
                </td>
                <td>{r.actor_id || "System"}</td>
                <td>
                  {new Date(r.created_at)
                    .toISOString()
                    .replace("T", " ")
                    .slice(0, 19)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!rows.length && <p className="muted">Admin actions will appear here.</p>}
      <div className="pagination">
        {page > 1 && <Link href={`?page=${page - 1}`}>← Previous</Link>}
        {rows.length === 50 && <Link href={`?page=${page + 1}`}>Next →</Link>}
      </div>
    </>
  );
}
