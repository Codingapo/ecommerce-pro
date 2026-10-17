import type { MetadataRoute } from "next";
export default function robots(): MetadataRoute.Robots {
  const site = (
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ).replace(/\/$/, "");
  return {
    rules:
      process.env.NEXT_PUBLIC_DEMO_MODE === "true"
        ? { userAgent: "*", disallow: "/" }
        : {
            userAgent: "*",
            allow: "/",
            disallow: [
              "/admin",
              "/account",
              "/api",
              "/checkout",
              "/cart",
              "/login",
              "/unsubscribe",
            ],
          },
    sitemap: `${site}/sitemap.xml`,
  };
}
