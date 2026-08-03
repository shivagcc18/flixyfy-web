import { Suspense } from "react";
import SearchPageClient from "@/components/SearchPageClient";

function SearchFallback() {
  return <main className="page-content"><div className="loading-panel">Loading search...</div></main>;
}

export default function SearchPage() {
  return <Suspense fallback={<SearchFallback />}><SearchPageClient /></Suspense>;
}
