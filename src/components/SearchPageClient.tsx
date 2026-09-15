"use client";

import { useEffect, useMemo, useState } from "react";
import { RotateCcw, SearchX, SlidersHorizontal, Sparkles, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  apiFetch,
  intelligenceMovieToMovie,
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
  const safeParams = params ?? new URLSearchParams();
  const paramsKey = safeParams.toString();

  const query = safeParams.get("q") ?? "";
  const language = safeParams.get("language") ?? "";
  const year = safeParams.get("year") ?? safeParams.get("year_from") ?? "";
  const genre = safeParams.get("genre") ?? "";
  const provider = safeParams.get("provider") ?? "";
  const personId = safeParams.get("person_id") ?? "";
  const sort = safeParams.get("sort") === "popular" ? "popular" : "relevance";

  const [result, setResult] = useState<{
    key: string;
    data: SearchResponse | null;
    error: string;
  }>({ key: "", data: null, error: "" });
  const [providers, setProviders] = useState<ProviderFilter[]>([]);
  const [people, setPeople] = useState<PersonSearchEntity[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const hasFilters = Boolean(language || year || genre || provider || sort !== "relevance");
  const shouldSearch = Boolean(query.trim() || hasFilters || personId);
  const requestKey = [query.trim(), personId, language, year, genre, provider, sort].join("\u0001");
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

    async function search() {
      try {
        const filterParams = new URLSearchParams();
        filterParams.set("limit", "48");
        if (provider) filterParams.set("provider", provider);
        if (language) filterParams.set("language", language);
        if (genre) filterParams.set("genre", genre);
        if (year) {
          filterParams.set("year_from", year);
          filterParams.set("year_to", year);
        }
        if (sort === "popular") filterParams.set("sort", sort);

        let selectedPerson: PersonSearchEntity | null = null;
        if (query.trim()) {
          try {
            const rawPersonQuery = query.trim().replace(/\s+/g, " ");
            const personLookupQuery =
              rawPersonQuery
                .replace(/^(?:movies?|films?)\s+(?:of|by|with)\s+/i, "")
                .replace(/\s+(?:movies?|films?|filmography)\s*$/i, "")
                .trim() || rawPersonQuery;

            const entityResponse = await apiFetch<PersonEntityResponse>(
              `/api/v1/search/entities?q=${encodeURIComponent(personLookupQuery)}`,
            );
            if (!active) return;
            const candidates = entityResponse.items ?? entityResponse.entities ?? [];
            selectedPerson = personId
              ? candidates.find((person) => person.person_id === personId) ?? null
              : null;

            if (!selectedPerson && !personId) {
              const resolution = resolvePersonQuery(personLookupQuery, candidates);
              if (resolution.kind === "person") selectedPerson = resolution.person;
              if (resolution.kind === "choices") {
                setPeople(resolution.people);
                setResult({ key: requestKey, data: null, error: "" });
                return;
              }
            }
          } catch {
            // Entity resolution is an enhancement; ordinary movie search remains available.
          }
        }

        const providerName = provider === "youtube"
          ? "YouTube"
          : providers.find((item) => item.provider_key === provider)?.provider_name ?? provider;

        if (selectedPerson) {
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
          setPeople([]);
          setResult({ key: requestKey, error: "", data });
          return;
        }

        const movieParams = new URLSearchParams(filterParams);
        if (query.trim()) movieParams.set("q", query.trim());
        if (query.trim() && sort === "relevance") movieParams.set("sort", sort);
        const path = query.trim()
          ? `/api/v4/search?${movieParams.toString()}`
          : `/api/v4/movies?${movieParams.toString()}`;
        const response = await apiFetch<MovieListResponse>(path);
        if (!active) return;
        const items = response.items ?? response.results ?? [];
        const limit = response.limit || 48;
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
  }, [query, personId, provider, language, genre, year, sort, shouldSearch, requestKey, providers]);

  function setFilter(name: string, value: string) {
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
    const next = new URLSearchParams(paramsKey);
    next.set("person_id", person.person_id);
    router.push(`${pathname ?? "/search"}?${next.toString()}`);
  }

  function resetFilters() {
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


