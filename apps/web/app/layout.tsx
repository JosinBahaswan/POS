import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "POS SaaS Dashboard",
  description: "Dashboard owner and subscription portal"
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
