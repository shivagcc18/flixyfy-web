import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FLIXYFY V3",
  description: "Explore Indian movies, people, and accepted watch availability.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
