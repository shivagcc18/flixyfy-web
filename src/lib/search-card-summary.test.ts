import assert from "node:assert/strict";
import test from "node:test";
// @ts-expect-error Node's strip-types runner needs the explicit extension; Next's typecheck does not enable it.
import { projectSearchCardSummary } from "./search-card-summary.ts";

test("projects display-only OTT labels separately from YouTube", () => {
  assert.deepEqual(projectSearchCardSummary({
    providers: "Netflix,Apple TV Store,YouTube",
    provider_keys: "netflix,apple_tv_store,youtube",
    youtube_video_count: 2,
    youtube_languages: "Bangla,English",
  }), {
    providers: ["Netflix", "Apple TV Store"],
    youtubeVideoCount: 2,
    youtubeAvailable: true,
    youtubeLanguages: ["Bangla", "English"],
  });
});

test("uses accepted zero-count state without inventing YouTube languages", () => {
  assert.deepEqual(projectSearchCardSummary({
    providers: "Prime Video",
    provider_keys: "prime_video",
    youtube_video_count: 0,
    youtube_languages: "",
  }), {
    providers: ["Prime Video"],
    youtubeVideoCount: 0,
    youtubeAvailable: false,
    youtubeLanguages: [],
  });
});

test("uses the accepted Search provider projection when action objects are absent", () => {
  assert.deepEqual(projectSearchCardSummary({
    providers: [],
    provider_names: "Prime Video",
    provider_keys: "prime_video",
    youtube_video_count: 0,
    youtube_languages: "",
  }), {
    providers: ["Prime Video"],
    youtubeVideoCount: 0,
    youtubeAvailable: false,
    youtubeLanguages: [],
  });
});

test("omits unavailable fields instead of deriving them from a title", () => {
  assert.deepEqual(projectSearchCardSummary({}), {
    providers: [],
    youtubeVideoCount: null,
    youtubeAvailable: null,
    youtubeLanguages: [],
  });
});
