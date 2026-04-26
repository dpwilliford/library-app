import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Library Collection Intelligence",
  description: "Private library collection intelligence dashboard"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

