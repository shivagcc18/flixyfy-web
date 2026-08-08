export type HomepageCandidate = {
  canonical_movie_id: string;
  title: string;
  release_year?: number | null;
  approved_provider_count: number;
  rating_signal: number;
};

export function compareHomepageCandidates(left: HomepageCandidate, right: HomepageCandidate) {
  const leftWatchable = left.approved_provider_count > 0 ? 1 : 0;
  const rightWatchable = right.approved_provider_count > 0 ? 1 : 0;
  if (leftWatchable !== rightWatchable) return rightWatchable - leftWatchable;
  if ((left.release_year ?? 0) !== (right.release_year ?? 0)) return (right.release_year ?? 0) - (left.release_year ?? 0);
  if (left.rating_signal !== right.rating_signal) return right.rating_signal - left.rating_signal;
  return left.title.localeCompare(right.title) || left.canonical_movie_id.localeCompare(right.canonical_movie_id);
}

export function curateHomepageCandidates<T extends HomepageCandidate>(items: T[], domain: "current" | "historical") {
  return items
    .filter((movie) => domain !== "current" || movie.release_year !== 2026 || movie.approved_provider_count >= 1)
    .sort(compareHomepageCandidates)
    .slice(0, 12);
}

export function curateHomepageWithYearBackfill<T extends HomepageCandidate>(currentItems: T[], backfillItems: T[], backfillYear: number) {
  const currentWatchable = curateHomepageCandidates(currentItems, "current")
    .filter((movie) => movie.approved_provider_count >= 1);
  const selectedCurrent = currentWatchable.slice(0, 12);
  const seen = new Set(selectedCurrent.map((movie) => movie.canonical_movie_id));
  const backfillWatchable = curateHomepageCandidates(backfillItems, "current")
    .filter((movie) => movie.release_year === backfillYear && movie.approved_provider_count >= 1 && !seen.has(movie.canonical_movie_id));
  const selectedBackfill = backfillWatchable.slice(0, Math.max(0, 12 - selectedCurrent.length));
  return {
    items: [...selectedCurrent, ...selectedBackfill],
    currentCount: selectedCurrent.length,
    backfillCount: selectedBackfill.length,
  };
}
