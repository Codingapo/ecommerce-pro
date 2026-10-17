import { PaymentReturn } from "@/components/payment-return";
export default async function ReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ reference?: string }>;
}) {
  return (
    <section className="section">
      <PaymentReturn reference={(await searchParams).reference || ""} />
    </section>
  );
}
