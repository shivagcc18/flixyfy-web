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

test("People landing is data-driven across the five requested language groups", async () => {
  const client = await read("../components/PeopleLandingClient.tsx");
  assert.deepEqual(PEOPLE_LANGUAGES.map(({ slug }) => slug), ["te", "ta", "kn", "hi", "ml"]);
  assert.match(client, /PEOPLE_LANGUAGES\.map/);
  assert.match(client, /api\/v4\/historical\/people/);
  assert.match(client, /api\/v4\/people/);
  assert.match(client, /people-portrait-rail/);
});

test("person cards preserve stable IDs in the filmography route", async () => {
  const person = { person_id: 1234, display_name: "Test Person" };
  assert.equal(peopleFilmographyHref(person), "/search?person_id=1234&q=Test+Person");
  const client = await read("../components/PeopleLandingClient.tsx");
  const search = await read("../components/SearchPageClient.tsx");
  assert.match(client, /trackPersonResultOpened\(personId, "people_legend_card"\)/);
  assert.match(search, /personParams\.set\("person_id", selectedPersonId\)/);
  assert.match(search, /\/api\/v1\/search\/intelligence/);
  assert.match(search, /FILMOGRAPHY/);
  assert.match(search, /person_result_opened|trackPersonResultOpened/);
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
  assert.match(css, /\.brand-logo\s*\{\s*width:96px/);
  assert.match(css, /\.brand-logo\s*\{\s*width:56px/);
  assert.match(css, /#FFF4A8[^}]+#D28A12/s);
  assert.match(css, /\.movie-card-meta \.movie-card-year\s*\{\s*color:\s*#fff\s*!important/);
  assert.match(css, /filter:brightness\(1\.16\) contrast\(1\.08\)[^;]*drop-shadow/);
  assert.match(logo, /\(max-width: 620px\) 56px/);
});
