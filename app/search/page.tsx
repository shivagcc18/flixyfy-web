import { Suspense } from "react";
import SearchPageClient from "@/components/SearchPageClient";

export const metadata = {
  title: "Search intelligence",
};

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="loading-panel">Loading search...</div>}>
      <SearchPageClient />
    </Suspense>
  );
}
