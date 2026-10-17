import type { MetadataRoute } from "next";
import { db } from "@/lib/supabase/server";
import { demoMode, siteUrl } from "@/lib/env";
import { checked } from "@/lib/http";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (demoMode()) return [];
  const site = siteUrl(),
    client = await db();
  const entries: MetadataRoute.Sitemap = [
    { url: site, changeFrequency: "weekly", priority: 1 },
    { url: `${site}/shop`, changeFrequency: "daily", priority: 0.9 },
  ];
  const categories = checked(await client.from("categories").select("slug"));
  entries.push(
    ...categories.map((c) => ({
      url: `${site}/category/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  );
  for (let offset = 0; ; offset += 1000) {
    const products = checked(
      await client
        .from("products")
        .select("slug,created_at")
        .eq("active", true)
        .order("id")
        .range(offset, offset + 999),
    );
    entries.push(
      ...products.map((p) => ({
        url: `${site}/shop/${p.slug}`,
        lastModified: p.created_at,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    );
    if (products.length < 1000) break;
  }
  return entries;
}
