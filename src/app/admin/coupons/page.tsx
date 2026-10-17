import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { checked } from "@/lib/http";
import { CouponEditor } from "@/components/coupon-editor";
export default async function Coupons({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { client } = await requireAdmin();
  const page = Math.max(1, Math.floor(Number((await searchParams).page) || 1));
  const rows = checked(
    await client
      .from("coupons")
      .select("*")
      .order("created_at", { ascending: false })
      .range((page - 1) * 10, page * 10 - 1),
  );
  return (
    <>
      <p className="eyebrow">A REASON TO COME BACK</p>
      <h1>Discount codes.</h1>
      <p className="muted">
        Percentage discounts with a minimum spend and expiry. One code per
        order.
      </p>
      <CouponEditor />
      <div className="report-grid">
        {rows.map((c) => (
          <CouponEditor key={c.id} coupon={c} />
        ))}
      </div>
      <div className="pagination">
        {page > 1 && <Link href={`?page=${page - 1}`}>← Previous</Link>}
        {rows.length === 10 && <Link href={`?page=${page + 1}`}>Next →</Link>}
      </div>
    </>
  );
}
