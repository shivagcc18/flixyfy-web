import type { PersonSearchEntity } from "./api";

export type PersonResolution =
  | { kind: "person"; person: PersonSearchEntity }
  | { kind: "choices"; people: PersonSearchEntity[] }
  | { kind: "movie" };

function words(value: string): string[] {
  return value.normalize("NFKD").toLowerCase().replace(/\bjunior\b/g, "jr").replace(/[^a-z0-9]+/g, " ").trim().split(/\s+/).filter(Boolean);
}

function compact(value: string): string {
  return words(value).join("");
}

function servingMovieCount(person: PersonSearchEntity): number | null {
  const match = person.disambiguation?.match(/(\d+)\s+serving movies/i);
  return match ? Number(match[1]) : null;
}

export function resolvePersonQuery(query: string, people: PersonSearchEntity[]): PersonResolution {
  if (!people.length) return { kind: "movie" };
  const queryWords = words(query);
  const queryCompact = queryWords.join("");
  const variants = (person: PersonSearchEntity) => [person.display_name, ...(person.aliases ?? [])];
  const exact = people.filter((person) => variants(person).some((name) => compact(name) === queryCompact));
  if (exact.length === 1) return { kind: "person", person: exact[0] };
  if (exact.length > 1) return { kind: "choices", people: exact };

  if (queryWords.length > 1) {
    const strong = people.filter((person) => queryWords.every((word) => compact(person.display_name).includes(word)));
    if (strong.length === 1) return { kind: "person", person: strong[0] };
    if (strong.length > 1) return { kind: "choices", people: strong };
  }

  if (/^[A-Z][A-Z.\s]{1,8}$/.test(query.trim())) {
    const initialMatches = people.filter((person) => compact(person.display_name).startsWith(queryCompact));
    const counts = initialMatches.map(servingMovieCount).filter((count): count is number => count !== null);
    const highestCount = counts.length ? Math.max(...counts) : null;
    const credible = initialMatches.filter((person) => {
      const count = servingMovieCount(person);
      return highestCount === null || count === null || count >= highestCount * 0.2;
    });
    if (credible.length > 1) return { kind: "choices", people: credible.slice(0, 4) };
  }
  return { kind: "movie" };
}