import * as React from "react";
import { cn } from "@/lib/utils";
export function Input({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      data-slot="input"
      className={cn(
        "h-12 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none focus:ring-2 focus:ring-primary disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}
