import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { mergePeopleById, peopleFilmographyHref } from "./people-landing.ts";

const here = path.dirname(fileURLToPath(import.meta.url));
const source = (relative) => readFile(path.resolve(here, relative), "utf8");

test("People navigation opens a real route while retaining all five destinations", async () => {
  const shell = await source("../components/AppShell.tsx");
  const route = await source("../../app/people/page.tsx");
  assert.match(shell, /\{ href: "\/people", label: "People"/);
  assert.match(shell, /label: "Languages"/);
  assert.match(shell, /label: "Providers"/);
  assert.match(route, /PeopleLandingClient/);
});

test("People discovery renders canonical people and uses exact-ID navigation", async () => {
  const client = await source("../components/PeopleLandingClient.tsx");
  assert.match(client, /api\/v1\/search\/entities/);
  assert.match(client, /resolvePersonQuery/);
  assert.match(client, /peopleFilmographyHref\(person\)/);
  assert.match(client, /role="alert"/);
  assert.match(client, /People directory could not be loaded/);
  assert.deepEqual(mergePeopleById(
    [{ person_id: "42", display_name: "A Person", entity_type: "person", aliases: [] }],
    [{ person_id: "42", display_name: "Duplicate", entity_type: "person", aliases: [] }, { person_id: "43", display_name: "B Person", entity_type: "person", aliases: [] }],
  ).map((person) => person.person_id), ["42", "43"]);
  assert.equal(peopleFilmographyHref({ person_id: "1061913", display_name: "Indrans", entity_type: "person", aliases: [] }), "/search?person_id=1061913&q=Indrans");
});

test("slug resolution uses current then historical endpoints and redirects to exact ID", async () => {
  const route = await source("../../app/person/[slug]/page.tsx");
  const client = await source("../components/PersonDetailClient.tsx");
  assert.match(route, /PersonDetailClient slug=\{slug\}/);
  assert.match(client, /api\/v1\/person\/current/);
  assert.match(client, /api\/v1\/person\/historical/);
  assert.match(client, /router\.replace\(`\/search\?/);
  assert.match(client, /person_id: id/);
  assert.match(client, /Person not found/);
  assert.match(client, /Person details are unavailable/);
});

test("explicit Person ID is authoritative and filmography stays paged at 48", async () => {
  const search = await source("../components/SearchPageClient.tsx");
  const branch = search.split("if (personId) {")[1]?.split("} else {")[0] ?? "";
  assert.match(branch, /person_id: personId/);
  assert.doesNotMatch(branch, /search\/entities/);
  assert.match(search, /filterParams\.set\("limit", "48"\)/);
  assert.match(search, /api\/v1\/search\/intelligence/);
  assert.match(search, /if \(personId\) throw new Error/);
  assert.match(search, /PERSON FILMOGRAPHY/);
});
