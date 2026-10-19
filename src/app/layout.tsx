import type { Metadata } from "next";
import rootMetadata from "../lib/seo-root-metadata.json";
import "./globals.css";

export const metadata: Metadata = rootMetadata;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en" data-scroll-behavior="smooth"><body>{children}</body></html>;
}
