import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight } from "lucide-react";
import type { Product } from "@/lib/types";
import { money } from "@/lib/utils";
export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <Link href={`/shop/${product.slug}`} className="product-image">
        <Image
          sizes="(max-width: 700px) 44vw, 22vw"
          src={product.image_url}
          alt={product.name}
          loading="lazy"
          width={600}
          height={720}
        />
        <span className="product-arrow">
          <ArrowUpRight size={20} />
        </span>
      </Link>
      <div className="product-meta">
        <div>
          <p className="eyebrow">{product.category}</p>
          <h3>
            <Link href={`/shop/${product.slug}`}>{product.name}</Link>
          </h3>
        </div>
        <p>{money(product.price)}</p>
      </div>
    </article>
  );
}
