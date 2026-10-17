"use client";
import { Button } from "@/components/ui/button";
export default function ErrorPage({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <section className="section empty-state">
      <h1>A little interruption.</h1>
      <p>We couldn't load this page. Please try again.</p>
      <Button onClick={reset}>Try again</Button>
    </section>
  );
}
