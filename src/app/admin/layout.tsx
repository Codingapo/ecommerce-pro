import Link from "next/link";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  ArrowUpRight,
  UsersRound,
  ChartNoAxesCombined,
  TicketPercent,
  ClipboardList,
  Boxes,
} from "lucide-react";
export const dynamic = "force-dynamic";
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireAdmin();
  } catch {
    redirect("/login?next=/admin");
  }
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <span className="admin-dot" />
          <strong>Store workspace</strong>
          <small>Pro edition</small>
        </div>
        <nav aria-label="Admin navigation">
          <Link href="/admin">
            <LayoutDashboard size={18} /> Overview
          </Link>
          <Link href="/admin/products">
            <Package size={18} /> Products
          </Link>
          <Link href="/admin/orders">
            <ShoppingBag size={18} /> Orders
          </Link>
          <Link href="/admin/customers">
            <UsersRound size={18} /> Customers
          </Link>
          <Link href="/admin/analytics">
            <ChartNoAxesCombined size={18} /> Analytics
          </Link>
          <Link href="/admin/coupons">
            <TicketPercent size={18} /> Coupons
          </Link>
          <Link href="/admin/inventory">
            <Boxes size={18} /> Inventory
          </Link>
          <Link href="/admin/activity">
            <ClipboardList size={18} /> Activity
          </Link>
        </nav>
        <Link href="/shop" className="text-link">
          Visit storefront <ArrowUpRight size={16} />
        </Link>
      </aside>
      <div className="admin-main">{children}</div>
    </div>
  );
}
