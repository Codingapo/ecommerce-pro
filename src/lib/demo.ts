import type { Product, Category } from "@/lib/types";
export const demoProducts: Product[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    name: "The Sunday Chair",
    slug: "sunday-chair",
    category: "furniture",
    price: 249900,
    image_url:
      "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=85",
    description:
      "A quiet corner starts here. A sculptural oak frame and a generous woven seat make this your new favourite place to pause.",
    images: [
      "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&h=1400&crop=center&q=85",
    ],
    stock: 15,
    low_stock_threshold: 5,
    active: true,
    featured: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Orbit Table Light",
    slug: "orbit-table-light",
    category: "lighting",
    price: 89900,
    image_url:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=85",
    description:
      "Warm light, soft edges. A thoughtful companion for the bedside table, reading nook or late-night ideas.",
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&h=1400&crop=center&q=85",
    ],
    stock: 15,
    low_stock_threshold: 5,
    active: true,
    featured: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "33333333-3333-4333-8333-333333333333",
    name: "Everyday Ceramic",
    slug: "everyday-ceramic",
    category: "living",
    price: 34900,
    image_url:
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=85",
    description:
      "Simple forms for the rituals that matter. A textured ceramic piece that brings a little warmth to every table.",
    images: [
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=1200&h=1400&crop=center&q=85",
    ],
    stock: 15,
    low_stock_threshold: 5,
    active: true,
    featured: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "44444444-4444-4444-8444-444444444444",
    name: "Linen Weekend Tote",
    slug: "linen-weekend-tote",
    category: "essentials",
    price: 59900,
    image_url:
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85",
    description:
      "Room for the everyday and the unexpected. An easy-carry companion with a considered silhouette and durable construction.",
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1200&h=1400&crop=center&q=85",
    ],
    stock: 15,
    low_stock_threshold: 5,
    active: true,
    featured: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "55555555-5555-4555-8555-555555555555",
    name: "Studio Side Table",
    slug: "studio-side-table",
    category: "furniture",
    price: 129900,
    image_url:
      "https://images.unsplash.com/photo-1499933374294-4584851497cc?auto=format&fit=crop&w=1200&q=85",
    description:
      "A useful little surface with plenty of personality. Bring it beside a sofa, under a window or wherever life happens.",
    images: [
      "https://images.unsplash.com/photo-1499933374294-4584851497cc?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1499933374294-4584851497cc?auto=format&fit=crop&w=1200&h=1400&crop=center&q=85",
    ],
    stock: 15,
    low_stock_threshold: 5,
    active: true,
    featured: true,
    created_at: "2026-01-01T00:00:00Z",
  },
  {
    id: "66666666-6666-4666-8666-666666666666",
    name: "Greenhouse Planter",
    slug: "greenhouse-planter",
    category: "living",
    price: 45900,
    image_url:
      "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1200&q=85",
    description:
      "Make room for something green. A grounded, understated planter that lets your favourite foliage do the talking.",
    images: [
      "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1200&q=85",
      "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=1200&h=1400&crop=center&q=85",
    ],
    stock: 15,
    low_stock_threshold: 5,
    active: true,
    featured: true,
    created_at: "2026-01-01T00:00:00Z",
  },
];
export const demoCategories: Category[] = [
  { slug: "furniture", name: "Furniture" },
  { slug: "lighting", name: "Lighting" },
  { slug: "living", name: "Living" },
  { slug: "essentials", name: "Essentials" },
];
