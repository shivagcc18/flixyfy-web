export type Movie = {
  id: string; title: string; year: number | null; release_date: string | null;
  language: string | null; poster: string | null; rating: number | null;
  provider_count: number; youtube_count: number; roles?: string[];
  relationship_type?: string;
  verified_presentation_role?: string | null; inferred_presentation_role?: string | null;
  presentation_role_status?: "VERIFIED" | "INFERRED" | "UNCLASSIFIED";
};
export type MoviePage = { total: number; items: Movie[]; next_cursor: string | null };
export type PersonHit = { id: string; display_name: string; filmography_total: number; languages?: string[]; portrait?: string | null; role_label?: string | null; inferred_presentation_role?: string | null; inferred_film_count?: number; role_inference_status?: string };
export type Person = PersonHit & {
  portrait: string | null; aliases: string[]; profile_status: string;
  accepted_edge_total: number;
  role_counts: Record<string, number>; relationship_counts: Record<string, number>;
  verified_presentation_role_counts: Record<string, number>; inferred_presentation_role_counts: Record<string, number>; effective_role_counts: Record<string, number>;
  role_inference: { status: string; inferred_presentation_role: string | null; threshold: number; rule_version: string; verified_lead_credit_counts: Record<string, number>; inferred_fxm_count: number; review_fxm_count: number };
  date_of_birth: string | null; birth_year: number | null; dob_precision: string | null;
  birthday_month: number | null; birthday_day: number | null;
  birth_verification_status: string | null;
};
export type PersonSearch = { total: number; ambiguous?: boolean; items: PersonHit[]; suggestions?: string[]; suggested_people?: PersonHit[] };
export type MovieDetail = Movie & {
  original_title?: string | null; runtime?: number | null; backdrop?: string | null;
  overview: string | null; genres: string[]; providers: { key: string; offer_count: number; url?: string | null }[];
  youtube: { watch_url: string; language: string | null }[];
  cast: { person_id: string; name: string; role: string; relationship_type: string }[];
};
export type Provider = { key: string; movie_count: number; friendly_name?: string | null; logo?: string | null };

async function get<T>(path: string): Promise<T> {
  const response = await fetch(path, { headers: { Accept: "application/json" }, cache: "no-store" });
  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("application/json")) throw new Error("API returned a non-JSON response");
  if (!response.ok) throw new Error(`API request failed (${response.status})`);
  return response.json() as Promise<T>;
}

export const api = {
  health: () => get<{ status: string; person_input: { people: number; edges: number }; movie_input: { movies: number } }>("/api/v3/health"),
  search: (q: string) => get<{ people: { total: number; items: PersonHit[] }; movies: { total: number; items: Movie[] } }>(`/api/v3/search?q=${encodeURIComponent(q)}`),
  people: (q: string) => get<PersonSearch>(`/api/v3/people/search?q=${encodeURIComponent(q)}`),
  peopleLanguage: (language: string, cursor = "", limit = 60, category = "ALL") => get<{ total_memberships: number; items: PersonHit[]; next_cursor: string | null }>(`/api/v3/people/languages/${encodeURIComponent(language)}?limit=${limit}&category=${encodeURIComponent(category)}${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ""}`),
  person: (id: string) => get<Person>(`/api/v3/people/${encodeURIComponent(id)}`),
  personMovies: (id: string, cursor = "", limit = 30, filter: { role?: string; relationship_type?: string } = {}) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (cursor) params.set("cursor", cursor);
    if (filter.role) params.set("role", filter.role);
    if (filter.relationship_type) params.set("relationship_type", filter.relationship_type);
    return get<MoviePage & { accepted_edge_total: number; person_id: string }>(`/api/v3/people/${encodeURIComponent(id)}/movies?${params}`);
  },
  coactors: (id: string) => get<{ items: (PersonHit & { shared_movie_count: number })[] }>(`/api/v3/people/${encodeURIComponent(id)}/coactors`),
  combinations: (id: string) => get<{ items: { people: PersonHit[]; shared_movie_count: number }[] }>(`/api/v3/people/${encodeURIComponent(id)}/combinations`),
  movies: (params: Record<string, string | number | undefined>) => {
    const search = new URLSearchParams(Object.entries(params).filter(([, value]) => value !== undefined && value !== "").map(([key, value]) => [key, String(value)]));
    return get<MoviePage>(`/api/v3/movies?${search}`);
  },
  movie: (id: string) => get<MovieDetail>(`/api/v3/movies/${encodeURIComponent(id)}`),
  providers: () => get<{ items: Provider[] }>("/api/v3/providers"),
};
