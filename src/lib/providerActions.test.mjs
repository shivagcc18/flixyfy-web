import assert from "node:assert/strict";
import test from "node:test";
import { approvedProviderActions, normalizeAvailabilityType, providerActionIsNavigable } from "./providerActions.mjs";

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
    assert.equal(normalizeAvailabilityType(upper), normalizeAvailabilityType(lower));
  }
  assert.equal(normalizeAvailabilityType("  TVOD  "), "tvod");
  assert.equal(normalizeAvailabilityType(null), "");
});

const action = (provider_key, availability_type = "FLATRATE") => ({
  provider_key,
  provider_name: provider_key,
  availability_type,
  navigation_kind: "SEARCH",
  button_url: `https://watch.example/${provider_key}`,
});

test("one-provider movie yields one action", () => {
  assert.deepEqual(approvedProviderActions([action("prime_video")]).map((x) => x.provider_key), ["prime_video"]);
});

test("two-provider movie retains JioHotstar ADS and Prime Video FLATRATE", () => {
  const options = [action("jiohotstar", "ADS"), action("prime_video", "FLATRATE")];
  assert.deepEqual(approvedProviderActions(options).map((x) => x.provider_key), ["jiohotstar", "prime_video"]);
});

test("three-provider accepted fixture retains every distinct provider", () => {
  const options = [action("hoichoi_amazon_channel"), action("jiohotstar", "ADS"), action("vi_movies_and_tv")];
  assert.deepEqual(approvedProviderActions(options).map((x) => x.provider_key), [
    "hoichoi_amazon_channel", "jiohotstar", "vi_movies_and_tv",
  ]);
});

test("duplicate representations of one provider collapse to one action", () => {
  const options = [action("prime_video", "FLATRATE"), action("prime_video", "ADS")];
  assert.equal(approvedProviderActions(options).length, 1);
});

test("different providers never deduplicate against each other", () => {
  assert.equal(approvedProviderActions([action("prime_video"), action("jiohotstar", "ADS")]).length, 2);
});

test("an unknown provider without a logo remains an eligible action", () => {
  const unknown = action("regional_service_without_logo");
  assert.equal(approvedProviderActions([unknown])[0].button_url, unknown.button_url);
});

test("accepted label-only provider remains visible without becoming clickable", () => {
  const labelOnly = { ...action("regional_service_without_logo"), button_url: null, navigation_kind: "LABEL_ONLY" };
  assert.deepEqual(approvedProviderActions([labelOnly]), [labelOnly]);
  assert.equal(providerActionIsNavigable(labelOnly), false);
});

test("provider fallback search and home routes remain clickable", () => {
  assert.equal(providerActionIsNavigable(action("store", "RENT")), true);
  assert.equal(providerActionIsNavigable({ ...action("home", "FLATRATE"), navigation_kind: "HOME" }), true);
  assert.equal(providerActionIsNavigable({ ...action("bad", "FLATRATE"), navigation_kind: "UNAVAILABLE" }), false);
});

test("provider-filtered search and detail retain the same provider truth", () => {
  const filteredSearch = [action("jiohotstar", "ADS")];
  const detail = [action("jiohotstar", "ADS"), action("prime_video")];
  assert.deepEqual(
    approvedProviderActions(detail).map((x) => x.provider_key).filter((key) => key === "jiohotstar"),
    filteredSearch.map((x) => x.provider_key),
  );
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
