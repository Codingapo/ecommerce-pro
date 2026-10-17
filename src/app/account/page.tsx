import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { SignOut } from "@/components/sign-out";
import { ProfileForm } from "@/components/profile-form";
import { checked } from "@/lib/http";
import { Button } from "@/components/ui/button";
export default async function AccountPage() {
  const { user, client } = await requireUser();
  const { data: account } = await client
    .from("accounts")
    .select("role")
    .eq("user_id", user.id)
    .single();
  const profile = checked(
    await client.from("profiles").select("*").eq("id", user.id).single(),
  );
  return (
    <section className="section">
      <p className="eyebrow">YOUR MULABA</p>
      <h1>Welcome home.</h1>
      <p className="muted">{user.email}</p>
      <div className="account-actions">
        <Button asChild>
          <Link href="/account/orders">Your orders →</Link>
        </Button>
        {account?.role === "admin" && (
          <Button asChild variant="outline">
            <Link href="/admin">Open administration</Link>
          </Button>
        )}
        <Button asChild variant="outline">
          <Link href="/account/wishlist">Your wishlist</Link>
        </Button>
        <SignOut />
      </div>
      <div className="profile-section">
        {profile && <ProfileForm profile={profile} />}
      </div>
    </section>
  );
}
