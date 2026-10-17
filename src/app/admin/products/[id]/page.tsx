import { notFound } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { checked } from "@/lib/http";
import { ProductEditor } from "@/components/product-editor";
export default async function EditProduct({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { client } = await requireAdmin();
  if (id !== "new" && !z.uuid().safeParse(id).success) notFound();
  const cats = checked(
    await client.from("categories").select("*").order("name"),
  );
  const product =
    id === "new"
      ? undefined
      : checked(
          await client.from("products").select("*").eq("id", id).maybeSingle(),
        );
  if (id !== "new" && !product) notFound();
  return (
    <>
      <p className="eyebrow">YOUR COLLECTION</p>
      <h1>{product ? "Edit product." : "A new good thing."}</h1>
      <ProductEditor product={product || undefined} categories={cats} />
    </>
  );
}
