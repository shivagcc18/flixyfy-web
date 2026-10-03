import test from "node:test";
import assert from "node:assert/strict";
import {
  GA_MEASUREMENT_ID,
  claimEvent,
  hashEventKey,
  initAnalytics,
  sanitizeSearchTerm,
  trackFilterApplied,
  trackFilterChange,
  trackLoadMore,
  trackMovieOpened,
  trackNoResultSearch,
  trackPageView,
  trackPersonResultOpened,
  trackProviderClicked,
  trackSearch,
  trackSearchResultsOnce,
  trackYoutubeClicked,
} from "./analytics.ts";

function withBrowser(run, shouldThrow = false) {
  const calls = [];
  const appended = [];
  const browser = {
    dataLayer: [],
    gtag: (...args) => {
      calls.push(args);
      if (shouldThrow) throw new Error("analytics unavailable");
    },
    __flixyfyGaInitialized: false,
    __flixyfyAnalyticsEvents: undefined,
  };
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  const oldDocument = Object.getOwnPropertyDescriptor(globalThis, "document");
  Object.defineProperty(globalThis, "window", { configurable: true, value: browser });
  Object.defineProperty(globalThis, "document", {
    configurable: true,
    value: {
      querySelector: () => null,
      createElement: () => ({ dataset: {}, setAttribute() {} }),
      head: { appendChild: (element) => appended.push(element) },
    },
  });
  try {
    run();
  } finally {
    if (oldWindow) Object.defineProperty(globalThis, "window", oldWindow);
    else Reflect.deleteProperty(globalThis, "window");
    if (oldDocument) Object.defineProperty(globalThis, "document", oldDocument);
    else Reflect.deleteProperty(globalThis, "document");
  }
  return { calls, appended };
}

test("event contract uses stable GA4 names and required parameters", () => {
  const { calls } = withBrowser(() => {
    trackSearch("RRR", { resultCount: 12, searchSource: "search_page", languageFilter: "te" });
    trackMovieOpened({ canonicalMovieId: "TMDB:123", tmdbId: 123, movieLanguage: "te", releaseYear: 2022, sourceContext: "search" });
    trackProviderClicked({ canonicalMovieId: "TMDB:123", tmdbId: 123 }, "Prime Video", "SUBSCRIPTION_OTT", "DIRECT");
    trackYoutubeClicked({ canonicalMovieId: "TMDB:123", tmdbId: 123, movieLanguage: "te" }, 2);
    trackLoadMore("search", 48, 96, { language_filter: "te", year_filter: "2026" });
    trackFilterApplied("provider", "prime_video");
    trackNoResultSearch("nothing", { searchSource: "search_page" });
    trackPersonResultOpened("person:42");
    trackPageView("/search");
  });
  const names = calls.map((call) => call[1]);
  assert.deepEqual(names, ["search", "movie_opened", "provider_clicked", "youtube_clicked", "load_more_clicked", "filter_applied", "no_result_search", "person_result_opened", "page_view"]);
  assert.deepEqual(names.reduce((counts, name) => counts.set(name, (counts.get(name) ?? 0) + 1), new Map()), new Map(names.map((name) => [name, 1])));
  assert.deepEqual(Object.keys(calls[0][2]).slice(0, 2), ["search_term", "result_count"]);
  assert.deepEqual(Object.keys(calls[1][2]).filter((key) => ["canonical_movie_id", "tmdb_id", "source_context"].includes(key)), ["canonical_movie_id", "tmdb_id", "source_context"]);
  assert.deepEqual(Object.keys(calls[2][2]).filter((key) => ["canonical_movie_id", "provider_name", "provider_type", "source_context"].includes(key)), ["canonical_movie_id", "provider_name", "provider_type", "source_context"]);
  assert.deepEqual(Object.keys(calls[3][2]).filter((key) => ["canonical_movie_id", "video_rank", "source_context"].includes(key)), ["canonical_movie_id", "video_rank", "source_context"]);
  assert.deepEqual(Object.keys(calls[4][2]).filter((key) => ["surface", "loaded_before", "loaded_after"].includes(key)), ["surface", "loaded_before", "loaded_after"]);
  assert.deepEqual(Object.keys(calls[5][2]), ["filter_type", "filter_value", "surface"]);
  assert.deepEqual(Object.keys(calls[7][2]), ["person_id", "source_context"]);
  assert.equal(calls[0][2].search_term, "RRR");
  assert.equal(calls[0][2].result_count, 12);
  assert.equal(calls[1][2].canonical_movie_id, "TMDB:123");
  assert.equal(calls[1][2].tmdb_id, 123);
  assert.equal(calls[1][2].source_context, "search");
  assert.equal(calls[2][2].canonical_movie_id, "TMDB:123");
  assert.equal(calls[2][2].provider_name, "Prime Video");
  assert.equal(calls[2][2].provider_type, "SUBSCRIPTION_OTT");
  assert.equal(calls[2][2].source_context, "movie_detail");
  assert.equal(calls[3][2].canonical_movie_id, "TMDB:123");
  assert.equal(calls[2][2].routing_type, "DIRECT");
  assert.equal(calls[3][2].source_context, "movie_detail");
  assert.equal(calls[4][2].surface, "search");
  assert.equal(calls[4][2].loaded_before, 48);
  assert.equal(calls[4][2].loaded_after, 96);
  assert.equal(calls[5][2].filter_type, "provider");
  assert.equal(calls[5][2].filter_value, "prime_video");
  assert.equal(calls[5][2].surface, "search");
  assert.equal(calls[3][2].video_rank, 2);
  assert.equal(calls[7][2].person_id, "person:42");
  assert.equal(calls[7][2].source_context, "search_disambiguation");
  assert.deepEqual(calls[8][2], { page_path: "/search" });
});

test("one zero-result request emits one search and one no-result event across effect replay", () => {
  const { calls } = withBrowser(() => {
    const seen = new Set();
    const requestKey = "missing\u0001\u0001te\u00012026";
    trackSearchResultsOnce(seen, requestKey, "missing", 0, { searchSource: "search_page", languageFilter: "te", yearFilter: "2026" });
    trackSearchResultsOnce(seen, requestKey, "missing", 0, { searchSource: "search_page", languageFilter: "te", yearFilter: "2026" });
  });
  assert.deepEqual(calls.map((call) => call[1]), ["search", "no_result_search"]);
  assert.equal(calls[0][2].result_count, 0);
  assert.equal(calls[0][2].search_term, "missing");
});

test("successful search replay is deduplicated and a real filter change emits only once", () => {
  const { calls } = withBrowser(() => {
    const seen = new Set();
    const requestKey = "RRR\u0001\u0001te\u00012026";
    trackSearchResultsOnce(seen, requestKey, "RRR", 4, { searchSource: "search_page" });
    trackSearchResultsOnce(seen, requestKey, "RRR", 4, { searchSource: "search_page" });
    assert.equal(trackFilterChange("", "te", "language"), true);
    assert.equal(trackFilterChange("te", "te", "language"), false);
  });
  assert.deepEqual(calls.map((call) => call[1]), ["search", "filter_applied"]);
  assert.equal(calls[0][2].result_count, 4);
});

test("search terms fail closed for email, phone, and values over 100 characters", () => {
  assert.equal(sanitizeSearchTerm("  RRR  "), "RRR");
  assert.equal(sanitizeSearchTerm("user@example.com"), "[redacted]");
  assert.equal(sanitizeSearchTerm("+91 98765 43210"), "[redacted]");
  assert.equal(sanitizeSearchTerm("x".repeat(101)), "[redacted]");
  assert.equal(sanitizeSearchTerm("  "), undefined);
});

test("analytics payload never includes PII-looking or overlong raw search terms", () => {
  const { calls } = withBrowser(() => {
    trackSearch("user@example.com", { resultCount: 1 });
    trackNoResultSearch("+91 98765 43210");
    trackSearch("x".repeat(101), { resultCount: 2 });
  });
  assert.deepEqual(calls.map((call) => call[2].search_term), ["[redacted]", "[redacted]", "[redacted]"]);
  assert.ok(calls.every((call) => call[2].search_term.length <= 100));
});

test("duplicate async search completions claim a hashed key only once", () => {
  const seen = new Set();
  const key = hashEventKey("long query text");
  assert.equal(claimEvent(seen, key), true);
  assert.equal(claimEvent(seen, key), false);
  assert.equal(key.includes("long query text"), false);
});

test("initialization configures one non-personalized tag and provider navigation continues if gtag throws", () => {
  assert.equal(GA_MEASUREMENT_ID, "G-ECV07D8CMX");
  const { calls, appended } = withBrowser(() => {
    initAnalytics();
    initAnalytics();
    window.gtag = () => { throw new Error("analytics unavailable"); };
    const navigation = { provider: 0, youtube: 0, movie: 0 };
    const nativeAnchorClick = (track, destination) => {
      track();
      navigation[destination] += 1; // Browser follows the unchanged href after the click handler returns.
    };
    assert.doesNotThrow(() => nativeAnchorClick(() => trackProviderClicked({ canonicalMovieId: "TMDB:1" }, "Netflix", "flatrate", "SEARCH"), "provider"));
    assert.doesNotThrow(() => nativeAnchorClick(() => trackYoutubeClicked({ canonicalMovieId: "TMDB:1" }, 1), "youtube"));
    assert.doesNotThrow(() => nativeAnchorClick(() => trackMovieOpened({ canonicalMovieId: "TMDB:1", sourceContext: "search" }), "movie"));
    assert.deepEqual(navigation, { provider: 1, youtube: 1, movie: 1 });
    const visibleSearchResults = [];
    assert.doesNotThrow(() => {
      trackSearchResultsOnce(new Set(), "search-failure-safe", "RRR", 1);
      visibleSearchResults.push("RRR");
    });
    assert.deepEqual(visibleSearchResults, ["RRR"]);
  });
  assert.equal(calls.filter((call) => call[0] === "config").length, 1);
  assert.equal(appended.length, 1);
  const config = calls.find((call) => call[0] === "config")[2];
  assert.equal(config.send_page_view, false);
  assert.equal(config.allow_google_signals, false);
  assert.equal(config.allow_ad_personalization_signals, false);
});

test("analytics functions safely no-op when browser gtag is unavailable", () => {
  const oldWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, value: {} });
  try {
    assert.doesNotThrow(() => trackSearch("RRR"));
  } finally {
    if (oldWindow) Object.defineProperty(globalThis, "window", oldWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});
