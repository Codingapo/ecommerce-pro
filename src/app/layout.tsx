import type { Metadata } from "next";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Providers } from "@/components/providers";
export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
  ),
  robots:
    process.env.NEXT_PUBLIC_DEMO_MODE === "true"
      ? { index: false, follow: false }
      : { index: true, follow: true },
  openGraph: {
    type: "website",
    siteName: "Mulaba",
    title: "Mulaba — considered goods for everyday living",
    description:
      "Find your everyday favourites. Furniture, lighting and considered essentials.",
  },
  title: {
    default: "Mulaba — considered goods for everyday living",
    template: "%s | Mulaba",
  },
  description:
    "Explore considered furniture, lighting and everyday essentials.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <a href="#main" className="skip-link">
            Skip to content
          </a>
          <Header />
          {process.env.NEXT_PUBLIC_DEMO_MODE === "true" && (
            <div className="demo-banner">
              Demo catalog · sample products · payments disabled
            </div>
          )}
          <main id="main">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
