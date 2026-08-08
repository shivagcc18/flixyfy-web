"use client";
/* global HTMLDivElement, ResizeObserver */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, SearchCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetch, normalizePosterUrl, type Movie } from "@/lib/api";
import { FEATURED_LANGUAGES } from "@/lib/languages";
import { serializeSearchParams } from "@/lib/search-interpretation";
import { curateHomepageCandidates } from "@/lib/homepage-curation";
import AppShell from "./AppShell";
import MovieCard from "./MovieCard";
import SearchInput from "./SearchInput";
import ProviderLogo from "./ProviderLogo";

type Provider = { provider_key: string; provider_name: string; provider_type?: string };
// eslint-disable-next-line no-unused-vars
type ProviderSelector = (provider?: string) => void;
type RawMovie = Record<string, unknown>;
type HomepageMovie = Movie & { approved_provider_count: number; rating_signal: number };
type SearchPayload = { items?: RawMovie[]; results?: RawMovie[]; total?: number };
type Rail = { key: string; title: string; subtitle: string; items: HomepageMovie[] };

const YOUTUBE_BROWSE_PROVIDER: Provider = { provider_key: "youtube", provider_name: "YouTube", provider_type: "FREE_STREAMING" };

const CURRENT_RAILS = [
  { key: "te", title: "Telugu — Watch now", subtitle: "Watchable Telugu picks, ranked by availability, recency and trusted rating." },
  { key: "hi", title: "Hindi — Watch now", subtitle: "Hindi titles with confirmed watch options, then recent and highly rated picks." },
  { key: "ta", title: "Tamil — Watch now", subtitle: "Tamil movies with a clear path to watching them." },
  { key: "kn", title: "Kannada — Watch now", subtitle: "Kannada discoveries prioritized by real availability." },
  { key: "ml", title: "Malayalam — Watch now", subtitle: "Malayalam titles worth watching now." },
] as const;

function numberValue(value: unknown) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function textValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function normalizeHomepageMovie(raw: RawMovie, domain: "current" | "historical"): HomepageMovie {
  const approvedProviderCount = numberValue(raw.approved_provider_count ?? raw.ott_provider_count ?? raw.provider_count);
  const canonical = textValue(raw.canonical_movie_id ?? raw.id ?? raw.movie_id, `TEMP:${textValue(raw.title, "untitled")}`);
  const language = textValue(raw.language_name ?? raw.language ?? raw.original_language, "unknown");
  return {
    canonical_movie_id: canonical as Movie["canonical_movie_id"],
    tmdb_id: numberValue(raw.tmdb_id) || null,
    imdb_id: textValue(raw.imdb_id) || null,
    title: textValue(raw.title ?? raw.name, "Untitled"),
    original_title: textValue(raw.original_title) || null,
    release_year: numberValue(raw.release_year ?? raw.year) || null,
    domain: raw.domain === "historical" || domain === "historical" ? "historical" : "current",
    original_language: textValue(raw.original_language, language),
    language_name: language,
    runtime: numberValue(raw.runtime) || null,
    overview: textValue(raw.overview) || null,
    poster_url: normalizePosterUrl(textValue(raw.poster_url ?? raw.poster_path ?? raw.poster)),
    backdrop_url: normalizePosterUrl(textValue(raw.backdrop_url ?? raw.backdrop_path ?? raw.backdrop)),
    tmdb_rating: numberValue(raw.tmdb_rating ?? raw.rating) || null,
    imdb_rating: numberValue(raw.imdb_rating) || null,
    provider_count: approvedProviderCount,
    youtube_video_count: numberValue(raw.youtube_video_count ?? raw.youtube_count),
    availability_count: numberValue(raw.availability_count),
    providers: Array.isArray(raw.providers) ? raw.providers as Movie["providers"] : [],
    availability: Array.isArray(raw.availability) ? raw.availability as Movie["availability"] : [],
    matched_fields: Array.isArray(raw.matched_fields) ? raw.matched_fields as string[] : undefined,
    approved_provider_count: approvedProviderCount,
    rating_signal: numberValue(raw.rating ?? raw.tmdb_rating),
  };
}

export function curateHomepageMovies(items: RawMovie[], domain: "current" | "historical") {
  return curateHomepageCandidates(items.map((item) => normalizeHomepageMovie(item, domain)), domain) as HomepageMovie[];
}

function LoadingRail() {
  return <div className="movie-rail" aria-label="Loading watchable movies" aria-busy="true">{Array.from({ length: 6 }, (_, index) => <div className="skeleton-card" key={index}><div className="skeleton-poster" /><div className="skeleton-line long" /><div className="skeleton-line short" /></div>)}</div>;
}

function ProviderRail({ providers, onSelect }: { providers: Provider[]; onSelect: ProviderSelector }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(true);

  function updateState() {
    const node = scrollerRef.current;
    if (!node) return;
    const max = Math.max(0, node.scrollWidth - node.clientWidth);
    setCanScroll(max > 2);
    setAtStart(node.scrollLeft <= 2);
    setAtEnd(node.scrollLeft >= max - 2);
  }

  useEffect(() => {
    updateState();
    const node = scrollerRef.current;
    if (!node) return;
    node.addEventListener("scroll", updateState, { passive: true });
    const observer = new ResizeObserver(updateState);
    observer.observe(node);
    return () => { node.removeEventListener("scroll", updateState); observer.disconnect(); };
  }, [providers.length]);

  function move(direction: number) {
    scrollerRef.current?.scrollBy({ left: direction * Math.max(220, (scrollerRef.current?.clientWidth ?? 360) * 0.78), behavior: "smooth" });
  }

  return <div className={canScroll ? "provider-rail-shell has-overflow" : "provider-rail-shell"}>
    <button type="button" className="provider-rail-control previous" onClick={() => move(-1)} disabled={!canScroll || atStart} aria-label="Previous providers"><ChevronLeft size={17} /></button>
    <div ref={scrollerRef} className="provider-scroller" aria-label="Browse by provider" tabIndex={0} onKeyDown={(event) => { if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); } if (event.key === "ArrowRight") { event.preventDefault(); move(1); } }}>
      <button type="button" className="provider-pill selected" onClick={() => onSelect()} aria-pressed="true">All providers</button>
      {providers.map((provider) => <button type="button" className="provider-pill" key={provider.provider_key} onClick={() => onSelect(provider.provider_key)} aria-label={`Browse ${provider.provider_name} movies`}><ProviderLogo providerKey={provider.provider_key} providerName={provider.provider_name} compact /><span>{provider.provider_name}</span></button>)}
    </div>
    <button type="button" className="provider-rail-control next" onClick={() => move(1)} disabled={!canScroll || atEnd} aria-label="Next providers"><ChevronRight size={17} /></button>
  </div>;
}

function RailControls({ target }: { target: string }) {
  function move(direction: number) { document.getElementById(target)?.scrollBy({ left: direction * 360, behavior: "smooth" }); }
  return <div className="rail-controls" aria-label="Rail controls"><button type="button" onClick={() => move(-1)} aria-label="Previous titles"><ChevronLeft size={17} /></button><button type="button" onClick={() => move(1)} aria-label="Next titles"><ChevronRight size={17} /></button></div>;
}

function MovieRail({ rail, index }: { rail: Rail; index: number }) {
  const target = `${rail.key}-homepage-rail`;
  const browseHref = rail.key === "te-historical" ? "/search?domain=historical&language=te" : `/search?language=${rail.key}`;
  return <section className={`content-section homepage-rail homepage-rail-${index + 1}`} aria-labelledby={`${target}-heading`}>
    <div className="section-heading"><div><small>{index === 0 ? "TELUGU FIRST" : "WATCH NOW"}</small><h2 id={`${target}-heading`}>{rail.title}</h2><p>{rail.subtitle}</p></div><div className="section-actions"><RailControls target={target} /><Link href={browseHref}>Explore all <ArrowRight size={15} aria-hidden="true" /></Link></div></div>
    <div className="movie-rail" id={target} tabIndex={0}>{rail.items.map((movie) => <MovieCard movie={movie} key={movie.canonical_movie_id} />)}</div>
  </section>;
}

export default function HomeClient() {
  const router = useRouter();
  const [rails, setRails] = useState<Rail[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    const requests = CURRENT_RAILS.map((rail) => apiFetch<SearchPayload>(`/api/v4/search?language=${rail.key}&domain=current&limit=48`));
    Promise.all([
      ...requests,
      apiFetch<SearchPayload>("/api/v4/search?language=te&domain=historical&limit=48"),
      apiFetch<{ items?: Provider[] }>("/api/v4/providers"),
    ])
      .then((responses) => {
        if (!active) return;
        const currentResponses = responses.slice(0, CURRENT_RAILS.length) as SearchPayload[];
        const historicalResponse = responses[CURRENT_RAILS.length] as SearchPayload;
        const providerResponse = responses[CURRENT_RAILS.length + 1] as { items?: Provider[] };
        setRails([
          ...CURRENT_RAILS.map((rail, index) => ({ ...rail, items: curateHomepageMovies(currentResponses[index]?.items ?? currentResponses[index]?.results ?? [], "current") })),
          { key: "te-historical", title: "Telugu Classics", subtitle: "Historical Telugu cinema, kept in its own lane.", items: curateHomepageMovies(historicalResponse?.items ?? historicalResponse?.results ?? [], "historical") },
        ]);
        const apiProviders = providerResponse.items ?? [];
        setProviders(apiProviders.some((item) => item.provider_key === "youtube") ? apiProviders : [...apiProviders, YOUTUBE_BROWSE_PROVIDER]);
        setLoading(false);
      })
      .catch((reason: unknown) => { if (active) { setLoading(false); setError(reason instanceof Error ? reason.message : "Homepage discovery is unavailable"); } });
    return () => { active = false; };
  }, [retryKey]);

  function goToSearch(values: Record<string, string | undefined>) {
    const query = serializeSearchParams(values);
    router.push(query ? "/search?" + query : "/search");
  }

  return <AppShell>
    <main className="page-content home-page" data-ui-checkpoint="flixyfy-telugu-first-watchable-homepage-v1">
      <section className="hero" aria-labelledby="home-heading">
        <div className="hero-orbit" aria-hidden="true" />
        <div className="hero-copy">
          <div className="eyebrow"><Sparkles size={15} aria-hidden="true" />Indian movie discovery</div>
          <h1 id="home-heading">Indian movies in every language.<br /><span>Know where to watch.</span></h1>
          <SearchInput large />
          <div className="discovery-chips" aria-label="Search examples">{["Telugu action movies", "Prabhas movies", "Movies on Prime Video"].map((item) => <Link href={`/search?q=${encodeURIComponent(item)}`} key={item}>{item}</Link>)}</div>
        </div>
      </section>

      {error ? <div className="status-banner" role="status"><div><strong>Homepage discovery is taking a moment.</strong><span>{error}</span></div><button type="button" onClick={() => setRetryKey((value) => value + 1)}>Retry <ArrowRight size={15} aria-hidden="true" /></button></div> : null}
      {loading && !error ? <LoadingRail /> : null}
      {!loading && !error ? rails.slice(0, 5).map((rail, index) => <MovieRail rail={rail} index={index} key={rail.key} />) : null}

      {!loading && !error ? <section className="discovery-controls compact-discovery-controls" aria-label="Browse by provider and language">
        <div className="control-heading"><div><small>WATCH BY PROVIDER</small><h2>Find where to watch</h2></div><Link href="/providers">All providers <ArrowRight size={15} aria-hidden="true" /></Link></div>
        <div className="provider-watchbar"><div className="watchbar-heading"><span>Provider browse</span><small>Open a provider search; watch actions stay on movie details.</small></div><ProviderRail providers={providers} onSelect={(provider) => goToSearch({ provider })} /></div>
        <div className="compact-language-row" aria-label="Browse by language"><span>More languages</span>{FEATURED_LANGUAGES.filter((language) => language.value && !["te", "hi", "ta", "kn", "ml"].includes(language.value)).map((language) => <button type="button" key={language.value} onClick={() => goToSearch({ language: language.value })}>{language.label}</button>)}<button type="button" onClick={() => goToSearch({})}>All languages</button></div>
      </section> : null}

      {!loading && !error && rails[5]?.items.length ? <MovieRail rail={rails[5]} index={5} /> : null}
      {!loading && !error && rails.every((rail) => !rail.items.length) ? <section className="empty-state"><SearchCheck size={22} aria-hidden="true" /><div><strong>No watchable homepage titles are available right now.</strong><span>Search the full all-India catalog to explore more.</span></div><Link href="/search">Open search <ArrowRight size={15} aria-hidden="true" /></Link></section> : null}
    </main>
  </AppShell>;
}
