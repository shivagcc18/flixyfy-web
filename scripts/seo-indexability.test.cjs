const assert = require("node:assert/strict");
const test = require("node:test");
const { CORE_PATHS, sitemapEntry } = require("./generate-sitemap-v9.cjs");

test("generated movie sitemap entries use canonical www movie routes without query strings", () => {
  const entry = sitemapEntry({ canonical_movie_id: "TMDB:123", domain: "current", updated_at: "2026-09-30 12:00:00" });
  assert.match(entry, /<loc>https:\/\/www\.flixyfy\.com\/movie\/TMDB%3A123<\/loc>/);
  assert.doesNotMatch(entry, /flixyfy\.com\/movie\/TMDB%3A123\?/);
  assert.match(entry, /<lastmod>2026-09-30<\/lastmod>/);
});

test("core sitemap contains only implemented static routes", () => {
  assert.deepEqual(CORE_PATHS, ["/", "/providers", "/contact", "/privacy", "/terms", "/copyright"]);
  assert.equal(new Set(CORE_PATHS).size, CORE_PATHS.length);
});

test("movie metadata has a canonical www URL and factual title structure", async () => {
  const { movieMetadata, movieCanonicalUrl } = await import("../src/lib/movie-seo.ts");
  const movie = {
    canonical_movie_id: "TMDB:123",
    tmdb_id: 123,
    title: "Example Film",
    release_year: 2024,
    domain: "current",
    provider_count: 0,
    providers: [],
    genres: [],
    languages: [],
    cast: [],
    crew: [],
  };
  const metadata = movieMetadata(movie, "slug-alias");
  assert.equal(movieCanonicalUrl(movie, "slug-alias"), "https://www.flixyfy.com/movie/TMDB%3A123");
  assert.equal(metadata.title.absolute, "Example Film (2024) – Where to Watch in India | FLIXYFY");
  assert.equal(metadata.alternates.canonical, "https://www.flixyfy.com/movie/TMDB%3A123");
  assert.equal(metadata.openGraph.url, "https://www.flixyfy.com/movie/TMDB%3A123");
});

test("Movie JSON-LD emits only supported fields and remains safe to parse", async () => {
  const { movieStructuredData, jsonLdScriptValue } = await import("../src/lib/movie-seo.ts");
  const movie = {
    canonical_movie_id: "TMDB:123",
    tmdb_id: 123,
    title: "<Example Film>",
    domain: "historical",
    provider_count: 0,
    providers: [],
    genres: [],
    languages: [],
    cast: [],
    crew: [],
  };
  const schema = movieStructuredData(movie, "123");
  assert.equal(schema["@type"], "Movie");
  assert.equal(schema.name, "<Example Film>");
  assert.equal(schema.url, "https://www.flixyfy.com/movie/TMDB%3A123");
  assert.equal("aggregateRating" in schema, false);
  assert.equal("actor" in schema, false);
  const raw = jsonLdScriptValue(schema);
  assert.equal(raw.includes("<Example"), false);
  assert.equal(JSON.parse(raw).name, "<Example Film>");
});
