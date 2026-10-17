import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
export const money = (cents: number, currency = "ZAR") =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency }).format(
    cents / 100,
  );
export const date = (value: string) =>
  new Date(value).toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
