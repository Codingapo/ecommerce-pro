import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    await requireUser();
  } catch {
    redirect("/login?next=/account");
  }
  return children;
}
