import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner needs the explicit extension; Next's typecheck does not enable it.
import { curateHomepageCandidates, curateHomepageWithYearBackfill } from "./homepage-curation.ts";

const candidate = (title: string, release_year: number, approved_provider_count: number, rating_signal: number) => ({
  canonical_movie_id: `TMDB:${title}`,
  title,
  release_year,
  approved_provider_count,
  rating_signal,
});

test("current homepage excludes providerless and YouTube-only 2026 titles", () => {
  const result = curateHomepageCandidates([
    candidate("YouTube only", 2026, 0, 9.9),
    candidate("Confirmed OTT", 2026, 1, 7.1),
    candidate("Older watchable", 2025, 1, 8.4),
  ], "current");

  assert.deepEqual(result.map((movie) => movie.title), ["Confirmed OTT", "Older watchable"]);
  assert.equal(result.some((movie) => movie.release_year === 2026 && movie.approved_provider_count < 1), false);
});

test("watchability ranks ahead of rating, then recency and deterministic tie breaks", () => {
  const result = curateHomepageCandidates([
    candidate("Unwatchable high rating", 2026, 0, 10),
    candidate("Watchable recent", 2025, 1, 6),
    candidate("Watchable older", 2024, 1, 9),
    candidate("Alpha", 2024, 1, 7),
    candidate("Beta", 2024, 1, 7),
  ], "historical");

  assert.deepEqual(result.map((movie) => movie.title), ["Watchable recent", "Watchable older", "Alpha", "Beta", "Unwatchable high rating"]);
});

test("Kannada-style backfill uses only watchable 2025 titles after current watchable titles", () => {
  const result = curateHomepageWithYearBackfill([
    candidate("Current watchable", 2026, 1, 7),
    candidate("Current providerless", 2026, 0, 10),
  ], [
    candidate("Backfill watchable", 2025, 1, 7),
    candidate("Backfill providerless", 2025, 0, 10),
    candidate("Wrong year", 2024, 1, 10),
  ], 2025);

  assert.deepEqual(result.items.map((movie) => movie.title), ["Current watchable", "Backfill watchable"]);
  assert.equal(result.currentCount, 1);
  assert.equal(result.backfillCount, 1);
});
