import Link from "next/link";
import type { Order } from "@/lib/types";
import { date, money } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
export function OrderTable({
  orders,
  admin = false,
}: {
  orders: Order[];
  admin?: boolean;
}) {
  if (!orders.length)
    return (
      <div className="empty-state">
        <h2>No orders yet.</h2>
        <p>Your orders will appear here.</p>
      </div>
    );
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Order</th>
            <th>Date</th>
            {admin && <th>Customer</th>}
            <th>Status</th>
            <th>Payment</th>
            <th>Total</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id}>
              <td>
                <Link
                  className="text-link"
                  href={`${admin ? "/admin" : "/account"}/orders/${o.id}`}
                >
                  #{String(o.order_number).padStart(6, "0")} ↗
                </Link>
              </td>
              <td>{date(o.created_at)}</td>
              {admin && <td>{o.email}</td>}
              <td>
                <Badge>{o.status}</Badge>
              </td>
              <td>
                <Badge
                  className={
                    o.payment_status === "paid"
                      ? "bg-emerald-100 text-emerald-900"
                      : ""
                  }
                >
                  {o.payment_status}
                </Badge>
              </td>
              <td>{money(o.total, o.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
