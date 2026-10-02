import { Suspense } from "react";
import SearchPageClient from "@/components/SearchPageClient";

export const metadata = {
  title: "Search Indian Movies",
  description: "Search FLIXYFY's movie catalog by title, people, language, year and provider.",
  robots: { index: false, follow: true },
  alternates: { canonical: null },
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="loading-panel">Loading search...</div>}>
      <SearchPageClient />
    </Suspense>
  );
}
