import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Muxics — Find your music collaborators",
  description: "Discover musicians, collaborations, and hiring opportunities across India.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
