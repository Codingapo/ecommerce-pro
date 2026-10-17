import { Unsubscribe } from "@/components/unsubscribe";
export const metadata = {
  title: "Email preferences",
  robots: { index: false, follow: false },
};
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <section className="section">
      <Unsubscribe token={(await searchParams).token || ""} />
    </section>
  );
}
