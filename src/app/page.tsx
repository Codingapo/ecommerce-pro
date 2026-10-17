import Link from "next/link";
import Image from "next/image";
import {
  ArrowUpRight,
  ArrowRight,
  PackageCheck,
  ShieldCheck,
  HeartHandshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { catalog } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export default async function Home() {
  const { products } = await catalog();
  return (
    <>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="tiny-line" /> THE EVERYDAY, ELEVATED
          </p>
          <h1>
            Good things.
            <br />
            For <em>your</em>
            <br />
            kind of living.
          </h1>
          <p className="hero-description">
            Thoughtfully chosen pieces for the spaces you love and the moments
            in between.
          </p>
          <Button asChild>
            <Link href="/shop">
              Discover the collection <ArrowUpRight size={18} />
            </Link>
          </Button>
          <div className="hero-bottom">
            <span>01 — THE CONSIDERED COLLECTION</span>
            <span>EST. 2026</span>
          </div>
        </div>
        <div className="hero-art">
          <Image
            fill
            sizes="(max-width: 700px) 100vw, 50vw"
            priority
            src="https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1600&q=90"
            alt="Sculptural wooden chair in a light, airy room"
          />
          <div className="floating-label">
            <span>LESS, BUT BETTER.</span>
            <ArrowUpRight size={20} />
          </div>
          <div className="hero-caption">
            <p>Make room for the everyday.</p>
            <Link href="/shop?category=furniture" aria-label="Shop furniture">
              <ArrowRight />
            </Link>
          </div>
        </div>
      </section>
      <section className="benefits">
        <span>
          <PackageCheck /> Carefully selected pieces
        </span>
        <span>
          <ShieldCheck /> Secure Paystack checkout
        </span>
        <span>
          <HeartHandshake /> Made for everyday living
        </span>
      </section>
      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">YOUR NEXT FAVOURITE</p>
            <h2>The good finds.</h2>
          </div>
          <Link href="/shop" className="text-link">
            Shop all pieces <ArrowUpRight size={17} />
          </Link>
        </div>
        <div className="product-grid">
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>
      <section className="editorial">
        <div className="editorial-image">
          <Image
            width={1200}
            height={1000}
            sizes="(max-width: 700px) 90vw, 45vw"
            src="https://images.unsplash.com/photo-1499933374294-4584851497cc?auto=format&fit=crop&w=1200&q=85"
            alt="A thoughtfully arranged desk with simple home accessories"
            loading="lazy"
          />
        </div>
        <div>
          <p className="eyebrow">FIND YOUR EVERYDAY</p>
          <h2>
            A home that
            <br />
            feels like <em>you.</em>
          </h2>
          <p>
            The best spaces tell a story. Start with a favourite piece, add a
            little texture, and let the rest unfold.
          </p>
          <Button asChild variant="outline">
            <Link href="/shop?category=living">
              Explore living <ArrowUpRight size={17} />
            </Link>
          </Button>
        </div>
      </section>
    </>
  );
}
