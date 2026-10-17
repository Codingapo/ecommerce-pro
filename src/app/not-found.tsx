import Link from "next/link";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <section className="section empty-state">
      <p className="eyebrow">404</p>
      <h1>This piece is missing.</h1>
      <p>Let's find you something else to love.</p>
      <Button asChild>
        <Link href="/shop">Back to the collection</Link>
      </Button>
    </section>
  );
}
