"use client";
import Link from "next/link";
import { ShoppingBag, UserRound, ArrowUpRight, Heart } from "lucide-react";
import { usePathname } from "next/navigation";
import { useCart } from "@/stores/cart";
export function Header() {
  const count = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const path = usePathname();
  return (
    <>
      <div className="announcement">
        Considered goods. Everyday living.{" "}
        <Link href="/shop">
          Explore the collection <ArrowUpRight size={12} />
        </Link>
      </div>
      <header id="store-top" className="site-header">
        <Link href="/" className="wordmark">
          {process.env.NEXT_PUBLIC_STORE_NAME || "mulaba"}
          <span>®</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link aria-current={path === "/" ? "page" : undefined} href="/">
            Home
          </Link>
          <Link
            aria-current={path.startsWith("/shop") ? "page" : undefined}
            href="/shop"
          >
            Shop all
          </Link>
          <Link href="/category/living">Living</Link>
          <Link href="/#faq">FAQs</Link>
          <Link href="/#contact">Contact</Link>
        </nav>
        <div className="header-actions">
          <Link href="/account/wishlist" aria-label="Your wishlist">
            <Heart size={19} />
          </Link>
          <Link href="/account" aria-label="Your account">
            <UserRound size={20} />
          </Link>
          <Link
            href="/cart"
            className="cart-link"
            aria-label={`Shopping bag, ${count} items`}
          >
            <ShoppingBag size={20} />
            <span>{count}</span>
          </Link>
        </div>
      </header>
    </>
  );
}
