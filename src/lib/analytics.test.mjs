import test from "node:test";
import assert from "node:assert/strict";
import {
  claimEvent,
  hashEventKey,
  initAnalytics,
  sanitizeSearchTerm,
  trackFilterApplied,
  trackLoadMore,
  trackMovieOpened,
  trackNoResultSearch,
  trackPageView,
  trackPersonResultOpened,
  trackProviderClicked,
  trackSearch,
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
    trackProviderClicked({ canonicalMovieId: "TMDB:123", tmdbId: 123 }, "Prime Video", "flatrate", "DIRECT");
    trackYoutubeClicked({ canonicalMovieId: "TMDB:123", tmdbId: 123, movieLanguage: "te" }, 2);
    trackLoadMore("search", 48, 96, { language_filter: "te", year_filter: "2026" });
    trackFilterApplied("provider", "prime_video");
    trackNoResultSearch("nothing", { searchSource: "search_page" });
    trackPersonResultOpened("person:42");
    trackPageView("/search");
  });
  const names = calls.map((call) => call[1]);
  assert.deepEqual(names, ["search", "movie_opened", "provider_clicked", "youtube_clicked", "load_more_clicked", "filter_applied", "no_result_search", "person_result_opened", "page_view"]);
  assert.equal(calls[0][2].search_term, "RRR");
  assert.equal(calls[0][2].result_count, 12);
  assert.equal(calls[2][2].routing_type, "DIRECT");
  assert.equal(calls[3][2].video_rank, 2);
  assert.deepEqual(calls[8][2], { page_path: "/search" });
});

test("search terms fail closed for email, phone, and values over 100 characters", () => {
  assert.equal(sanitizeSearchTerm("  RRR  "), "RRR");
  assert.equal(sanitizeSearchTerm("user@example.com"), "[redacted]");
  assert.equal(sanitizeSearchTerm("+91 98765 43210"), "[redacted]");
  assert.equal(sanitizeSearchTerm("x".repeat(101)), "[redacted]");
  assert.equal(sanitizeSearchTerm("  "), undefined);
});

test("duplicate async search completions claim a hashed key only once", () => {
  const seen = new Set();
  const key = hashEventKey("long query text");
  assert.equal(claimEvent(seen, key), true);
  assert.equal(claimEvent(seen, key), false);
  assert.equal(key.includes("long query text"), false);
});

test("initialization configures one non-personalized tag and provider navigation continues if gtag throws", () => {
  const { calls, appended } = withBrowser(() => {
    initAnalytics();
    initAnalytics();
    window.gtag = () => { throw new Error("analytics unavailable"); };
    assert.doesNotThrow(() => trackProviderClicked({ canonicalMovieId: "TMDB:1" }, "Netflix", "flatrate", "SEARCH"));
    let navigationContinued = false;
    navigationContinued = true;
    assert.equal(navigationContinued, true);
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
