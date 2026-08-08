import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./homepage-minimal-polish.css";

export const metadata: Metadata = {
  title: "FLIXYFY | Indian movie search and availability",
  description: "Search Indian movies by title, people, language, year and verified availability.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
