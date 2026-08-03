import { normalizePosterUrl } from "@/lib/poster-normalizer";

const configuredApiBase = process.env.NEXT_PUBLIC_FLIXYFY_API_URL?.trim();

export const API_BASE =
  configuredApiBase?.replace(/\/+$/, "") ??
  (process.env.NODE_ENV === "production" ? "" : "http://127.0.0.1:8000");

export type CanonicalMovieId = `TMDB:${number}` | `HIST:${string}`;
export type LanguageVariant = "original" | "dubbed" | "unknown";
export type ProviderNavigation =
  | { kind: "DIRECT"; url: string }
  | { kind: "SEARCH"; url: string }
  | { kind: "HOME"; url: string }
  | { kind: "UNAVAILABLE"; url: null };
export type ApiError = { detail: string; status?: number };
export type Pagination = { total: number; limit: number; offset: number };

export type Provider = {
  provider_key: string;
  provider_name: string;
  availability_type: string;
  provider_category?: string | null;
  button_url: string | null;
  button_label: string;
  navigation_kind: "DIRECT" | "SEARCH" | "HOME" | "UNCONFIGURED" | "UNAVAILABLE";
};

export type AvailabilityOption = Provider & {
  availability_id?: string;
  provider_variant_key?: string;
  access_model?: "paid_ott" | "rent" | "buy" | "free" | string;
  language_variant?: LanguageVariant;
  media_kind?: "ott" | "youtube";
  video_id?: string;
};
export type OttAvailability = AvailabilityOption & { media_kind?: "ott" };
export type YouTubeAvailability = AvailabilityOption & { media_kind: "youtube" };

export type MovieIdentity = {
  canonical_movie_id: CanonicalMovieId;
  tmdb_id: number | null;
  imdb_id?: string | null;
  route: {
    kind: "TMDB" | "CANONICAL";
    route_key: string;
    api_path: string;
  };
};

export type Movie = {
  canonical_movie_id: CanonicalMovieId;
  tmdb_id: number | null;
  movie_identity?: MovieIdentity;
  imdb_id?: string | null;
  title: string;
  original_title?: string | null;
  release_year?: number | null;
  domain: "current" | "historical";
  original_language?: string | null;
  language_name?: string | null;
  runtime?: number | null;
  overview?: string | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  tmdb_rating?: number | null;
  imdb_rating?: number | null;
  provider_count: number;
  youtube_video_count?: number;
  availability_count?: number;
  providers: Provider[];
  availability?: AvailabilityOption[];
  availability_summary?: { count: number; providers: string[] };
  matched_fields?: string[];
};

export type MovieSummary = Movie;
export type SearchResult = Movie;
export type MovieDetail = Movie & {
  genres: { genre_id: number; genre_name: string }[];
  languages: { iso_639_1: string; language_name: string }[];
  cast: { person_id?: number | null; name: string; role?: string | null; character_name?: string | null }[];
  crew: { person_id?: number | null; name: string; role?: string | null; character_name?: string | null }[];
};

export function canonicalMovieId(movie: Movie): CanonicalMovieId {
  return movie.canonical_movie_id;
}

export function movieRoute(movie: Movie): string {
  const routeKey =
    movie.movie_identity?.route.route_key ??
    movie.canonical_movie_id ??
    (movie.tmdb_id == null ? "" : String(movie.tmdb_id));
  return `/movie/${encodeURIComponent(routeKey)}`;
}

export function movieApiPath(routeKey: string): string {
  const decoded = decodeURIComponent(routeKey);
  const domain = decoded.toUpperCase().startsWith("HIST:") ? "historical" : "current";
  return `/api/v4/${domain}/${encodeURIComponent(decoded)}`;
}

export type SearchEntity = {
  key: string;
  name: string;
  matched: string;
  usage_count?: number;
};

export type SearchResponse = {
  query: string;
  total: number;
  limit: number;
  offset: number;
  items: Movie[];
  domain?: "current" | "historical";
};

export { normalizePosterUrl };

export async function apiFetch<T>(path: string, timeoutMs = 15000): Promise<T> {
  if (!API_BASE) {
    throw new Error("NEXT_PUBLIC_FLIXYFY_API_URL is required for production API requests");
  }
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Request failed: ${response.status}`);
    }
    return (await response.json()) as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Request timed out");
    }
    throw error;
  } finally {
    window.clearTimeout(timeout);
  }
}
