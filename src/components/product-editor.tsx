"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Product, Category } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { api } from "@/lib/client-api";
export function ProductEditor({
  product,
  categories,
}: {
  product?: Product;
  categories: Category[];
}) {
  const router = useRouter();
  const [images, setImages] = useState<string[]>(
    product?.images?.length
      ? product.images
      : product?.image_url
        ? [product.image_url]
        : [],
  );
  const [image, setImage] = useState(product?.image_url || ""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function upload(file?: File) {
    if (!file) return;
    setBusy(true);
    setError("");
    try {
      const form = new FormData();
      form.append("file", file);
      const result = await api<{ url: string }>("/api/admin/upload", form);
      setImage((current) => current || result.url);
      setImages((current) => [...current, result.url].slice(0, 8));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      await api("/api/admin/products", {
        id: product?.id,
        expected_stock: product?.stock,
        product: {
          name: f.get("name"),
          slug: f.get("slug"),
          description: f.get("description"),
          category: f.get("category"),
          price: Math.round(Number(f.get("price")) * 100),
          image_url: images[0] || image,
          images,
          stock: Number(f.get("stock")),
          low_stock_threshold: Number(f.get("low_stock_threshold")),
          active: f.get("active") === "on",
          featured: f.get("featured") === "on",
        },
      });
      router.push("/admin/products");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form onSubmit={submit} className="form-card product-form">
      <div className="form-grid">
        <label>
          Name
          <Input
            name="name"
            defaultValue={product?.name}
            required
            maxLength={140}
          />
        </label>
        <label>
          URL slug
          <Input
            name="slug"
            defaultValue={product?.slug}
            required
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
          />
        </label>
        <label>
          Price (ZAR)
          <Input
            name="price"
            type="number"
            min="1"
            step="0.01"
            defaultValue={product ? product.price / 100 : ""}
            required
          />
        </label>
        <label>
          Category
          <select name="category" defaultValue={product?.category} required>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="form-grid">
        <label>
          Stock quantity
          <Input
            name="stock"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={product?.stock ?? 0}
          />
        </label>
        <label>
          Low stock threshold
          <Input
            name="low_stock_threshold"
            type="number"
            min="0"
            step="1"
            required
            defaultValue={product?.low_stock_threshold ?? 5}
          />
        </label>
      </div>
      <label>
        Description
        <textarea
          name="description"
          defaultValue={product?.description}
          required
          minLength={10}
          maxLength={5000}
          rows={5}
        />
      </label>
      <label>
        Product gallery · add up to 8 images · JPEG, PNG or WebP · up to 3 MB
        <Input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          disabled={busy || images.length >= 8}
          onChange={(e) => upload(e.target.files?.[0])}
        />
      </label>
      <div className="gallery-editor">
        {images.map((url, index) => (
          <div key={url}>
            <img
              className="upload-preview"
              src={url}
              alt={`Product image ${index + 1}`}
            />
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => {
                setImages(images.filter((_, i) => i !== index));
                if (images.length === 1) setImage("");
              }}
            >
              Remove {index === 0 ? "cover" : "image"}
            </Button>
          </div>
        ))}
      </div>
      <div className="checkbox-row">
        <label>
          <input
            type="checkbox"
            name="active"
            defaultChecked={product?.active ?? true}
          />{" "}
          Published
        </label>
        <label>
          <input
            type="checkbox"
            name="featured"
            defaultChecked={product?.featured ?? false}
          />{" "}
          Featured
        </label>
      </div>
      {error && (
        <p role="alert" className="error-message">
          {error}
        </p>
      )}
      <Button disabled={busy || !image}>
        {busy ? "Saving…" : "Save product"}
      </Button>
      {product && (
        <Button
          type="button"
          variant="destructive"
          disabled={busy}
          onClick={async () => {
            if (
              !window.confirm(
                "Delete this product? Existing order records will be preserved.",
              )
            )
              return;
            setBusy(true);
            try {
              await api("/api/admin/products", { id: product.id }, "DELETE");
              router.push("/admin/products");
              router.refresh();
            } catch (err) {
              setError(err instanceof Error ? err.message : "Delete failed");
              setBusy(false);
            }
          }}
        >
          Delete product
        </Button>
      )}
    </form>
  );
}
