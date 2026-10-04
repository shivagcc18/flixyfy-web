export type PeopleLanguage = {
  slug: string;
  name: string;
  subtitle: string;
};

export type PeopleCatalogItem = {
  person_id: string | number;
  name?: string | null;
  display_name?: string | null;
  movie_count?: number | null;
  profile_path?: string | null;
  profile_image_url?: string | null;
  photo_url?: string | null;
  roles?: string[] | null;
};

export type PeopleCatalogResponse = {
  items?: PeopleCatalogItem[];
  results?: PeopleCatalogItem[];
  total?: number;
  page?: number;
  limit?: number;
};

export const PEOPLE_LANGUAGES: PeopleLanguage[] = [
  { slug: "te", name: "Telugu", subtitle: "People connected to Telugu cinema" },
  { slug: "hi", name: "Hindi", subtitle: "People connected to Hindi cinema" },
  { slug: "ta", name: "Tamil", subtitle: "People connected to Tamil cinema" },
  { slug: "ml", name: "Malayalam", subtitle: "People connected to Malayalam cinema" },
  { slug: "kn", name: "Kannada", subtitle: "People connected to Kannada cinema" },
];

export const PEOPLE_PAGE_SIZE = 24;

export function peopleFilmographyHref(person: PeopleCatalogItem): string {
  const personId = String(person.person_id ?? "").trim();
  const name = (person.display_name ?? person.name ?? "").trim();
  const params = new URLSearchParams({ person_id: personId, q: name });
  return `/search?${params.toString()}`;
}

export function mergePeopleCatalogs(
  ...catalogs: PeopleCatalogItem[][]
): PeopleCatalogItem[] {
  const peopleById = new Map<string, PeopleCatalogItem>();
  for (const item of catalogs.flat()) {
    const id = String(item.person_id ?? "").trim();
    const name = (item.display_name ?? item.name ?? "").trim();
    if (!id || !name) continue;
    const previous = peopleById.get(id);
    if (!previous || Number(item.movie_count ?? 0) > Number(previous.movie_count ?? 0)) {
      peopleById.set(id, item);
    }
  }
  return [...peopleById.values()];
}

export function personDisplayName(person: PeopleCatalogItem): string {
  return (person.display_name ?? person.name ?? "").trim();
}

export function personInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => Array.from(part)[0] ?? "")
    .join("")
    .toLocaleUpperCase();
}

export function personPortraitUrl(person: PeopleCatalogItem): string | null {
  return person.photo_url ?? person.profile_image_url ?? person.profile_path ?? null;
}
