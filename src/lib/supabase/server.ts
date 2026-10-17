import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/lib/types";
import { secret } from "@/lib/env";
export async function db() {
  const jar = await cookies();
  return createServerClient<Database>(
    secret("NEXT_PUBLIC_SUPABASE_URL"),
    secret("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
    {
      cookies: {
        getAll: () => jar.getAll(),
        setAll: (values) => {
          try {
            values.forEach(({ name, value, options }) =>
              jar.set(name, value, options),
            );
          } catch {
            /* Middleware refreshes cookies for read-only Server Components. */
          }
        },
      },
    },
  );
}
