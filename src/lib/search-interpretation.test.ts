import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { languageName } from "./languages";
import { parseSearchIntent, serializeSearchParams } from "./search-interpretation";

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
});
