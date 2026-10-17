import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/types";
import { secret } from "@/lib/env";
// Construct per request. This client bypasses RLS; callers must authenticate first.
export function adminDb() {
  return createClient<Database>(
    secret("NEXT_PUBLIC_SUPABASE_URL"),
    secret("SUPABASE_SECRET_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    },
  );
}
