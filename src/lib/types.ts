export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  price: number;
  image_url: string;
  active: boolean;
  featured: boolean;
  created_at: string;
  images: string[];
  stock: number;
  low_stock_threshold: number;
};
export type Category = { slug: string; name: string };
export type Account = { user_id: string; role: "customer" | "admin" };
export type Profile = {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  address: Json;
  recovery_opt_in: boolean;
  created_at: string;
};
export type OrderStatus =
  | "pending"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "on_hold";
export type Order = {
  id: string;
  user_id: string;
  reference: string;
  status: OrderStatus;
  payment_status: "pending" | "paid";
  total: number;
  currency: string;
  email: string;
  shipping_address: Json;
  created_at: string;
  paid_at: string | null;
  idempotency_key: string;
  request_hash: string;
  authorization_url: string | null;
  paystack_id: string | null;
  order_number: number;
  stock_deducted: boolean;
  subtotal: number;
  discount: number;
  coupon_code: string | null;
  analytics_session: string | null;
  traffic_source: string;
};
export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string | null;
  name: string;
  quantity: number;
  unit_price: number;
};
export type OrderDetail = Order & { order_items: OrderItem[] };
export type Outbox = {
  id: string;
  order_id: string;
  kind: string;
  sent_at: string | null;
  attempts: number;
  lease_until: string | null;
  created_at: string;
};
export type Coupon = {
  id: string;
  code: string;
  percent: number;
  min_subtotal: number;
  expires_at: string;
  active: boolean;
  created_at: string;
};
export type Review = {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;
  body: string;
  created_at: string;
};
export type Event = {
  id: string;
  session_id: string;
  user_id: string | null;
  kind: string;
  product_id: string | null;
  order_id: string | null;
  source: string;
  path: string;
  created_at: string;
};
export type SavedCart = {
  user_id: string;
  items: Json;
  updated_at: string;
  last_reminded_at: string | null;
  recovery_lease: string | null;
};
export type InventoryEntry = {
  id: string;
  product_id: string | null;
  product_name: string;
  delta: number;
  stock_after: number;
  reason: string;
  actor_id: string | null;
  created_at: string;
};
export type ActivityEntry = {
  id: string;
  actor_id: string | null;
  action: string;
  entity: string;
  entity_id: string;
  created_at: string;
};
type Table<T> = {
  Row: T;
  Insert: Partial<T>;
  Update: Partial<T>;
  Relationships: [];
};
export type Database = {
  public: {
    Tables: {
      wishlists: Table<{
        user_id: string;
        product_id: string;
        created_at: string;
      }>;
      reviews: Table<Review>;
      coupons: Table<Coupon>;
      events: Table<Event>;
      carts: Table<SavedCart>;
      inventory_history: Table<InventoryEntry>;
      activity_logs: Table<ActivityEntry>;
      products: Table<Product>;
      categories: Table<Category>;
      accounts: Table<Account>;
      profiles: Table<Profile>;
      orders: Table<Order>;
      order_items: Table<OrderItem>;
      email_outbox: Table<Outbox>;
    };
    Views: Record<string, never>;
    Functions: {
      save_product: {
        Args: {
          p_id: string | null;
          p_data: Json;
          p_expected_stock: number | null;
          p_actor: string;
        };
        Returns: Product;
      };
      delete_product: {
        Args: { p_id: string; p_actor: string };
        Returns: undefined;
      };
      admin_order_status: {
        Args: { p_order: string; p_status: string; p_actor: string };
        Returns: Order;
      };
      save_coupon: {
        Args: { p_id: string | null; p_data: Json; p_actor: string };
        Returns: Coupon;
      };
      save_cart: {
        Args: { p_user: string; p_items: Json };
        Returns: undefined;
      };
      claim_recovery_carts: {
        Args: Record<string, never>;
        Returns: SavedCart[];
      };
      search_products: {
        Args: { p_query: string; p_category: string };
        Returns: Product[];
      };
      create_checkout: {
        Args: {
          p_user: string;
          p_email: string;
          p_lines: Json;
          p_address: Json;
          p_key: string;
          p_hash: string;
          p_currency: string;
          p_coupon: string;
          p_session: string | null;
          p_source: string;
        };
        Returns: Order;
      };
      complete_payment: {
        Args: {
          p_reference: string;
          p_amount: number;
          p_currency: string;
          p_transaction: string;
        };
        Returns: Order;
      };
      change_order_status: {
        Args: { p_order: string; p_status: string };
        Returns: Order;
      };
      consume_limit: {
        Args: { p_key: string; p_max: number; p_seconds: number };
        Returns: boolean;
      };
      claim_emails: { Args: { p_limit: number }; Returns: Outbox[] };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
