"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, RotateCcw, SearchX, SlidersHorizontal, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { apiFetch, normalizePosterUrl, type Movie, type SearchResponse } from "@/lib/api";
import { getYearOptions, isYearValidForDomain } from "@/lib/search-helpers";
import { languageName } from "@/lib/languages";
import { parseSearchIntent, serializeSearchParams } from "@/lib/search-interpretation";
import AppShell from "./AppShell";
import MovieCard from "./MovieCard";
import SearchInput from "./SearchInput";

type ProviderFilter = { provider_key: string; provider_name: string };
type MovieListResponse = { items?: Movie[]; results?: Movie[]; total: number; page?: number; limit: number };

const genreQueries = ["Action", "Comedy", "Drama", "Romance", "Thriller", "Family"];

function normalizeResponseMovie(movie: Movie): Movie {
  return { ...movie, poster_url: normalizePosterUrl(movie.poster_url ?? (movie as unknown as { poster?: string }).poster ?? (movie as unknown as { poster_path?: string }).poster_path) };
}

function toResponse(items: Movie[], response: MovieListResponse, query: string, domain: "current" | "historical"): SearchResponse {
  const limit = response.limit || 48;
  const page = response.page || 1;
  return { query, total: response.total, limit, offset: (page - 1) * limit, items: items.map(normalizeResponseMovie), domain };
}

function Chip({ label, onClear }: { label: string; onClear: () => void }) {
  return <button type="button" className="filter-chip" onClick={onClear} aria-label={"Clear " + label}>{label}<X size={12} aria-hidden="true" /></button>;
}

function SearchSkeleton() {
  return <div className="movie-grid search-results" aria-label="Loading results" aria-busy="true">{Array.from({ length: 10 }, (_, index) => <div className="skeleton-card grid-skeleton" key={index}><div className="skeleton-poster" /><div className="skeleton-line long" /><div className="skeleton-line short" /></div>)}</div>;
}

export default function SearchPageClient() {
  const params = useSearchParams();
  const pathname = usePathname() ?? "/search";
  const router = useRouter();
  const paramsKey = params?.toString() ?? "";
  const rawQuery = params?.get("q") ?? "";
  const language = params?.get("language") ?? "";
  const genre = params?.get("genre") ?? "";
  const provider = params?.get("provider") ?? "";
  const contentType = params?.get("content_type") ?? "";
  const domain = params?.get("domain") === "historical" ? "historical" : "current";
  const year = params?.get("year") ?? "";
  const yearFrom = params?.get("year_from") ?? "";
  const yearTo = params?.get("year_to") ?? "";
  const effectiveYear = isYearValidForDomain(year, domain) ? year : "";
  const yearOptions = getYearOptions(domain);
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<ProviderFilter[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [retryKey, setRetryKey] = useState(0);

  const intent = useMemo(() => parseSearchIntent(rawQuery, providers), [rawQuery, providers]);
  const inferredProvider = provider || intent.provider || "";
  const inferredLanguage = language || intent.language || "";
  const inferredGenre = genre || intent.genre || "";
  const interpretedQuery = intent.chips.length ? intent.query : rawQuery;

  useEffect(() => {
    let active = true;
    apiFetch<{ items?: ProviderFilter[] }>("/api/v4/providers")
      .then((response) => { if (active) setProviders(response.items ?? []); })
      .catch(() => { if (active) setProviders([]); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!rawQuery || !providers.length) return;
    const nextValues: Record<string, string | undefined> = {
      q: interpretedQuery,
      provider: provider || intent.provider,
      language: language || intent.language,
      genre: genre || intent.genre,
      domain: domain === "current" ? intent.domain : domain,
      content_type: contentType || intent.contentType,
      year_from: yearFrom || intent.yearFrom,
      year_to: yearTo || intent.yearTo,
      year,
    };
    const next = serializeSearchParams(nextValues);
    if (next !== paramsKey) router.replace(next ? pathname + "?" + next : pathname);
  }, [rawQuery, providers, interpretedQuery, intent, provider, language, genre, domain, contentType, year, yearFrom, yearTo, paramsKey, pathname, router]);

  useEffect(() => {
    if (!year || isYearValidForDomain(year, domain)) return;
    const next = new URLSearchParams(paramsKey);
    next.delete("year");
    next.delete("year_from");
    next.delete("year_to");
    const queryString = next.toString();
    router.replace(queryString ? pathname + "?" + queryString : pathname);
  }, [year, domain, paramsKey, pathname, router]);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setData(null);
      setError("");
      const hasFilters = Boolean(inferredLanguage || effectiveYear || inferredProvider || inferredGenre || contentType || domain !== "current" || yearFrom || yearTo);
      if (!interpretedQuery.trim() && !hasFilters) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const apiParams = new URLSearchParams({ limit: "48", domain });
      if (interpretedQuery.trim()) apiParams.set("q", interpretedQuery.trim());
      if (inferredProvider) apiParams.set("provider", inferredProvider);
      if (inferredLanguage) apiParams.set("language", inferredLanguage);
      if (inferredGenre) apiParams.set("genre", inferredGenre);
      if (effectiveYear) apiParams.set("year", effectiveYear);
      if (yearFrom) apiParams.set("year_from", yearFrom);
      if (yearTo) apiParams.set("year_to", yearTo);
      if (contentType) apiParams.set("content_type", contentType);
      const path = interpretedQuery.trim() ? "/api/v4/search?" + apiParams.toString() : "/api/v4/" + domain + "?" + apiParams.toString();
      apiFetch<MovieListResponse>(path)
        .then((response) => { if (active) setData(toResponse(response.items ?? response.results ?? [], response, interpretedQuery, domain)); })
        .catch((reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Search failed"); })
        .finally(() => { if (active) setLoading(false); });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [interpretedQuery, inferredProvider, inferredLanguage, inferredGenre, effectiveYear, yearFrom, yearTo, contentType, domain, retryKey]);

  function navigate(values: Record<string, string | undefined>) {
    const next = serializeSearchParams(values);
    router.push(next ? pathname + "?" + next : pathname);
  }

  function setFilter(name: string, value: string) {
    const values: Record<string, string | undefined> = {
      q: interpretedQuery || undefined,
      domain,
      language: name === "language" ? value : inferredLanguage,
      genre: name === "genre" ? value : inferredGenre,
      provider: name === "provider" ? value : inferredProvider,
      year: name === "year" ? value : effectiveYear,
      content_type: contentType,
    };
    if (name === "domain") {
      values.domain = value;
      if (value === "historical") values.year = isYearValidForDomain(effectiveYear, "historical") ? effectiveYear : undefined;
      if (value === "current") values.year = isYearValidForDomain(effectiveYear, "current") ? effectiveYear : undefined;
    }
    navigate(values);
  }

  function clearAll() {
    navigate({ q: interpretedQuery || undefined });
  }

  const inferredIntentKeys = new Set(intent.chips.map((chip) => chip.key));
  const activeChips = [
    inferredLanguage && !inferredIntentKeys.has("language") ? { key: "language", label: "Language: " + languageName(inferredLanguage) } : null,
    inferredGenre && !inferredIntentKeys.has("genre") ? { key: "genre", label: "Genre: " + inferredGenre } : null,
    inferredProvider && !inferredIntentKeys.has("provider") ? { key: "provider", label: "Provider: " + (providers.find((item) => item.provider_key === inferredProvider)?.provider_name ?? intent.providerName ?? inferredProvider) } : null,
    domain === "historical" && !inferredIntentKeys.has("domain") ? { key: "domain", label: "Indian classics" } : null,
    effectiveYear && !inferredIntentKeys.has("year") ? { key: "year", label: "Year: " + effectiveYear } : null,
    yearFrom && yearTo && !inferredIntentKeys.has("year") ? { key: "years", label: "Years: " + yearFrom + "-" + yearTo } : null,
    contentType && !inferredIntentKeys.has("content_type") ? { key: "content_type", label: contentType === "web-series" ? "Web series" : contentType } : null,
  ].filter(Boolean) as { key: string; label: string }[];

  return (
    <AppShell>
      <main className="page-content search-page">
        <section className="search-header" aria-labelledby="search-heading">
          <div className="eyebrow">SEARCH INTELLIGENCE <span className="eyebrow-rule" /></div>
          <h1 id="search-heading">Find the next Indian movie to watch.</h1>
          <p className="page-lead">Search titles, people, languages, genres, years and providers with a shareable URL.</p>
          <SearchInput initialValue={rawQuery} large key={rawQuery} />
          {activeChips.length || intent.chips.length ? (
            <div className="parsed-search" aria-live="polite"><span className="parsed-label">Search understood as</span><div className="parsed-chip-row">
              {intent.chips.map((chip) => <Chip key={chip.key} label={chip.label + ": " + chip.value} onClear={() => setFilter(chip.key === "domain" ? "domain" : chip.key === "provider" ? "provider" : chip.key, "")} />)}
              {activeChips.map((chip) => <Chip key={"active-" + chip.key} label={chip.label} onClear={() => setFilter(chip.key === "years" ? "year_from" : chip.key, "")} />)}
            </div></div>
          ) : null}
          <button className="mobile-filter-toggle" type="button" onClick={() => setFiltersOpen((value) => !value)} aria-expanded={filtersOpen}><SlidersHorizontal size={16} />Filters</button>
          <div className={filtersOpen ? "filter-bar filters-open" : "filter-bar"} aria-label="Supported search filters">
            <label><span>Language</span><select value={inferredLanguage} onChange={(event) => setFilter("language", event.target.value)}><option value="">Any language</option>{Object.entries({ te: "Telugu", hi: "Hindi", ta: "Tamil", ml: "Malayalam", kn: "Kannada", bn: "Bengali", mr: "Marathi", bho: "Bhojpuri", gu: "Gujarati", or: "Odia", as: "Assamese", pa: "Punjabi", ur: "Urdu" }).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
            <label><span>Year</span><select value={effectiveYear} onChange={(event) => setFilter("year", event.target.value)}>{yearOptions.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
            <label><span>Provider</span><select value={inferredProvider} onChange={(event) => setFilter("provider", event.target.value)}><option value="">Any provider</option>{providers.map((item) => <option value={item.provider_key} key={item.provider_key}>{item.provider_name}</option>)}</select></label>
            <label><span>Domain</span><select value={domain} onChange={(event) => setFilter("domain", event.target.value)}><option value="current">Current Indian</option><option value="historical">Indian classics</option></select></label>
            <button type="button" onClick={clearAll} disabled={!activeChips.length && !interpretedQuery}><RotateCcw size={15} aria-hidden="true" />Reset filters</button>
          </div>
          <div className="genre-tools" aria-label="Genre search shortcuts"><span>Genre search</span>{genreQueries.map((item) => <button type="button" key={item} onClick={() => navigate({ q: item + " movies" })}>{item}</button>)}<small>Search understood as structured filters when a phrase is recognized.</small></div>
        </section>

        {error ? <div className="status-banner" role="status"><div><strong>Search is temporarily unavailable.</strong><span>{error}</span></div><button type="button" onClick={() => setRetryKey((value) => value + 1)}>Retry <ArrowRight size={15} aria-hidden="true" /></button></div> : null}
        {loading && !data && !error ? <SearchSkeleton /> : null}

        {!interpretedQuery && !activeChips.length && !loading && !error ? (
          <section className="search-intro"><div className="intro-icon"><SearchX size={18} aria-hidden="true" /></div><div><strong>Start with a title, person or natural phrase.</strong><span>Try Prabhas on Netflix, Telugu action movies or 1990s Tamil classics.</span></div><Link href="/">Browse discovery <ArrowRight size={15} aria-hidden="true" /></Link></section>
        ) : null}

        {data ? (
          <section className="results-section" aria-labelledby="results-heading">
            <div className="results-toolbar"><div><small>RESULTS</small><h2 id="results-heading">{data.total.toLocaleString()} titles found</h2></div><div className="active-chips" aria-label="Active filters">{activeChips.map((chip) => <span key={chip.key}>{chip.label}</span>)}</div></div>
            {data.items.length ? <div className="movie-grid search-results">{data.items.map((movie) => <MovieCard movie={movie} key={movie.canonical_movie_id} />)}</div> : <section className="empty-state"><SearchX size={22} aria-hidden="true" /><div><strong>No matching title found.</strong><span>Try a shorter title, search all providers, or clear one filter.</span></div><div className="empty-actions"><button type="button" onClick={() => navigate({ q: interpretedQuery || undefined })}>Search all providers</button>{interpretedQuery ? <button type="button" onClick={() => navigate({ q: interpretedQuery })}>Search only for {interpretedQuery}</button> : null}<button type="button" onClick={clearAll}>Clear filters</button></div></section>}
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}
