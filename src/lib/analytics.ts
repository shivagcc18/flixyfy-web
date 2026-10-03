export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() || "G-ECV07D8CMX";

export type SearchAnalyticsContext = {
  resultCount?: number;
  searchSource?: string;
  languageFilter?: string;
  yearFilter?: string;
  providerFilter?: string;
};

export type MovieAnalyticsContext = {
  canonicalMovieId: string;
  tmdbId?: number | null;
  movieLanguage?: string | null;
  releaseYear?: number | string | null;
  sourceContext?: string;
};

// eslint-disable-next-line no-unused-vars
type Gtag = (...args: unknown[]) => void;

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    dataLayer?: unknown[][];
    gtag?: Gtag;
    __flixyfyGaInitialized?: boolean;
    __flixyfyAnalyticsEvents?: Set<string>;
  }
}

const REDACTED = "[redacted]";
const EMAIL_PATTERN = /\b[^\s@]+@[^\s@]+\.[^\s@]+\b/i;
const PHONE_PATTERN = /(?:^|\D)(?:\+?\d[\d\s().-]{6,}\d)(?:$|\D)/;

export function sanitizeSearchTerm(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  if (!normalized) return undefined;
  if (normalized.length > 100 || EMAIL_PATTERN.test(normalized) || PHONE_PATTERN.test(normalized)) {
    return REDACTED;
  }
  return normalized;
}

function safeValue(value: unknown, maxLength = 100): string | undefined {
  if (typeof value !== "string" && typeof value !== "number") return undefined;
  const text = String(value).trim();
  if (!text) return undefined;
  return text.length > maxLength ? text.slice(0, maxLength) : text;
}

function emit(eventName: string, parameters: Record<string, unknown> = {}): void {
  if (typeof window === "undefined" || typeof window.gtag !== "function") return;
  try {
    window.gtag("event", eventName, parameters);
  } catch {
    // Analytics must never interrupt a product action.
  }
}

export function initAnalytics(): void {
  if (typeof window === "undefined" || !GA_MEASUREMENT_ID || window.__flixyfyGaInitialized) return;
  try {
    window.dataLayer = window.dataLayer ?? [];
    window.gtag = window.gtag ?? function gtag(...args: unknown[]) {
      window.dataLayer?.push(args);
    };
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID, {
      send_page_view: false,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });

    if (!document.querySelector(`script[data-flixyfy-ga="${GA_MEASUREMENT_ID}"]`)) {
      const script = document.createElement("script");
      script.async = true;
      script.dataset.flixyfyGa = GA_MEASUREMENT_ID;
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
      document.head.appendChild(script);
    }
    window.__flixyfyGaInitialized = true;
  } catch {
    // A blocked tag must not interfere with the page.
  }
}

export function trackPageView(pathname: string): void {
  // Intentionally omit query strings: search URLs can contain user-entered text.
  emit("page_view", { page_path: pathname || "/" });
}

export function trackSearch(searchTerm: unknown, context: SearchAnalyticsContext = {}): void {
  const term = sanitizeSearchTerm(searchTerm);
  if (!term) return;
  emit("search", {
    search_term: term,
    ...(Number.isFinite(context.resultCount) ? { result_count: context.resultCount } : {}),
    ...(safeValue(context.searchSource) ? { search_source: safeValue(context.searchSource) } : {}),
    ...(safeValue(context.languageFilter) ? { language_filter: safeValue(context.languageFilter) } : {}),
    ...(safeValue(context.yearFilter) ? { year_filter: safeValue(context.yearFilter) } : {}),
    ...(safeValue(context.providerFilter) ? { provider_filter: safeValue(context.providerFilter) } : {}),
  });
}

export function trackNoResultSearch(searchTerm: unknown, context: Omit<SearchAnalyticsContext, "resultCount"> = {}): void {
  const term = sanitizeSearchTerm(searchTerm);
  if (!term) return;
  emit("no_result_search", {
    search_term: term,
    ...(safeValue(context.searchSource) ? { search_source: safeValue(context.searchSource) } : {}),
    ...(safeValue(context.languageFilter) ? { language_filter: safeValue(context.languageFilter) } : {}),
    ...(safeValue(context.yearFilter) ? { year_filter: safeValue(context.yearFilter) } : {}),
    ...(safeValue(context.providerFilter) ? { provider_filter: safeValue(context.providerFilter) } : {}),
  });
}

/** Emit one search result pair per logical request, including across effect replay. */
export function trackSearchResultsOnce(
  seen: Set<string>,
  requestKey: string,
  searchTerm: unknown,
  resultCount: number,
  context: Omit<SearchAnalyticsContext, "resultCount"> = {},
): void {
  if (!sanitizeSearchTerm(searchTerm)) return;
  const eventKey = hashEventKey(requestKey);
  if (claimEvent(seen, eventKey)) trackSearch(searchTerm, { ...context, resultCount });
  if (resultCount === 0 && claimEvent(seen, `${eventKey}:none`)) {
    trackNoResultSearch(searchTerm, context);
  }
}

/** Track only a real filter change, not a rerender or a repeated selected value. */
export function trackFilterChange(
  currentValue: string,
  nextValue: string,
  filterType: string,
  surface = "search",
): boolean {
  if (currentValue === nextValue) return false;
  trackFilterApplied(filterType, nextValue || "all", surface);
  return true;
}

export function trackMovieOpened(movie: MovieAnalyticsContext): void {
  emit("movie_opened", {
    canonical_movie_id: safeValue(movie.canonicalMovieId),
    ...(Number.isFinite(movie.tmdbId) ? { tmdb_id: movie.tmdbId } : {}),
    ...(safeValue(movie.movieLanguage) ? { movie_language: safeValue(movie.movieLanguage) } : {}),
    ...(safeValue(movie.releaseYear) ? { release_year: safeValue(movie.releaseYear) } : {}),
    source_context: safeValue(movie.sourceContext) ?? "unknown",
  });
}

export function trackProviderClicked(
  movie: MovieAnalyticsContext,
  providerName: string,
  providerType: string,
  routingType: string,
): void {
  emit("provider_clicked", {
    canonical_movie_id: safeValue(movie.canonicalMovieId),
    ...(Number.isFinite(movie.tmdbId) ? { tmdb_id: movie.tmdbId } : {}),
    provider_name: safeValue(providerName),
    provider_type: safeValue(providerType),
    routing_type: safeValue(routingType),
    source_context: safeValue(movie.sourceContext) ?? "movie_detail",
  });
}

export function trackYoutubeClicked(movie: MovieAnalyticsContext, videoRank: number): void {
  emit("youtube_clicked", {
    canonical_movie_id: safeValue(movie.canonicalMovieId),
    ...(Number.isFinite(movie.tmdbId) ? { tmdb_id: movie.tmdbId } : {}),
    video_rank: videoRank,
    ...(safeValue(movie.movieLanguage) ? { movie_language: safeValue(movie.movieLanguage) } : {}),
    source_context: safeValue(movie.sourceContext) ?? "movie_detail",
  });
}

export function trackLoadMore(surface: string, loadedBefore: number, loadedAfter: number, filterContext: Record<string, string>): void {
  const safeFilterContext = Object.fromEntries(
    Object.entries(filterContext).slice(0, 8).map(([key, value]) => [safeValue(key) ?? "filter", safeValue(value) ?? ""]),
  );
  emit("load_more_clicked", {
    surface: safeValue(surface),
    loaded_before: loadedBefore,
    loaded_after: loadedAfter,
    filter_context: JSON.stringify(safeFilterContext),
  });
}

export function trackFilterApplied(filterType: string, filterValue: string, surface = "search"): void {
  emit("filter_applied", {
    filter_type: safeValue(filterType),
    filter_value: safeValue(filterValue),
    surface: safeValue(surface),
  });
}

export function trackPersonResultOpened(personId: string, sourceContext = "search_disambiguation"): void {
  emit("person_result_opened", {
    person_id: safeValue(personId),
    source_context: safeValue(sourceContext),
  });
}

export function trackOnce(key: string, callback: () => void): void {
  if (typeof window === "undefined") return;
  const events = (window.__flixyfyAnalyticsEvents ??= new Set<string>());
  if (events.has(key)) return;
  events.add(key);
  if (events.size > 300) {
    const oldest = events.values().next().value;
    if (oldest) events.delete(oldest);
  }
  callback();
}

export function claimEvent(seen: Set<string>, key: string): boolean {
  if (seen.has(key)) return false;
  seen.add(key);
  return true;
}

export function hashEventKey(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
