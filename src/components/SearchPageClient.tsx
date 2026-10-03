"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { RotateCcw, SearchX, SlidersHorizontal, Sparkles, UserRound, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  apiFetch,
  intelligenceMovieToMovie,
  normalizeBackdropUrl,
  normalizePosterUrl,
  type Movie,
  type PersonEntityResponse,
  type PersonIntelligenceResponse,
  type PersonSearchEntity,
  type SearchEntity,
  type SearchResponse,
} from "@/lib/api";
import { resolvePersonQuery } from "@/lib/person-search";
import AppShell from "./AppShell";
import MovieCard from "./MovieCard";
import SearchInput from "./SearchInput";
import { trackFilterApplied, trackFilterChange, trackLoadMore, trackPersonResultOpened, trackSearchResultsOnce } from "@/lib/analytics";

type ProviderFilter = {
  provider_key: string;
  provider_name: string;
};

type MovieListResponse = {
  items?: ApiMovie[];
  results?: ApiMovie[];
  total: number;
  page?: number;
  limit: number;
  person_resolution?: {
    resolved_person_ids?: string[];
    resolved_person_names?: string[];
    ambiguous?: boolean;
  } | null;
};

type ApiMovie = Movie & { poster?: string | null; backdrop?: string | null };

function normalizeSearchMovie(movie: ApiMovie): Movie {
  return {
    ...movie,
    poster_url: normalizePosterUrl(movie.poster ?? movie.poster_url) || null,
    backdrop_url: normalizeBackdropUrl(movie.backdrop ?? movie.backdrop_url) || null,
  };
}

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
  { value: "newest", label: "Newest" },
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
  const safeParams = params ?? new URLSearchParams();
  const paramsKey = safeParams.toString();

  const query = safeParams.get("q") ?? "";
  const language = safeParams.get("language") ?? "";
  const year = safeParams.get("year") ?? safeParams.get("year_from") ?? "";
  const genre = safeParams.get("genre") ?? "";
  const provider = safeParams.get("provider") ?? "";
  const personId = safeParams.get("person_id") ?? "";
  const rawSort = safeParams.get("sort");
  const sort = rawSort === "popular" || rawSort === "newest" || rawSort === "relevance"
    ? rawSort
    : query.trim() ? "relevance" : "newest";

  const [result, setResult] = useState<{
    key: string;
    data: SearchResponse | null;
    error: string;
  }>({ key: "", data: null, error: "" });
  const [providers, setProviders] = useState<ProviderFilter[]>([]);
  const providersRef = useRef<ProviderFilter[]>([]);
  const [people, setPeople] = useState<PersonSearchEntity[]>([]);
  const [filmographyExhausted, setFilmographyExhausted] = useState(false);
  const [filmographyPaginationLimited, setFilmographyPaginationLimited] = useState(false);
  const [searchRetry, setSearchRetry] = useState(0);
  const [filmographyPerson, setFilmographyPerson] = useState<{ key: string; name: string; roles: string[] } | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const trackedSearchKeys = useRef(new Set<string>());

  const hasFilters = Boolean(language || year || genre || provider || (safeParams.has("sort") && sort !== "relevance"));
  const shouldSearch = Boolean(query.trim() || hasFilters || personId);
  const requestKey = [query.trim(), personId, language, year, genre, provider, sort].join("\u0001");
  const data = result.key === requestKey ? result.data : null;
  const error = result.key === requestKey ? result.error : "";
  const loading = shouldSearch && result.key !== requestKey;

  useEffect(() => {
    let active = true;
    apiFetch<{ items?: ProviderFilter[] }>("/api/v4/providers")
      .then((response) => {
        if (active) {
          providersRef.current = response.items ?? [];
          setProviders(providersRef.current);
        }
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

    async function search() {
      const recordSearch = (resultCount: number) => {
        trackSearchResultsOnce(trackedSearchKeys.current, requestKey, query, resultCount, {
          searchSource: personId ? "person_search" : "search_page",
          languageFilter: language,
          yearFilter: year,
          providerFilter: provider,
        });
      };
      try {
        const filterParams = new URLSearchParams();
        filterParams.set("limit", personId ? "100" : "48");
        if (provider) filterParams.set("provider", provider);
        if (language) filterParams.set("language", language);
        if (genre) filterParams.set("genre", genre);
        if (year) {
          filterParams.set("year_from", year);
          filterParams.set("year_to", year);
        }
        if (sort !== "relevance") filterParams.set("sort", sort);

        const movieParams = new URLSearchParams(filterParams);
        if (query.trim()) movieParams.set("q", query.trim());
        if (query.trim() && sort === "relevance") movieParams.set("sort", sort);
        const moviePath = query.trim()
          ? `/api/v4/search?${movieParams.toString()}`
          : `/api/v4/movies?${movieParams.toString()}`;

        let selectedPerson: PersonSearchEntity | null = null;
        let movieResponse: MovieListResponse | null = null;
        if (personId) {
          // A supplied stable ID is authoritative. The query text is a display label only.
          selectedPerson = {
            entity_type: "person",
            person_id: personId,
            display_name: query.trim() || `Person ${personId}`,
            aliases: [],
          };
        } else {
          movieResponse = await apiFetch<MovieListResponse>(moviePath);
          if (!active) return;
          const personResolution = movieResponse.person_resolution;
          const personIds = personResolution?.resolved_person_ids ?? [];
          const personNames = personResolution?.resolved_person_names ?? [];
          if (personResolution && !personResolution.ambiguous && personIds.length === 1 && personNames[0]) {
            selectedPerson = {
              entity_type: "person",
              person_id: personIds[0],
              display_name: personNames[0],
              aliases: [],
            };
          } else if (personResolution?.ambiguous) {
            const rawPersonQuery = query.trim().replace(/\s+/g, " ");
            const personLookupQuery = rawPersonQuery
              .replace(/^(?:movies?|films?)\s+(?:of|by|with)\s+/i, "")
              .replace(/\s+(?:movies?|films?|filmography)\s*$/i, "")
              .trim() || rawPersonQuery;
            try {
              const entityResponse = await apiFetch<PersonEntityResponse>(
                `/api/v1/search/entities?q=${encodeURIComponent(personLookupQuery)}`,
              );
              if (!active) return;
              const resolution = resolvePersonQuery(
                personLookupQuery,
                entityResponse.items ?? entityResponse.entities ?? [],
              );
              if (resolution.kind === "person") selectedPerson = resolution.person;
              if (resolution.kind === "choices") {
                setPeople(resolution.people);
                setResult({ key: requestKey, data: null, error: "" });
                return;
              }
            } catch {
              // Ambiguous matches fall back to the ordinary movie results.
            }
          }
        }

        const providerName = provider === "youtube"
          ? "YouTube"
          : providersRef.current.find((item) => item.provider_key === provider)?.provider_name ?? provider;

        if (selectedPerson) {
          setFilmographyPerson({
            key: requestKey,
            name: selectedPerson.display_name,
            roles: selectedPerson.roles ?? [],
          });
          const intelligenceParams = new URLSearchParams(filterParams);
          intelligenceParams.set("person_id", selectedPerson.person_id);
          const response = await apiFetch<PersonIntelligenceResponse>(
            `/api/v1/search/intelligence?${intelligenceParams.toString()}`,
          );
          if (!active) return;
          const items = (response.items ?? response.results ?? response.movies ?? []).map(intelligenceMovieToMovie);
          const data = moviesToSearchResponse({
            items,
            total: response.total ?? items.length,
            limit: response.limit || 48,
            offset: ((response.page || 1) - 1) * (response.limit || 48),
            query,
            provider,
            providerName,
            language,
            genre,
            year,
          });
          data.intent_summary = `Filmography for ${selectedPerson.display_name}`;
          data.entities.people = [entityFromValue(selectedPerson.person_id, selectedPerson.display_name)];
          setFilmographyExhausted(items.length < (response.limit || 100));
          setFilmographyPaginationLimited(false);
          recordSearch(data.total);
          setPeople([]);
          setResult({ key: requestKey, error: "", data });
          return;
        }

        const response = movieResponse ?? await apiFetch<MovieListResponse>(moviePath);
        if (!active) return;
        setFilmographyPerson(null);
        const items = (response.items ?? response.results ?? []).map(normalizeSearchMovie);
        const limit = response.limit || 48;
        recordSearch(response.total);
        setPeople([]);
        setResult({
          key: requestKey,
          error: "",
          data: moviesToSearchResponse({
            items,
            total: response.total,
            limit,
            offset: ((response.page || 1) - 1) * limit,
            query,
            provider,
            providerName,
            language,
            genre,
            year,
          }),
        });
      } catch (reason: unknown) {
        if (!active) return;
        setPeople([]);
        setResult({
          key: requestKey,
          data: null,
          error: reason instanceof Error ? reason.message : "Search failed",
        });
      }
    }

    void search();
    return () => {
      active = false;
    };
  }, [query, personId, provider, language, genre, year, sort, shouldSearch, requestKey, searchRetry]);

  async function loadMore() {
    if (!data || loadingMore || (data.items.length >= data.total && (!personId || filmographyExhausted))) return;
    setLoadingMore(true);
    try {
      const page = Math.floor(data.offset / data.limit) + 2;
      const nextParams = new URLSearchParams();
      nextParams.set("page", String(page));
      nextParams.set("limit", String(data.limit));
      if (provider) nextParams.set("provider", provider);
      if (language) nextParams.set("language", language);
      if (genre) nextParams.set("genre", genre);
      if (year) {
        nextParams.set("year_from", year);
        nextParams.set("year_to", year);
      }
      if (sort !== "relevance") nextParams.set("sort", sort);

      let nextMovies: Movie[];
      let nextTotal = data.total;
      const selectedPersonId = personId || data.entities.people[0]?.key;
      if (query.trim() && !selectedPersonId) nextParams.set("q", query.trim());
      const loadedBefore = data.items.length;
      if (selectedPersonId) {
        const personParams = new URLSearchParams(nextParams);
        personParams.set("person_id", selectedPersonId);
        const response = await apiFetch<PersonIntelligenceResponse>(`/api/v1/search/intelligence?${personParams.toString()}`);
        nextMovies = (response.items ?? response.results ?? response.movies ?? []).map(intelligenceMovieToMovie);
        nextTotal = response.total ?? nextTotal;
        setFilmographyExhausted(nextMovies.length < (response.limit || data.limit));
        setFilmographyPaginationLimited(nextMovies.length === 0 && data.items.length >= 100);
      } else {
        const endpoint = query.trim() ? "/api/v4/search" : "/api/v4/movies";
        const response = await apiFetch<MovieListResponse>(`${endpoint}?${nextParams.toString()}`);
        nextMovies = (response.items ?? response.results ?? []).map(normalizeSearchMovie);
        nextTotal = response.total ?? nextTotal;
      }
      const currentIds = new Set(data.items.map((movie) => movie.canonical_movie_id));
      const appendedCount = nextMovies.filter((movie) => !currentIds.has(movie.canonical_movie_id)).length;
      trackLoadMore("search", loadedBefore, loadedBefore + appendedCount, {
        language_filter: language || "all",
        year_filter: year || "all",
        provider_filter: provider || "all",
        genre_filter: genre || "all",
      });
      setResult((current) => {
        if (current.key !== requestKey || !current.data) return current;
        const existing = new Set(current.data.items.map((movie) => movie.canonical_movie_id));
        const appended = nextMovies.filter((movie) => !existing.has(movie.canonical_movie_id));
        return {
          ...current,
          data: {
            ...current.data,
            items: [...current.data.items, ...appended],
            total: nextTotal,
            offset: (page - 1) * current.data.limit,
          },
        };
      });
    } catch (reason: unknown) {
      setResult((current) => current.key === requestKey
        ? { ...current, error: reason instanceof Error ? reason.message : "Could not load more results" }
        : current);
    } finally {
      setLoadingMore(false);
    }
  }

  function setFilter(name: string, value: string) {
    const currentValue = name === "year"
      ? safeParams.get("year") ?? safeParams.get("year_from") ?? ""
      : safeParams.get(name) ?? "";
    if (!trackFilterChange(currentValue, value, name === "year" ? "year" : name, "search")) return;
    const next = new URLSearchParams(paramsKey);
    if (value) next.set(name, value);
    else next.delete(name);

    if (name === "year") {
      next.delete("year_from");
      next.delete("year_to");
    }

    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname ?? "/search");
  }

  function choosePerson(person: PersonSearchEntity) {
    trackPersonResultOpened(person.person_id);
    const next = new URLSearchParams(paramsKey);
    next.set("person_id", person.person_id);
    router.push(`${pathname ?? "/search"}?${next.toString()}`);
  }

  function resetFilters() {
    if (hasFilters) trackFilterApplied("reset", "all", "search");
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query.trim());
    if (personId) next.set("person_id", personId);
    router.push(next.toString() ? `${pathname ?? "/search"}?${next.toString()}` : pathname ?? "/search");
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
      safeParams.has("sort") && sort !== "relevance" ? { key: "sort", label: sort === "newest" ? "Newest" : "Popularity" } : null,
    ].filter((item): item is { key: string; label: string } => Boolean(item));
  }, [language, year, genre, provider, sort, providers, safeParams]);

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

        {people.length ? (
          <section className="person-disambiguation" aria-labelledby="person-choice-title">
            <div>
              <small>CHOOSE A PERSON</small>
              <h2 id="person-choice-title">Which person did you mean?</h2>
            </div>
            <div className="person-choices">
              {people.map((person) => (
                <button type="button" key={person.person_id} onClick={() => choosePerson(person)}>
                  <strong>{person.display_name}</strong>
                  {person.disambiguation ? <span>{person.disambiguation}</span> : null}
                </button>
              ))}
            </div>
          </section>
        ) : null}
        {!query && !hasFilters ? (
          <section className="search-empty">
            <Sparkles size={34} aria-hidden="true" />
            <h2>Try a natural search</h2>
            <p>NTR movies on Netflix, Telugu action movies, RRR, or Hindi movies from 2022.</p>
          </section>
        ) : null}

        {error ? (
          <section className="error-panel">
            <h2>{personId ? "Filmography could not be loaded" : "Search failed"}</h2>
            <p>{error}</p>
            {personId ? <button type="button" onClick={() => { setResult({ key: "", data: null, error: "" }); setSearchRetry((value) => value + 1); }}>Try again</button> : null}
          </section>
        ) : null}

        {loading && !data && !error ? (
          <div className="skeleton-grid" aria-label={personId ? "Loading filmography" : "Loading search results"} aria-busy="true">
            {Array.from({ length: 12 }, (_, index) => <span key={index} />)}
          </div>
        ) : null}

        {data ? (
          <>
            {personId ? (
              <section className="people-filmography-hero" aria-labelledby="filmography-person-name">
                <span className="people-filmography-avatar" aria-hidden="true"><UserRound size={38} strokeWidth={1.35} /></span>
                <div>
                  <p>PERSON</p>
                  <h1 id="filmography-person-name">{filmographyPerson?.key === requestKey ? filmographyPerson.name : data.entities.people[0]?.name ?? query}</h1>
                  {filmographyPerson?.key === requestKey && filmographyPerson.roles.length ? <p>{filmographyPerson.roles.join(" · ")}</p> : null}
                </div>
              </section>
            ) : null}
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
                <small>{personId ? "FILMOGRAPHY" : "RESULTS"}</small>
                {personId ? <h2>Filmography</h2> : <h2>{data.total.toLocaleString()} movies</h2>}
                {personId ? <p className="people-filmography-count">{data.items.length.toLocaleString()} movie results returned by the current serving API</p> : null}
                <p className="mt-1 text-sm text-neutral-400">{personId ? `Showing ${data.items.length.toLocaleString()} returned results` : `Showing ${Math.min(data.items.length, data.total).toLocaleString()} of ${data.total.toLocaleString()}`}</p>
                {personId && data.items.length >= 100 && !filmographyExhausted ? <p className="people-filmography-count" role="status">A further page may be available from the serving API.</p> : null}
                {personId && filmographyPaginationLimited ? <p className="people-filmography-count" role="status">The API returned no further page; the full filmography count remains unverified.</p> : null}
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
                <h2>{personId ? "No filmography available" : "No matching movie found"}</h2>
                <p>{personId ? "The current serving API returned no movies for this Person ID." : "Remove one filter or try a shorter movie or person name."}</p>
              </section>
            )}
            {data.items.length < data.total || (personId && data.items.length >= 100 && !filmographyExhausted) ? (
              <div className="mt-6 flex justify-center">
                <button type="button" className="load-more-button rounded-md border border-amber-400 px-5 py-3 text-sm font-semibold text-amber-200 transition hover:bg-amber-300 hover:text-black disabled:opacity-60" onClick={() => void loadMore()} disabled={loadingMore}>
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            ) : data.items.length > 0 ? (
              <p className="mt-6 text-center text-sm text-neutral-400" role="status">You’ve reached the end of the results.</p>
            ) : null}
          </>
        ) : null}
      </main>
    </AppShell>
  );
}


