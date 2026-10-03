import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FlixyfyBrandLegalEnhancer from "../src/components/FlixyfyBrandLegalEnhancer"; // FLIXYFY_SEARCH_PROVIDER_BRAND_PROD_FIX_V1_0_1_LINT_LAYOUT_REPAIR
import AnalyticsRuntime from "@/components/AnalyticsRuntime";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.flixyfy.com"),
  applicationName: "FLIXYFY",
  title: {
    default: "Find Where to Watch Indian Movies | FLIXYFY",
    template: "%s | FLIXYFY",
  },
  description:
    "Search Indian movies and discover where to watch them in India across OTT services and approved YouTube sources tracked by FLIXYFY.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: "FLIXYFY",
    title: "Find Where to Watch Indian Movies | FLIXYFY",
    description:
      "Search Indian movies and discover where to watch them in India across OTT services and approved YouTube sources tracked by FLIXYFY.",
    url: "https://www.flixyfy.com/",
  },
  twitter: {
    card: "summary_large_image",
    title: "Find Where to Watch Indian Movies | FLIXYFY",
    description:
      "Search Indian movies and discover where to watch them in India across OTT services and approved YouTube sources tracked by FLIXYFY.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}<AnalyticsRuntime /><FlixyfyBrandLegalEnhancer />{/* FLIXYFY_SEARCH_PROVIDER_BRAND_PROD_FIX_V1_0_1_LINT_LAYOUT_REPAIR */}
</body>
    </html>
  );
}
