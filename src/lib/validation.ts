import { z } from "zod";
export const addressSchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    phone: z.string().trim().min(7).max(30),
    line1: z.string().trim().min(4).max(180),
    city: z.string().trim().min(2).max(80),
    province: z.string().trim().min(2).max(80),
    postal_code: z.string().trim().min(3).max(15),
    country: z.literal("ZA"),
  })
  .strict();
export const checkoutSchema = z
  .object({
    items: z
      .array(
        z
          .object({
            product_id: z.uuid(),
            quantity: z.number().int().min(1).max(20),
          })
          .strict(),
      )
      .min(1)
      .max(50),
    address: addressSchema,
    idempotency_key: z.uuid(),
    coupon: z
      .string()
      .trim()
      .max(32)
      .transform((v) => v.toUpperCase())
      .default(""),
    analytics_session: z.uuid().nullable().default(null),
    traffic_source: z.string().max(100).default("direct"),
  })
  .strict();
export const productSchema = z
  .object({
    name: z.string().trim().min(2).max(140),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(160),
    description: z.string().trim().min(10).max(5000),
    category: z.string().min(1).max(80),
    price: z.number().int().min(100).max(100000000),
    image_url: z.url().max(1000),
    active: z.boolean(),
    featured: z.boolean(),
    images: z.array(z.url().max(1000)).max(8),
    stock: z.number().int().min(0).max(1000000),
    low_stock_threshold: z.number().int().min(0).max(10000),
  })
  .strict();
export const referenceSchema = z.string().regex(/^mulaba_[a-f0-9-]{36}$/);
export const statusSchema = z.enum([
  "processing",
  "shipped",
  "delivered",
  "cancelled",
]);
