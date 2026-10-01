import assert from "node:assert/strict";
import test from "node:test";
import { approvedProviderActions, normalizeAvailabilityType } from "./providerActions.mjs";

const approved = new Set(["flatrate", "rent", "buy", "free"]);

test("availability type case variants normalize consistently", () => {
  for (const [upper, lower] of [
    ["FLATRATE", "flatrate"],
    ["RENT", "rent"],
    ["BUY", "buy"],
    ["ADS", "ads"],
    ["FREE", "free"],
  ]) {
    assert.equal(normalizeAvailabilityType(upper), lower);
    assert.equal(normalizeAvailabilityType(lower), lower);
    assert.equal(approved.has(normalizeAvailabilityType(upper)), approved.has(lower));
  }
  assert.equal(normalizeAvailabilityType("  TVOD  "), "tvod");
  assert.equal(normalizeAvailabilityType(null), "");
});

test("approved monetization variants yield one OTT action per provider", () => {
  const options = ["FLATRATE", "flatrate", "RENT", "rent", "BUY", "buy", "FREE", "free"].map(
    (availability_type) => ({
      availability_type,
      button_url: "https://primevideo.example/search",
      navigation_kind: "SEARCH",
      provider_key: "prime_video",
    }),
  );
  options.push(
    {
      availability_type: "ADS",
      button_url: "https://primevideo.example/ads",
      navigation_kind: "SEARCH",
      provider_key: "prime_video",
    },
    {
      availability_type: "ads",
      button_url: "https://primevideo.example/ads",
      navigation_kind: "SEARCH",
      provider_key: "prime_video",
    },
  );
  assert.equal(approvedProviderActions(options).length, 1);
});

test("YouTube video dedupe remains independent of OTT provider dedupe", () => {
  const options = [
    { availability_type: "FLATRATE", button_url: "/prime", navigation_kind: "SEARCH", provider_key: "prime_video" },
    { availability_type: "free", button_url: "/yt1", navigation_kind: "DIRECT", provider_key: "youtube", media_kind: "youtube", video_id: "v1" },
    { availability_type: "FREE", button_url: "/yt1-duplicate", navigation_kind: "DIRECT", provider_key: "youtube", media_kind: "youtube", video_id: "v1" },
    { availability_type: "free", button_url: "/yt2", navigation_kind: "DIRECT", provider_key: "youtube", media_kind: "youtube", video_id: "v2" },
  ];
  const actions = approvedProviderActions(options, 3);
  assert.deepEqual(actions.map((item) => item.button_url), ["/prime", "/yt1", "/yt2"]);
});
