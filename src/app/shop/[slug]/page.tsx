import Link from "next/link";
import { notFound } from "next/navigation";
import { productBySlug } from "@/lib/catalog";
import { money } from "@/lib/utils";
import { ProductView } from "@/components/product-view";
import { Reviews } from "@/components/reviews";
import { WishlistButton } from "@/components/wishlist-button";
import { ProductGallery } from "@/components/product-gallery";
import { AddToCart } from "@/components/add-to-cart";
export const dynamic = "force-dynamic";
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const product = await productBySlug((await params).slug);
  if (!product) notFound();
  return (
    <section className="section">
      <ProductView id={product.id} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: product.name,
            description: product.description,
            image: product.images?.length
              ? product.images
              : [product.image_url],
            sku: product.id,
            offers: {
              "@type": "Offer",
              price: product.price / 100,
              priceCurrency: "ZAR",
              availability:
                product.stock > 0
                  ? "https://schema.org/InStock"
                  : "https://schema.org/OutOfStock",
              url: `${process.env.NEXT_PUBLIC_SITE_URL}/shop/${product.slug}`,
            },
          }).replace(/</g, "\\u003c"),
        }}
      />
      <div className="breadcrumb">
        <Link href="/shop">The collection</Link>
        <span>/</span>
        <span>{product.name}</span>
      </div>
      <div className="product-detail">
        <ProductGallery
          images={product.images?.length ? product.images : [product.image_url]}
          name={product.name}
        />
        <div className="detail-copy">
          <p className="eyebrow">{product.category}</p>
          <h1>{product.name}</h1>
          <p className="detail-price">{money(product.price)}</p>
          <p className="detail-description">{product.description}</p>
          <p className="stock-label">
            {product.stock > 0
              ? "In stock · ready for your everyday"
              : "Currently out of stock"}
          </p>
          <AddToCart product={product} />
          <WishlistButton productId={product.id} />
          <div className="detail-notes">
            <p>Secure payment with Paystack</p>
            <p>Delivery details confirmed at checkout</p>
            <p>Carefully selected for everyday living</p>
          </div>
        </div>
      </div>
      <Reviews productId={product.id} />
    </section>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const product = await productBySlug((await params).slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: {
      title: product.name,
      description: product.description.slice(0, 160),
      images: [product.image_url],
    },
  };
}
