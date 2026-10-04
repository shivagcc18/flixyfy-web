import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import {
  mergePeopleCatalogs,
  PEOPLE_LANGUAGES,
  peopleFilmographyHref,
  personInitials,
} from "./people-landing.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const read = (relative) => readFile(path.resolve(here, relative), "utf8");

test("primary navigation links People and omits Languages", async () => {
  const appShell = await read("../components/AppShell.tsx");
  assert.match(appShell, /href: "\/people", label: "People"/);
  assert.doesNotMatch(appShell, /label: "Languages"|from "lucide-react"[^\n]*Languages/);
});

test("People landing is a full directory with All People fallback, data-backed filters, and backend-powered search", async () => {
  const client = await read("../components/PeopleLandingClient.tsx");
  assert.deepEqual(PEOPLE_LANGUAGES.map(({ slug }) => slug), ["te", "hi", "ta", "ml", "kn"]);
  assert.match(client, /PEOPLE_LANGUAGES\.map/);
  assert.match(client, /api\/v4\/historical\/people/);
  assert.match(client, /api\/v4\/people/);
  assert.match(client, /loadFilter\("all"\)/);
  assert.match(client, /people-language-filters/);
  assert.match(client, /Filter people by language/);
  assert.match(client, /Search actors, actresses, directors/);
  assert.match(client, /api\/v1\/search\/entities/);
  assert.match(client, /PersonSearchEntity/);
  assert.match(client, /people_directory_search/);
  assert.match(client, /people-portrait-rail/);
  assert.match(client, /profile_image_url/);
  assert.match(client, /people-portrait-image/);
  assert.match(client, /onError=\{\(\) => setImageFailed\(true\)\}/);
  assert.doesNotMatch(client, /resolvePersonQuery/);
  assert.match(client, /Find your favourite actors, actresses and filmmakers/);
  assert.match(client, /<h1 id="people-title"/);
  assert.doesNotMatch(client, /people-hero|Across languages and generations|Stars\. Stories\. Filmographies/);
  assert.doesNotMatch(client, /people_legend_card|people_legend/);
  assert.doesNotMatch(client, /Legends of Indian Cinema|Load more legends/);
});

test("person cards preserve stable IDs in the filmography route", async () => {
  const person = { person_id: 1234, display_name: "Test Person" };
  assert.equal(peopleFilmographyHref(person), "/search?person_id=1234&q=Test+Person");
  const client = await read("../components/PeopleLandingClient.tsx");
  const search = await read("../components/SearchPageClient.tsx");
  assert.match(client, /trackPersonResultOpened\(personId, searching \? "people_directory_search" : "people_directory"\)/);
  assert.match(search, /personParams\.set\("person_id", selectedPersonId\)/);
  assert.match(search, /\/api\/v1\/search\/intelligence/);
  assert.match(search, /FILMOGRAPHY/);
  assert.match(search, /person_result_opened|trackPersonResultOpened/);
  const directIdBranch = search.split("if (personId) {")[1]?.split("} else {")[0] ?? "";
  assert.match(directIdBranch, /person_id: personId/);
  assert.doesNotMatch(directIdBranch, /search\/entities|resolvePersonQuery/);
  assert.match(search, /filterParams\.set\("limit", personId \? "100" : "48"\)/);
  assert.match(search, /The current serving API returned no movies for this Person ID/);
  assert.match(search, /Filmography could not be loaded/);
  assert.match(search, /setSearchRetry\(\(value\) => value \+ 1\)/);
});

test("a full Person page offers a next-page check instead of assuming the count is complete", async () => {
  const search = await read("../components/SearchPageClient.tsx");
  assert.match(search, /filmographyExhausted/);
  assert.match(search, /personId && data\.items\.length >= 100 && !filmographyExhausted/);
  assert.match(search, /personParams\.set\("person_id", selectedPersonId\)/);
  assert.match(search, /setFilmographyExhausted\(nextMovies\.length < \(response\.limit \|\| data\.limit\)\)/);
  assert.match(search, /if \(query\.trim\(\) && !selectedPersonId\) nextParams\.set\("q", query\.trim\(\)\)/);
  assert.match(search, /The API returned no further page; the full filmography count remains unverified/);
});

test("catalog merge de-duplicates only by stable ID and initials are a safe portrait fallback", () => {
  const people = mergePeopleCatalogs(
    [{ person_id: "42", name: "A Person", movie_count: 3 }],
    [{ person_id: 42, name: "A Person", movie_count: 5 }, { person_id: "43", name: "B Person" }],
  );
  assert.equal(people.length, 2);
  assert.equal(people[0].movie_count, 5);
  assert.equal(personInitials("N. T. Rama Rao"), "NT");
  assert.equal(personInitials("Rama Rao"), "RR");
});

test("four-item mobile navigation and metallic display gold keep white movie years", async () => {
  const css = await read("../../app/globals.css");
  const logo = await read("../components/FlixyfyLogo.tsx");
  assert.match(css, /\.mobile-nav\s*\{\s*grid-template-columns:repeat\(4,minmax\(0,1fr\)\)/);
  assert.match(css, /\.brand-logo\s*\{\s*width:102px/);
  assert.match(css, /\.brand-logo\s*\{\s*width:62px/);
  assert.match(css, /\.people-portrait\s*\{[^}]*border-color:var\(--legend-gold-ring\)/s);
  assert.match(css, /#FFF4A8[^}]+#D28A12/s);
  assert.match(css, /\.movie-card-meta \.movie-card-year\s*\{\s*color:\s*#fff\s*!important/);
  assert.match(css, /filter:brightness\(1\.18\) contrast\(1\.12\)[^;]*drop-shadow/);
  assert.match(logo, /\(max-width: 620px\) 62px/);
});
