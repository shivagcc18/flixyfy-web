"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, SearchX, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { apiFetch, type Movie, type SearchEntity, type SearchResponse } from "@/lib/api";
import AppShell from "./AppShell";
import MovieCard from "./MovieCard";
import SearchInput from "./SearchInput";

type ProviderFilter = {
  provider_key: string;
  provider_name: string;
};

type MovieListResponse = {
  items?: Movie[];
  results?: Movie[];
  total: number;
  page?: number;
  limit: number;
};

const languageOptions = [
  { value: "", label: "Any language" },
  { value: "hi", label: "Hindi" },
  { value: "te", label: "Telugu" },
  { value: "ta", label: "Tamil" },
  { value: "ml", label: "Malayalam" },
  { value: "kn", label: "Kannada" },
  { value: "bn", label: "Bengali" },
  { value: "mr", label: "Marathi" },
];

const genreOptions = [
  "",
  "Action",
  "Comedy",
  "Drama",
  "Romance",
  "Thriller",
  "Crime",
  "Family",
  "History",
  "Horror",
].map((value) => ({ value, label: value || "Any genre" }));

const sortOptions = [
  { value: "relevance", label: "Relevance" },
  { value: "popular", label: "Popularity" },
];

const currentYear = new Date().getFullYear();
const yearOptions = [
  { value: "", label: "Any year" },
  ...Array.from({ length: currentYear - 1949 }, (_, index) => {
    const value = String(currentYear - index);
    return { value, label: value };
  }),
];

function emptyEntities(): SearchResponse["entities"] {
  return { providers: [], languages: [], genres: [], people: [], years: [] };
}

function entityFromValue(key: string, name: string): SearchEntity {
  return { key, name, matched: name };
}

function moviesToSearchResponse({
  items,
  total,
  limit,
  offset,
  query,
  provider,
  providerName,
  language,
  genre,
  year,
}: {
  items: Movie[];
  total: number;
  limit: number;
  offset: number;
  query: string;
  provider: string;
  providerName: string;
  language: string;
  genre: string;
  year: string;
}): SearchResponse {
  const languageName = languageOptions.find((item) => item.value === language)?.label;
  return {
    query,
    normalized_query: query.trim().toLowerCase(),
    residual_query: query.trim(),
    intent_summary: "Movie discovery",
    entities: {
      ...emptyEntities(),
      providers: provider ? [entityFromValue(provider, providerName || provider)] : [],
      languages: language && languageName ? [entityFromValue(language, languageName)] : [],
      genres: genre ? [entityFromValue(genre, genre)] : [],
      years: year ? [entityFromValue(year, year)] : [],
    },
    total,
    limit,
    offset,
    items,
    facets: { providers: [], languages: [], years: [] },
  };
}

export default function SearchPageClient() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const safeParams = params ?? new URLSearchParams();`r`n  const safeParams = params ?? new URLSearchParams();`r`n  const paramsKey = safeParams.toString();

  const query = safesafeParams.get("q") ?? "";
  const language = safesafeParams.get("language") ?? "";
  const year = safeParams.get("year") ?? safeParams.get("year_from") ?? "";
  const genre = safeParams.get("genre") ?? "";
  const provider = safeParams.get("provider") ?? "";
  const sort = safeParams.get("sort") === "popular" ? "popular" : "relevance";

  const [result, setResult] = useState<{
    key: string;
    data: SearchResponse | null;
    error: string;
  }>({ key: "", data: null, error: "" });
  const [providers, setProviders] = useState<ProviderFilter[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasFilters = Boolean(language || year || genre || provider || sort !== "relevance");
  const shouldSearch = Boolean(query.trim() || hasFilters);
  const requestKey = [query.trim(), language, year, genre, provider, sort].join("\u0001");
  const data = result.key === requestKey ? result.data : null;
  const error = result.key === requestKey ? result.error : "";
  const loading = shouldSearch && result.key !== requestKey;

  useEffect(() => {
    let active = true;
    apiFetch<{ items?: ProviderFilter[] }>("/api/v4/providers")
      .then((response) => {
        if (active) setProviders(response.items ?? []);
      })
      .catch(() => {
        if (active) setProviders([]);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    if (!shouldSearch) {
      return () => {
        active = false;
      };
    }

    const apiParams = new URLSearchParams();
    apiParams.set("limit", "48");
    if (query.trim()) apiParams.set("q", query.trim());
    if (provider) apiParams.set("provider", provider);
    if (language) apiParams.set("language", language);
    if (genre) apiParams.set("genre", genre);
    if (year) {
      apiParams.set("year_from", year);
      apiParams.set("year_to", year);
    }
    if (query.trim() || sort === "popular") apiParams.set("sort", sort);

    const path = query.trim()
      ? `/api/v4/search?${apiParams.toString()}`
      : `/api/v4/movies?${apiParams.toString()}`;

    apiFetch<MovieListResponse>(path)
      .then((response) => {
        if (!active) return;
        const items = response.items ?? response.results ?? [];
        const limit = response.limit || 48;
        const page = response.page || 1;
        const providerName =
          provider === "youtube"
            ? "YouTube"
            : providers.find((item) => item.provider_key === provider)?.provider_name ?? provider;

        setResult({
          key: requestKey,
          error: "",
          data: moviesToSearchResponse({
            items,
            total: response.total,
            limit,
            offset: (page - 1) * limit,
            query,
            provider,
            providerName,
            language,
            genre,
            year,
          }),
        });
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setResult({
          key: requestKey,
          data: null,
          error: reason instanceof Error ? reason.message : "Search failed",
        });
      });

    return () => {
      active = false;
    };
  }, [query, provider, language, genre, year, sort, shouldSearch, requestKey, providers]);

  function setFilter(name: string, value: string) {
    const next = new URLSearchParams(paramsKey);
    if (value) next.set(name, value);
    else next.delete(name);

    if (name === "year") {
      next.delete("year_from");
      next.delete("year_to");
    }

    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function resetFilters() {
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query.trim());
    router.push(next.toString() ? `${pathname}?${next.toString()}` : pathname);
  }

  const chips = useMemo(() => {
    if (!data) return [];
    return [
      ...data.entities.people.map((item) => ({ ...item, type: "Person" })),
      ...data.entities.providers.map((item) => ({ ...item, type: "Provider" })),
      ...data.entities.languages.map((item) => ({ ...item, type: "Language" })),
      ...data.entities.genres.map((item) => ({ ...item, type: "Genre" })),
      ...data.entities.years.map((item) => ({ ...item, type: "Year" })),
    ];
  }, [data]);

  const activeFilters = useMemo(() => {
    const providerName =
      provider === "youtube"
        ? "YouTube"
        : providers.find((item) => item.provider_key === provider)?.provider_name ?? provider;

    return [
      language ? { key: "language", label: languageOptions.find((item) => item.value === language)?.label ?? language } : null,
      year ? { key: "year", label: year } : null,
      genre ? { key: "genre", label: genre } : null,
      provider ? { key: "provider", label: providerName } : null,
      sort !== "relevance" ? { key: "sort", label: "Popularity" } : null,
    ].filter((item): item is { key: string; label: string } => Boolean(item));
  }, [language, year, genre, provider, sort, providers]);

  return (
    <AppShell>
      <main className="page-content search-page">
        <section className="search-header">
          <small>SEARCH</small>
          <h1>Find exactly what you want to watch</h1>
          <p className="page-lead">Search by movie, actor, director, language, genre, year or provider.</p>
          <SearchInput initialValue={query} large key={query} />
        </section>

        <section className="search-tools" aria-label="Search tools">
          <div className="search-tools-top">
            <button
              type="button"
              className="mobile-filter-trigger"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((current) => !current)}
            >
              <SlidersHorizontal size={17} aria-hidden="true" />
              Filters{activeFilters.length ? ` (${activeFilters.length})` : ""}
            </button>

            {activeFilters.length ? (
              <div className="active-filter-chips" aria-label="Active filters">
                {activeFilters.map((item) => (
                  <button type="button" onClick={() => setFilter(item.key, "")} key={`${item.key}-${item.label}`}>
                    {item.label}<X size={13} aria-hidden="true" />
                  </button>
                ))}
              </div>
            ) : (
              <span className="filter-hint">Combine language, year, provider and genre.</span>
            )}
          </div>

          <div className={`filter-bar${filtersOpen ? " open" : ""}`}>
            <label>
              <span>Language</span>
              <select value={language} onChange={(event) => setFilter("language", event.target.value)}>
                {languageOptions.map((item) => (
                  <option value={item.value} key={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Year</span>
              <select value={year} onChange={(event) => setFilter("year", event.target.value)}>
                {yearOptions.map((item) => (
                  <option value={item.value} key={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Genre</span>
              <select value={genre} onChange={(event) => setFilter("genre", event.target.value)}>
                {genreOptions.map((item) => (
                  <option value={item.value} key={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Provider</span>
              <select value={provider} onChange={(event) => setFilter("provider", event.target.value)}>
                <option value="">Any provider</option>
                <option value="youtube">YouTube</option>
                {providers.map((item) => (
                  <option value={item.provider_key} key={item.provider_key}>{item.provider_name}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Sort</span>
              <select value={sort} onChange={(event) => setFilter("sort", event.target.value)}>
                {sortOptions.map((item) => (
                  <option value={item.value} key={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <button className="reset-filter" type="button" onClick={resetFilters} disabled={!hasFilters}>
              <RotateCcw size={15} aria-hidden="true" />
              Reset
            </button>
          </div>
        </section>

        {!query && !hasFilters ? (
          <section className="search-empty">
            <Sparkles size={34} aria-hidden="true" />
            <h2>Try a natural search</h2>
            <p>NTR movies on Netflix, Telugu action movies, RRR, or Hindi movies from 2022.</p>
          </section>
        ) : null}

        {error ? (
          <section className="error-panel">
            <h2>Search failed</h2>
            <p>{error}</p>
          </section>
        ) : null}

        {loading && !data && !error ? (
          <div className="skeleton-grid" aria-label="Loading search results" aria-busy="true">
            {Array.from({ length: 12 }, (_, index) => <span key={index} />)}
          </div>
        ) : null}

        {data ? (
          <>
            {chips.length ? (
              <section className="intelligence-panel">
                <div className="intelligence-title">
                  <Sparkles size={18} aria-hidden="true" />
                  <div><span>UNDERSTOOD</span><strong>{data.intent_summary}</strong></div>
                </div>
                <div className="entity-chips">
                  {chips.map((item) => (
                    <span key={`${item.type}-${item.key}`}><small>{item.type}</small>{item.name}</span>
                  ))}
                </div>
              </section>
            ) : null}

            <div className="results-toolbar">
              <div>
                <small>RESULTS</small>
                <h2>{data.total.toLocaleString()} movies</h2>
              </div>
            </div>

            {data.items.length ? (
              <div className="movie-grid search-results">
                {data.items.map((movie) => (
                  <MovieCard movie={movie} key={movie.canonical_movie_id} />
                ))}
              </div>
            ) : (
              <section className="search-empty">
                <SearchX size={36} aria-hidden="true" />
                <h2>No matching movie found</h2>
                <p>Remove one filter or try a shorter movie or person name.</p>
              </section>
            )}
          </>
        ) : null}
      </main>
    </AppShell>
  );
}


