import { Suspense } from "react";
import { redirect } from "next/navigation";
import SearchPageClient from "@/components/SearchPageClient";
import { SEARCH_METADATA } from "@/lib/movie-seo";

export const metadata = SEARCH_METADATA;

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ mode?: string }>;
}) {
  const { mode } = await searchParams;
  if (mode === "people") redirect("/people");

  return (
    <Suspense fallback={<div className="loading-panel">Loading search...</div>}>
      <SearchPageClient />
    </Suspense>
  );
}
