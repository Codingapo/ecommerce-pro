import { AuthForm } from "@/components/auth-form";
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  return (
    <section className="section">
      <AuthForm next={(await searchParams).next} />
    </section>
  );
}
