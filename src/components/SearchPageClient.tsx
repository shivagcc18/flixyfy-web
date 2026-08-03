"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, RotateCcw, SearchX, Sparkles } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { apiFetch, normalizePosterUrl, type Movie, type SearchResponse } from "@/lib/api";
import { getYearOptions, isYearValidForDomain } from "@/lib/search-helpers";
import AppShell from "./AppShell";
import MovieCard from "./MovieCard";
import SearchInput from "./SearchInput";

type ProviderFilter = { provider_key: string; provider_name: string };
type MovieListResponse = { items?: Movie[]; results?: Movie[]; total: number; page?: number; limit: number };

const languageOptions = [
  { value: "", label: "Any language" }, { value: "hi", label: "Hindi" },
  { value: "te", label: "Telugu" }, { value: "ta", label: "Tamil" },
  { value: "ml", label: "Malayalam" }, { value: "kn", label: "Kannada" },
  { value: "bn", label: "Bengali" }, { value: "mr", label: "Marathi" },
];

const genreQueries = ["Action", "Comedy", "Drama", "Romance", "Thriller", "Family"];

function normalizeResponseMovie(movie: Movie): Movie {
  return {
    ...movie,
    poster_url: normalizePosterUrl(
      movie.poster_url ?? (movie as unknown as { poster?: string | null }).poster ?? (movie as unknown as { poster_path?: string | null }).poster_path,
    ),
  };
}

function toResponse(items: Movie[], response: MovieListResponse, query: string, domain: "current" | "historical"): SearchResponse {
  const limit = response.limit || 48;
  const page = response.page || 1;
  return {
    query,
    total: response.total,
    limit,
    offset: (page - 1) * limit,
    items: items.map(normalizeResponseMovie),
    domain,
  };
}

export default function SearchPageClient() {
  const params = useSearchParams();
  const pathname = usePathname() ?? "/search";
  const router = useRouter();
  const paramsKey = params?.toString() ?? "";
  const query = params?.get("q") ?? "";
  const language = params?.get("language") ?? "";
  const year = params?.get("year") ?? params?.get("year_from") ?? "";
  const provider = params?.get("provider") ?? "";
  const domain = params?.get("domain") === "historical" ? "historical" : "current";
  const effectiveYear = isYearValidForDomain(year, domain) ? year : "";
  const yearOptions = getYearOptions(domain);
  const hasFilters = Boolean(language || effectiveYear || provider || domain !== "current");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<ProviderFilter[]>([]);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    if (!year || isYearValidForDomain(year, domain)) return;
    const next = new URLSearchParams(paramsKey);
    next.delete("year");
    next.delete("year_from");
    next.delete("year_to");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
  }, [year, domain, paramsKey, pathname, router]);

  useEffect(() => {
    let active = true;
    apiFetch<{ items?: ProviderFilter[] }>("/api/v4/providers")
      .then((response) => { if (active) setProviders(response.items ?? []); })
      .catch(() => { if (active) setProviders([]); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setData(null);
      setError("");
      if (!query.trim() && !hasFilters) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const apiParams = new URLSearchParams({ limit: "48", domain });
      if (query.trim()) apiParams.set("q", query.trim());
      if (provider) apiParams.set("provider", provider);
      if (language) apiParams.set("language", language);
      if (effectiveYear) apiParams.set("year", effectiveYear);
      const path = query.trim() ? `/api/v4/search?${apiParams}` : `/api/v4/${domain}?${apiParams}`;
      apiFetch<MovieListResponse>(path)
        .then((response) => {
          if (active) setData(toResponse(response.items ?? response.results ?? [], response, query, domain));
        })
        .catch((reason: unknown) => {
          if (active) setError(reason instanceof Error ? reason.message : "Search failed");
        })
        .finally(() => { if (active) setLoading(false); });
    }, 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [query, provider, language, year, domain, hasFilters, retryKey]);

  function setFilter(name: string, value: string) {
    const next = new URLSearchParams(paramsKey);
    if (value) next.set(name, value); else next.delete(name);
    if (name === "year") { next.delete("year_from"); next.delete("year_to"); }
    if (name === "domain" && year && !isYearValidForDomain(year, value)) {
      next.delete("year");
      next.delete("year_from");
      next.delete("year_to");
    }
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function resetFilters() {
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query.trim());
    router.push(next.toString() ? `${pathname}?${next}` : pathname);
  }

  function searchGenre(genre: string) {
    router.push(`${pathname}?q=${encodeURIComponent(`${genre} movies`)}`);
  }

  const chips = [
    domain === "historical" ? "Historical Indian" : "Current Indian",
    language ? languageOptions.find((item) => item.value === language)?.label ?? language : "",
    effectiveYear,
    provider,
  ].filter(Boolean);

  return (
    <AppShell>
      <main className="page-content search-page">
        <section className="search-header" aria-labelledby="search-heading">
          <div className="eyebrow">SEARCH INTELLIGENCE <span className="eyebrow-rule" /></div>
          <h1 id="search-heading">Find the next Indian movie to watch.</h1>
          <p className="page-lead">Search titles, aliases, actors, directors, languages, genres, years and providers in one compact index.</p>
          <SearchInput initialValue={query} large key={query} />
          <div className="filter-bar" aria-label="Supported search filters">
            <label><span>Language</span><select value={language} onChange={(event) => setFilter("language", event.target.value)}>{languageOptions.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
            <label><span>Year</span><select value={effectiveYear} onChange={(event) => setFilter("year", event.target.value)}>{yearOptions.map((item) => <option value={item.value} key={item.value}>{item.label}</option>)}</select></label>
            <label><span>Provider</span><select value={provider} onChange={(event) => setFilter("provider", event.target.value)}><option value="">Any provider</option><option value="youtube">YouTube</option>{providers.map((item) => <option value={item.provider_key} key={item.provider_key}>{item.provider_name}</option>)}</select></label>
            <label><span>Domain</span><select value={domain} onChange={(event) => setFilter("domain", event.target.value)}><option value="current">Current Indian</option><option value="historical">Historical Indian</option></select></label>
            <button type="button" onClick={resetFilters} disabled={!hasFilters}><RotateCcw size={15} aria-hidden="true" />Reset</button>
          </div>
          <div className="genre-tools" aria-label="Genre search shortcuts">
            <span>Genre search</span>
            {genreQueries.map((genre) => <button type="button" key={genre} onClick={() => searchGenre(genre)}>{genre}</button>)}
            <small>Natural queries keep genre matching inside the accepted search contract.</small>
          </div>
        </section>

        {error ? <div className="status-banner" role="status"><div><strong>Search is temporarily unavailable.</strong><span>{error}</span></div><button type="button" onClick={() => setRetryKey((value) => value + 1)}>Retry <ArrowRight size={15} aria-hidden="true" /></button></div> : null}
        {loading && !data && !error ? <div className="loading-state" role="status" aria-live="polite"><span className="loading-dot" />Finding matching movies…</div> : null}

        {!query && !hasFilters && !loading && !error ? (
          <section className="search-intro">
            <div className="intro-icon"><Sparkles size={18} aria-hidden="true" /></div>
            <div><strong>Start with a title, person or natural phrase.</strong><span>Try “NTR movies”, “Prabhas on Netflix” or “Tamil classics”.</span></div>
            <Link href="/?focus=search">Browse discovery <ArrowRight size={15} aria-hidden="true" /></Link>
          </section>
        ) : null}

        {data ? (
          <section className="results-section" aria-labelledby="results-heading">
            <div className="results-toolbar">
              <div><small>RESULTS</small><h2 id="results-heading">{data.total.toLocaleString()} movies found</h2></div>
              <div className="active-chips" aria-label="Active filters">{chips.map((chip) => <span key={chip}>{chip}</span>)}{data.query ? <span className="query-chip">“{data.query}”</span> : null}</div>
            </div>
            {data.items.length ? <div className="movie-grid search-results">{data.items.map((movie) => <MovieCard movie={movie} key={movie.canonical_movie_id} />)}</div> : <section className="empty-state"><SearchX size={22} aria-hidden="true" /><div><strong>No matching movie found.</strong><span>Try a shorter title, a person name, or remove one filter.</span></div><Link href="/search">Clear search <ArrowRight size={15} aria-hidden="true" /></Link></section>}
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}
