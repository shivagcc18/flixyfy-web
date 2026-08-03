"use client";

import { useEffect, useState } from "react";
import { RotateCcw, SearchX, Sparkles } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { apiFetch, type Movie, type SearchResponse } from "@/lib/api";
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

const currentYear = new Date().getFullYear();
const yearOptions = [
  { value: "", label: "Any year" },
  ...Array.from({ length: currentYear - 1949 }, (_, index) => {
    const year = String(currentYear - index);
    return { value: year, label: year };
  }),
];

function moviesToSearchResponse({
  items,
  total,
  limit,
  offset,
  query,
  domain,
}: {
  items: Movie[];
  total: number;
  limit: number;
  offset: number;
  query: string;
  domain: "current" | "historical";
}): SearchResponse {
  return {
    query,
    total,
    limit,
    offset,
    items,
    domain,
  };
}

export default function SearchPageClient() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const paramsKey = params?.toString() ?? "";
  const query = params?.get("q") ?? "";
  const language = params?.get("language") ?? "";
  const year = params?.get("year") ?? params?.get("year_from") ?? "";
  const provider = params?.get("provider") ?? "";
  const domain = params?.get("domain") === "historical" ? "historical" : "current";
  const basePath = pathname ?? "/search";
  const [data, setData] = useState<SearchResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<ProviderFilter[]>([]);
  const hasFilters = Boolean(language || year || provider || domain !== "current");

  useEffect(() => {
    let active = true;
    apiFetch<{ items: ProviderFilter[] }>("/api/v4/providers")
      .then((response) => {
        if (active) setProviders(response.items);
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
    const timer = window.setTimeout(() => {
      setData(null);
      setError("");
      setLoading(Boolean(query.trim() || hasFilters));
      if (!query.trim() && !hasFilters) {
        setLoading(false);
        return;
      }

      const apiParams = new URLSearchParams();
      apiParams.set("limit", "48");
      if (query.trim()) apiParams.set("q", query.trim());
      apiParams.set("domain", domain);
      if (provider) apiParams.set("provider", provider);
      if (language) apiParams.set("language", language);
      if (year) apiParams.set("year", year);
      const path = query.trim()
        ? `/api/v4/search?${apiParams.toString()}`
        : `/api/v4/${domain}?${apiParams.toString()}`;

      apiFetch<MovieListResponse>(path)
        .then((response) => {
          if (!active) return;
          const items = response.items ?? response.results ?? [];
          const limit = response.limit || 48;
          const page = response.page || 1;
          setData(moviesToSearchResponse({
            items,
            total: response.total,
            limit,
            offset: (page - 1) * limit,
            query,
            domain,
          }));
        })
        .catch((reason: unknown) => {
          if (active) {
            setError(reason instanceof Error ? reason.message : "Search failed");
          }
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query, provider, language, year, domain, hasFilters]);

  function setFilter(name: string, value: string) {
    const next = new URLSearchParams(paramsKey);
    if (value) {
      next.set(name, value);
    } else {
      next.delete(name);
    }
    if (name === "year") {
      next.delete("year_from");
      next.delete("year_to");
    }
    const qs = next.toString();
    router.push(qs ? `${basePath}?${qs}` : basePath);
  }

  function resetFilters() {
    const next = new URLSearchParams();
    if (query.trim()) next.set("q", query.trim());
    router.push(next.toString() ? `${basePath}?${next.toString()}` : basePath);
  }

  const chips = [
    domain === "historical" ? "Historical Indian" : "Current Indian",
    language ? languageOptions.find((item) => item.value === language)?.label ?? language : "",
    year,
    provider,
  ].filter(Boolean);

  return (
    <AppShell>
      <main className="page-content search-page">
        <section className="search-header">
          <small>SEARCH INTELLIGENCE</small>
          <h1>Search the Indian movie graph</h1>
          <SearchInput initialValue={query} large key={query} />
          <div className="filter-bar" aria-label="Search filters">
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
              <span>Domain</span>
              <select value={domain} onChange={(event) => setFilter("domain", event.target.value)}>
                <option value="current">Current Indian</option>
                <option value="historical">Historical Indian</option>
              </select>
            </label>
            <button type="button" onClick={resetFilters} disabled={!hasFilters}>
              <RotateCcw size={15} aria-hidden="true" />
              Reset
            </button>
          </div>
        </section>

        {!query && !hasFilters ? (
          <section className="search-empty">
            <Sparkles size={36} aria-hidden="true" />
            <h2>Try a natural search</h2>
            <p>NTR movies on Netflix, Telugu action movies, RRR, or Hindi movies from 2022.</p>
          </section>
        ) : null}
        {error ? <section className="error-panel"><h2>Search failed</h2><p>{error}</p></section> : null}
        {loading && !data && !error ? <div className="loading-panel">Understanding your search...</div> : null}

        {data ? (
          <>
            <section className="intelligence-panel">
              <div className="intelligence-title"><Sparkles size={20} aria-hidden="true" /><div><span>SEARCH INTELLIGENCE</span><strong>Titles, aliases, people and indexed metadata</strong></div></div>
              <div className="entity-chips">
                {chips.map((item) => (
                  <span key={item}><small>Filter</small>{item}</span>
                ))}
                {data.query ? <span><small>Query</small>{data.query}</span> : null}
              </div>
            </section>
            <div className="section-heading">
              <div><small>RESULTS</small><h2>{data.total.toLocaleString()} movies found</h2></div>
            </div>
            {data.items.length ? (
              <div className="movie-grid search-results">
                {data.items.map((movie) => <MovieCard movie={movie} key={movie.canonical_movie_id} />)}
              </div>
            ) : (
              <section className="search-empty">
                <SearchX size={38} aria-hidden="true" />
                <h2>No matching movie found</h2>
                <p>Remove one filter or use a shorter title or person name.</p>
              </section>
            )}
          </>
        ) : null}
      </main>
    </AppShell>
  );
}
