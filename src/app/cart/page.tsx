"use client";
import Link from "next/link";
import { Minus, Plus, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/stores/cart";
import { money } from "@/lib/utils";
import { Button } from "@/components/ui/button";
export default function CartPage() {
  const { items, setQuantity } = useCart();
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
  return (
    <section className="section">
      <p className="eyebrow">GOOD CHOICES</p>
      <h1>Your bag.</h1>
      {!items.length ? (
        <div className="empty-state">
          <h2>A little room for something good.</h2>
          <p>Your bag is empty. Explore the collection to get started.</p>
          <Button asChild>
            <Link href="/shop">
              Find your favourite <ArrowRight size={17} />
            </Link>
          </Button>
        </div>
      ) : (
        <div className="cart-layout">
          <div>
            {items.map((item) => (
              <article className="cart-row" key={item.id}>
                <img src={item.image_url} alt={item.name} />
                <div>
                  <h3>
                    <Link href={`/shop/${item.slug}`}>{item.name}</Link>
                  </h3>
                  <p>{money(item.price)}</p>
                  <div className="quantity">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Remove one ${item.name}`}
                      onClick={() => setQuantity(item.id, item.quantity - 1)}
                    >
                      <Minus size={15} />
                    </Button>
                    <span>{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={item.quantity >= 20}
                      aria-label={`Add one ${item.name}`}
                      onClick={() => setQuantity(item.id, item.quantity + 1)}
                    >
                      <Plus size={15} />
                    </Button>
                  </div>
                </div>
                <div className="cart-row-total">
                  <strong>{money(item.price * item.quantity)}</strong>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Remove ${item.name}`}
                    onClick={() => setQuantity(item.id, 0)}
                  >
                    <Trash2 size={17} />
                  </Button>
                </div>
              </article>
            ))}
          </div>
          <aside className="summary-card">
            <h2>Order summary</h2>
            <div>
              <span>Subtotal</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <div>
              <span>Delivery</span>
              <span>Included</span>
            </div>
            <div className="summary-total">
              <span>Estimated total</span>
              <strong>{money(subtotal)}</strong>
            </div>
            <p>Final prices are checked securely at checkout.</p>
            <Button asChild className="w-full">
              <Link href="/checkout">
                Continue to checkout <ArrowRight size={17} />
              </Link>
            </Button>
            <Link className="text-link centered" href="/shop">
              Continue exploring
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}
