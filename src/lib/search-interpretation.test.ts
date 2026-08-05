import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { languageName } from "./languages";
import { mergeSearchParams, parseSearchIntent, serializeSearchParams } from "./search-interpretation";

const providers = [
  { provider_key: "netflix", provider_name: "Netflix" },
  { provider_key: "prime_video", provider_name: "Prime Video" },
  { provider_key: "aha", provider_name: "Aha" },
];

describe("search interpretation", () => {
  it("extracts an entity and provider without destroying the title query", () => {
    const intent = parseSearchIntent("Prabhas on Netflix", providers);
    assert.equal(intent.query, "Prabhas");
    assert.equal(intent.provider, "netflix");
    assert.equal(intent.providerName, "Netflix");
  });

  it("extracts language, genre, provider, and movie type", () => {
    const intent = parseSearchIntent("Telugu action movies on Aha", providers);
    assert.equal(intent.query, "");
    assert.equal(intent.language, "te");
    assert.equal(intent.genre, "Action");
    assert.equal(intent.provider, "aha");
  });

  it("maps decade classics to historical year bounds", () => {
    const intent = parseSearchIntent("1990s Tamil classics", providers);
    assert.equal(intent.domain, "historical");
    assert.equal(intent.language, "ta");
    assert.equal(intent.yearFrom, "1990");
    assert.equal(intent.yearTo, "1999");
  });

  it("serializes only meaningful shareable parameters", () => {
    assert.equal(
      serializeSearchParams({ q: "Prabhas", provider: "netflix", language: "", domain: "current" }),
      "q=Prabhas&provider=netflix",
    );
  });

  it("uses full supported language names", () => {
    assert.equal(languageName("te"), "Telugu");
    assert.equal(languageName("bho"), "Bhojpuri");
  });

  it("preserves provider, language, and year while filters change", () => {
    let current = "provider=vi_movies_and_tv";
    current = mergeSearchParams(current, { language: "te" });
    assert.equal(current, "language=te&provider=vi_movies_and_tv");
    current = mergeSearchParams(current, { year: "2024" });
    assert.equal(current, "language=te&provider=vi_movies_and_tv&year=2024");
    current = mergeSearchParams(current, { language: "ta" });
    assert.equal(current, "language=ta&provider=vi_movies_and_tv&year=2024");
    current = mergeSearchParams(current, { year: undefined });
    assert.equal(current, "language=ta&provider=vi_movies_and_tv");
  });

  it("accepts language codes and names without case sensitivity", () => {
    assert.equal(mergeSearchParams("", { language: "Te" }), "language=te");
    assert.equal(mergeSearchParams("", { language: "TELUGU" }), "language=te");
    assert.equal(mergeSearchParams("", { language: "Tamil" }), "language=ta");
    assert.equal(mergeSearchParams("", { language: "HINDI" }), "language=hi");
    assert.equal(mergeSearchParams("", { language: "Malayalam" }), "language=ml");
    assert.equal(mergeSearchParams("", { language: "Kn" }), "language=kn");
    assert.equal(mergeSearchParams("", { language: "Bengali" }), "language=bn");
    assert.equal(mergeSearchParams("", { language: "MR" }), "language=mr");
  });

  it("canonicalizes Telugu names and preserves unrelated parameters", () => {
    assert.equal(
      mergeSearchParams("q=Pushpak&provider=vi_movies_and_tv&year=2024", { language: "Telugu" }),
      "q=Pushpak&language=te&provider=vi_movies_and_tv&year=2024",
    );
  });

  it("clearing every filter produces the empty search URL", () => {
    assert.equal(serializeSearchParams({}), "");
  });
});
