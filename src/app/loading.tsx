export default function Loading() {
  return (
    <section className="section" aria-busy="true" aria-label="Loading page">
      <div className="skeleton h-12 w-64 mb-8" />
      <div className="product-grid">
        {[1, 2, 3, 4].map((n) => (
          <div key={n} className="skeleton aspect-[4/5]" />
        ))}
      </div>
    </section>
  );
}
