import "server-only";
import { db } from "@/lib/supabase/server";
import { demoMode } from "@/lib/env";
import { demoProducts, demoCategories } from "@/lib/demo";
import { checked } from "@/lib/http";
export async function catalog(q = "", category = "", page = 1) {
  const size = 12;
  if (demoMode()) {
    const all = demoProducts.filter(
      (p) =>
        (!category || p.category === category) &&
        `${p.name} ${p.description} ${p.category}`
          .toLowerCase()
          .includes(q.toLowerCase()),
    );
    return {
      products: all.slice((page - 1) * size, page * size),
      count: all.length,
    };
  }
  const result = await (await db())
    .rpc(
      "search_products",
      { p_query: q.slice(0, 100), p_category: category },
      { count: "exact" },
    )
    .range((page - 1) * size, page * size - 1);
  if (result.error) throw new Error("Could not load products");
  return { products: result.data, count: result.count || 0 };
}
export async function productBySlug(slug: string) {
  if (demoMode()) return demoProducts.find((p) => p.slug === slug);
  return checked(
    await (await db())
      .from("products")
      .select("*")
      .eq("slug", slug)
      .eq("active", true)
      .maybeSingle(),
  );
}
export async function categories() {
  if (demoMode()) return demoCategories;
  return checked(
    await (await db()).from("categories").select("*").order("name"),
  );
}
