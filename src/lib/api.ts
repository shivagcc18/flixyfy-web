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

  return `/movie/${encodeURIComponent(routeKey)}?domain=${movie.domain}`;
}

export function movieApiPath(
  routeKey: string,
  domain: Movie["domain"] = "current",
): string {
  const decoded = decodeURIComponent(routeKey);
  return `/api/v4/${domain}/${encodeURIComponent(decoded)}`;
}

export type SearchEntity = {
  key: string;
  name: string;
  matched: string;
  usage_count?: number;
};

export type PersonSearchEntity = {
  entity_type: "person";
  person_id: string;
  display_name: string;
  aliases: string[];
  disambiguation?: string;
  roles?: string[];
};

export type PersonEntityResponse = {
  query: string;
  entity_type: string;
  total: number;
  limit: number;
  items?: PersonSearchEntity[];
  entities?: PersonSearchEntity[];
};

export type IntelligenceMovie = {
  canonical_movie_id: CanonicalMovieId;
  tmdb_id: number | null;
  imdb_id?: string | null;
  title: string;
  original_title?: string | null;
  release_year?: number | null;
  domain: "current" | "historical";
  original_language?: string | null;
  poster?: string | null;
  backdrop?: string | null;
  rating?: number | null;
  providers?: string;
  provider_keys?: string;
  provider_count?: number;
  youtube_count?: number;
  availability_count?: number;
};

export type PersonIntelligenceResponse = {
  items?: IntelligenceMovie[];
  results?: IntelligenceMovie[];
  movies?: IntelligenceMovie[];
  total: number;
  page?: number;
  limit: number;
};

export function intelligenceMovieToMovie(item: IntelligenceMovie): Movie {
  const providerNames = (item.providers ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  const providerKeys = (item.provider_keys ?? "").split(",").map((value) => value.trim()).filter(Boolean);
  const providers = providerNames.map((provider_name, index) => ({
    provider_key: providerKeys[index] ?? provider_name.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
    provider_name,
    availability_type: "stream",
    button_url: null,
    button_label: `View on ${provider_name}`,
    navigation_kind: "UNAVAILABLE" as const,
  }));

  return {
    canonical_movie_id: item.canonical_movie_id,
    tmdb_id: item.tmdb_id,
    imdb_id: item.imdb_id,
    title: item.title,
    original_title: item.original_title,
    release_year: item.release_year,
    domain: item.domain,
    original_language: item.original_language,
    poster_url: normalizePosterUrl(item.poster) || null,
    backdrop_url: normalizeBackdropUrl(item.backdrop) || null,
    tmdb_rating: item.rating,
    provider_count: item.provider_count || providers.length,
    youtube_video_count: item.youtube_count,
    availability_count: item.availability_count,
    providers,
  };
}
export type SearchResponse = {
  query: string;
  normalized_query: string;
  residual_query: string;
  intent_summary: string;
  entities: {
    providers: SearchEntity[];
    languages: SearchEntity[];
    genres: SearchEntity[];
    people: SearchEntity[];
    years: SearchEntity[];
  };
  total: number;
  limit: number;
  offset: number;
  items: Movie[];
  facets: {
    providers: { name: string; count: number }[];
    languages: { name: string; count: number }[];
    years: { name: string; count: number }[];
  };
};

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

const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p";

export function normalizeTmdbImageUrl(
  src: string | null | undefined,
  size: "w500" | "w1280" = "w500",
): string {
  const value = src?.trim();

  if (!value) return "";

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  // Preserve an API value that already contains the TMDB image path prefix.
  if (value.startsWith("/t/p/")) {
    return `https://image.tmdb.org${value}`;
  }

  const path = value.startsWith("/") ? value : `/${value}`;

  return `${TMDB_IMAGE_BASE}/${size}${path}`;
}

export function normalizePosterUrl(
  src: string | null | undefined,
): string {
  return normalizeTmdbImageUrl(src, "w500");
}

export function normalizeBackdropUrl(
  src: string | null | undefined,
): string {
  return normalizeTmdbImageUrl(src, "w1280");
}
