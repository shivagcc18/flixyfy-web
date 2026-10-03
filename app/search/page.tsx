import { Suspense } from "react";
import SearchPageClient from "@/components/SearchPageClient";
import { SEARCH_METADATA } from "@/lib/movie-seo";

export const metadata = SEARCH_METADATA;

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="loading-panel">Loading search...</div>}>
      <SearchPageClient />
    </Suspense>
  );
}
