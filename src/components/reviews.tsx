"use client";
import { useEffect, useState, useCallback } from "react";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/client-api";
import { Button } from "@/components/ui/button";
import { date } from "@/lib/utils";
type Review = { id: string; rating: number; body: string; created_at: string };
export function Reviews({ productId }: { productId: string }) {
  const [rows, setRows] = useState<Review[]>([]),
    [count, setCount] = useState(0),
    [page, setPage] = useState(1),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    if (process.env.NEXT_PUBLIC_DEMO_MODE === "true") return;
    try {
      const r = await api<{ reviews: Review[]; count: number }>(
        `/api/reviews?product=${productId}&page=${page}`,
        undefined,
        "GET",
      );
      setRows(r.reviews);
      setCount(r.count);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load reviews");
    }
  }, [productId, page]);
  useEffect(() => {
    void load();
  }, [load]);
  return (
    <section className="reviews-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">FROM REAL CUSTOMERS</p>
          <h2>A few honest words.</h2>
        </div>
        <span className="muted">{count} reviews</span>
      </div>
      <div className="report-grid">
        <div>
          {rows.map((r) => (
            <article key={r.id} className="review-card">
              <div
                aria-label={`${r.rating} out of 5 stars`}
                className="review-stars"
              >
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    size={15}
                    fill={n <= r.rating ? "currentColor" : "none"}
                  />
                ))}
              </div>
              <p>{r.body}</p>
              <small>Verified buyer · {date(r.created_at)}</small>
            </article>
          ))}
          {!rows.length && !error && (
            <p className="muted">
              No reviews yet. Your experience could help someone find their
              favourite.
            </p>
          )}
          {error && <p role="alert">{error}</p>}
          <div className="pagination">
            {page > 1 && (
              <Button variant="ghost" onClick={() => setPage(page - 1)}>
                ← Previous
              </Button>
            )}
            {page * 10 < count && (
              <Button variant="ghost" onClick={() => setPage(page + 1)}>
                Next →
              </Button>
            )}
          </div>
        </div>
        <form
          className="form-card"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            const form = e.currentTarget,
              f = new FormData(form);
            try {
              await api("/api/reviews", {
                product_id: productId,
                rating: Number(f.get("rating")),
                body: f.get("body"),
              });
              toast.success("Thank you for your review");
              form.reset();
              await load();
            } catch (err) {
              toast.error(
                err instanceof Error
                  ? err.message
                  : "Review could not be saved",
              );
            } finally {
              setBusy(false);
            }
          }}
        >
          <h3>How did it feel at home?</h3>
          <p className="muted">
            Sign in with the account you used to purchase this product.
          </p>
          <label>
            Rating
            <select name="rating" defaultValue="5">
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} stars
                </option>
              ))}
            </select>
          </label>
          <label>
            Your review
            <textarea
              name="body"
              required
              minLength={10}
              maxLength={2000}
              rows={4}
            />
          </label>
          <Button
            disabled={busy || process.env.NEXT_PUBLIC_DEMO_MODE === "true"}
          >
            {busy ? "Posting…" : "Share review"}
          </Button>
        </form>
      </div>
    </section>
  );
}
