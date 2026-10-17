import { money, date } from "@/lib/utils";
import type { Order, OrderItem } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
export function OrderDetailView({
  order,
  items,
}: {
  order: Order;
  items: OrderItem[];
}) {
  const address = order.shipping_address as Record<string, string>;
  return (
    <div className="order-detail invoice">
      <p className="eyebrow">MULABA · ORDER RECEIPT</p>
      <div className="section-heading">
        <div>
          <p className="eyebrow">{date(order.created_at)}</p>
          <h1>Order #{String(order.order_number).padStart(6, "0")}</h1>
        </div>
        <Badge>{order.status}</Badge>
      </div>
      <p>
        Payment: <strong>{order.payment_status}</strong>
      </p>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id}>
                <td>{i.name}</td>
                <td>{i.quantity}</td>
                <td>{money(i.unit_price * i.quantity, order.currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {order.discount > 0 && (
        <p className="muted">
          Subtotal {money(order.subtotal, order.currency)} · Discount{" "}
          {money(order.discount, order.currency)} ({order.coupon_code})
        </p>
      )}
      <p className="order-total">Total {money(order.total, order.currency)}</p>
      <div className="form-card">
        <h3>Delivery address</h3>
        <p>
          {address.name}
          <br />
          {address.line1}
          <br />
          {address.city}, {address.province} {address.postal_code}
          <br />
          {address.phone}
        </p>
      </div>
      <p className="muted">Payment reference: {order.reference}</p>
    </div>
  );
}
