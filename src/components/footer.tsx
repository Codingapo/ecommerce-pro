import Link from "next/link";
export function Footer() {
  return (
    <footer className="footer">
      <div>
        <Link href="/" className="wordmark">
          {process.env.NEXT_PUBLIC_STORE_NAME || "mulaba"}
          <span>®</span>
        </Link>
        <p>
          A little more considered.
          <br />A little more you.
        </p>
      </div>
      <div>
        <p className="eyebrow">Explore</p>
        <Link href="/shop">The collection</Link>
        <Link href="/account/orders">Your orders</Link>
        <Link href="/account">Your account</Link>
      </div>
      <div className="footer-note">
        <span>Objects for the everyday.</span>
        <p>© {new Date().getFullYear()} Mulaba</p>
        <Link href="/admin">Store administration ↗</Link>
      </div>
    </footer>
  );
}
