import assert from "node:assert/strict";
import test from "node:test";
import { getEntitySearchBlocker } from "./search-guards";
import { isCurrentSuggestionResponse, shouldOpenSuggestions } from "./search-ux";

test("suggestions open only while focused and editing a submitted query", () => {
  assert.equal(shouldOpenSuggestions({ focused: true, value: "Bahubali", submittedValue: "", itemCount: 3, blocked: false }), true);
  assert.equal(shouldOpenSuggestions({ focused: false, value: "Bahubali", submittedValue: "", itemCount: 3, blocked: false }), false);
  assert.equal(shouldOpenSuggestions({ focused: true, value: "Bahubali", submittedValue: "Bahubali", itemCount: 3, blocked: false }), false);
  assert.equal(shouldOpenSuggestions({ focused: true, value: "NTR movies", submittedValue: "", itemCount: 3, blocked: true }), false);
});

test("submit and navigation states cannot reopen the panel", () => {
  assert.equal(shouldOpenSuggestions({ focused: false, value: "Prabhas", submittedValue: "Prabhas", itemCount: 8, blocked: false }), false);
  assert.equal(shouldOpenSuggestions({ focused: true, value: "Prabhas", submittedValue: "Prabhas", itemCount: 8, blocked: false }), false);
});

test("late responses are rejected after a newer request", () => {
  const base = { query: "Prabhas", currentQuery: "Prabhas", submittedValue: "", focused: true, blocked: false };
  assert.equal(isCurrentSuggestionResponse({ ...base, requestId: 1, currentRequestId: 2 }), false);
  assert.equal(isCurrentSuggestionResponse({ ...base, requestId: 2, currentRequestId: 2 }), true);
  assert.equal(isCurrentSuggestionResponse({ ...base, requestId: 2, currentRequestId: 2, currentQuery: "Bahubali" }), false);
});

test("submitted query and blur make stale responses invalid", () => {
  assert.equal(isCurrentSuggestionResponse({ requestId: 3, currentRequestId: 3, query: "Prabhas", currentQuery: "Prabhas", submittedValue: "Prabhas", focused: true, blocked: false }), false);
  assert.equal(isCurrentSuggestionResponse({ requestId: 3, currentRequestId: 3, query: "Prabhas", currentQuery: "Prabhas", submittedValue: "", focused: false, blocked: false }), false);
});

test("unsafe person/provider phrases return explicit backend blockers", () => {
  assert.equal(getEntitySearchBlocker("Prabhas on Netflix")?.code, "BACKEND_ENTITY_FILTER_BLOCKED");
  assert.equal(getEntitySearchBlocker("NTR movies")?.code, "BACKEND_PERSON_DISAMBIGUATION_BLOCKED");
  assert.equal(getEntitySearchBlocker("Telugu action movies"), null);
});
