import type { PersonSearchEntity } from "@/lib/api";

export type PeopleCatalogItem = PersonSearchEntity & {
  person_slug?: string | null;
  slug?: string | null;
  movie_count?: number | null;
};

export function peopleFilmographyHref(person: PersonSearchEntity & { person_slug?: string | null; slug?: string | null }): string {
  const slug = (person.person_slug ?? person.slug ?? "").trim();
  if (slug) return `/person/${encodeURIComponent(slug)}`;
  const params = new URLSearchParams({ person_id: person.person_id, q: person.display_name });
  return `/search?${params.toString()}`;
}

export function exactPersonFilmographyHref(person: PersonSearchEntity): string {
  const params = new URLSearchParams({ person_id: person.person_id, q: person.display_name });
  return `/search?${params.toString()}`;
}

export function mergePeopleById(...groups: PersonSearchEntity[][]): PersonSearchEntity[] {
  const people = new Map<string, PersonSearchEntity>();
  for (const person of groups.flat()) {
    const id = String(person.person_id ?? "").trim();
    if (id && person.display_name?.trim() && !people.has(id)) people.set(id, person);
  }
  return [...people.values()];
}
