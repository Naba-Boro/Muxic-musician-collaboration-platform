import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Muxics — Life sounds better together",
  description:
    "A little corner of the internet for big feelings, good songs, and the people who get it.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
