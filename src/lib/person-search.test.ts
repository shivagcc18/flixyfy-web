import assert from "node:assert/strict";
import test from "node:test";
import { resolvePersonQuery } from "./person-search";

const sr = { entity_type: "person" as const, person_id: "1003933", display_name: "N.T. Rama Rao", aliases: ["N.T. Rama Rao"], disambiguation: "actor, director, writer; 109 serving movies" };
const jr = { entity_type: "person" as const, person_id: "148037", display_name: "N.T. Rama Rao Jr.", aliases: ["N.T. Rama Rao Jr."], disambiguation: "actor; 35 serving movies" };
const minor = { entity_type: "person" as const, person_id: "1124377", display_name: "N. T. Rajkumar", aliases: ["N. T. Rajkumar"], disambiguation: "actor; 1 serving movies" };

test("resolves strong Jr NTR forms without IDs", () => {
  assert.equal(resolvePersonQuery("Jr NTR", [jr]).kind, "person");
  assert.equal(resolvePersonQuery("Junior NTR", [jr]).kind, "person");
});

test("resolves an exact canonical person from multiple candidates", () => {
  const result = resolvePersonQuery("Rajinikanth", [
    { entity_type: "person", person_id: "91555", display_name: "Rajinikanth", aliases: ["Rajinikanth"] },
    { entity_type: "person", person_id: "5556280", display_name: "RAJINIKANTH SK", aliases: ["RAJINIKANTH SK"] },
  ]);
  assert.equal(result.kind, "person");
});

test("disambiguates credible initial matches and excludes weak candidates", () => {
  const result = resolvePersonQuery("NTR", [sr, jr, minor]);
  assert.equal(result.kind, "choices");
  if (result.kind === "choices") assert.deepEqual(result.people.map((person) => person.person_id), ["1003933", "148037"]);
});

test("leaves weak acronym matches to normal movie search", () => {
  const result = resolvePersonQuery("RRR", [{ entity_type: "person", person_id: "x", display_name: "M. R. R. Raghu", aliases: ["M. R. R. Raghu"], disambiguation: "actor; 1 serving movies" }]);
  assert.equal(result.kind, "movie");
});