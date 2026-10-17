import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { demoMode } from "@/lib/env";
import { CheckoutForm } from "@/components/checkout-form";
export const dynamic = "force-dynamic";
export default async function CheckoutPage() {
  let saved: Record<string, string> = {};
  if (!demoMode()) {
    let auth;
    try {
      auth = await requireUser();
    } catch {
      redirect("/login?next=/checkout");
    }
    const { data } = await auth.client
      .from("profiles")
      .select("address")
      .eq("id", auth.user.id)
      .single();
    if (data?.address) saved = data.address as Record<string, string>;
  }
  return (
    <section className="section">
      <p className="eyebrow">ALMOST YOURS</p>
      <h1>Checkout.</h1>
      <CheckoutForm savedAddress={saved} />
    </section>
  );
}
