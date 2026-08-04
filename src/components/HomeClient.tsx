"use client";
/* global HTMLDivElement, ResizeObserver */
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronLeft, ChevronRight, Compass, SearchCheck, Sparkles, Tv2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetch, type Movie } from "@/lib/api";
import { FEATURED_LANGUAGES } from "@/lib/languages";
import { serializeSearchParams } from "@/lib/search-interpretation";
import AppShell from "./AppShell";
import MovieCard from "./MovieCard";
import SearchInput from "./SearchInput";

type HomePayload = {
  current?: { items?: Movie[] };
  historical?: { items?: Movie[] };
};

type Provider = { provider_key: string; provider_name: string; provider_type?: string };

const examples = [
  "Telugu action movies",
  "1990s Tamil classics",
  "Hindi comedy movies",
];

function LoadingRail() {
  return (
    <div className="movie-rail" aria-label="Loading movies" aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="skeleton-card" key={index}>
          <div className="skeleton-poster" />
          <div className="skeleton-line long" />
          <div className="skeleton-line short" />
        </div>
      ))}
    </div>
  );
}

// eslint-disable-next-line no-unused-vars
function ProviderRail({ providers, onSelect }: { providers: Provider[]; onSelect: (value?: string) => void }) {
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

  return (
    <div className={canScroll ? "provider-rail-shell has-overflow" : "provider-rail-shell"}>
      <button type="button" className="provider-rail-control previous" onClick={() => move(-1)} disabled={!canScroll || atStart} aria-label="Previous providers"><ChevronLeft size={17} /></button>
      <div ref={scrollerRef} className="provider-scroller" aria-label="Browse by provider" tabIndex={0} onKeyDown={(event) => { if (event.key === "ArrowLeft") { event.preventDefault(); move(-1); } if (event.key === "ArrowRight") { event.preventDefault(); move(1); } }}>
        <button type="button" className="provider-pill selected" onClick={() => onSelect()} aria-pressed="true">All providers</button>
        {providers.map((provider) => (
          <button type="button" className="provider-pill" key={provider.provider_key} onClick={() => onSelect(provider.provider_key)}>
            <span className="provider-monogram" aria-hidden="true">{provider.provider_name.trim().slice(0, 1).toUpperCase()}</span>{provider.provider_name}
          </button>
        ))}
      </div>
      <button type="button" className="provider-rail-control next" onClick={() => move(1)} disabled={!canScroll || atEnd} aria-label="Next providers"><ChevronRight size={17} /></button>
    </div>
  );
}

function RailControls({ target }: { target: string }) {
  function move(direction: number) {
    document.getElementById(target)?.scrollBy({ left: direction * 360, behavior: "smooth" });
  }
  return (
    <div className="rail-controls" aria-label="Rail controls">
      <button type="button" onClick={() => move(-1)} aria-label="Previous titles"><ChevronLeft size={17} /></button>
      <button type="button" onClick={() => move(1)} aria-label="Next titles"><ChevronRight size={17} /></button>
    </div>
  );
}

export default function HomeClient() {
  const router = useRouter();

  const [data, setData] = useState<HomePayload | null>(null);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    Promise.all([
      apiFetch<HomePayload>("/api/v4/home?limit=12"),
      apiFetch<{ items?: Provider[] }>("/api/v4/providers"),
    ])
      .then(([home, providerResponse]) => {
        if (!active) return;
        setData(home);
        setProviders(providerResponse.items ?? []);
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Discovery is unavailable");
      });
    return () => { active = false; };
  }, [retryKey]);

  function goToSearch(values: Record<string, string | undefined>) {
    const query = serializeSearchParams(values);
    router.push(query ? "/search?" + query : "/search");
  }

  const activeLanguage = "";

  const currentItems = data?.current?.items ?? [];
  const classicItems = data?.historical?.items ?? [];

  return (
    <AppShell>
      <main className="page-content">
        <section className="hero" aria-labelledby="home-heading">
          <div className="hero-orbit" aria-hidden="true" />
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15} aria-hidden="true" />Indian movies and web series</div>
            <h1 id="home-heading">Find Indian movies.<br /><span>Know where to watch.</span></h1>
            <p>Search by movie, person, language, genre or provider.</p>
            <SearchInput large />
            <div className="discovery-chips" aria-label="Search examples">
              {examples.map((item) => <Link href={"/search?q=" + encodeURIComponent(item)} key={item}>{item}</Link>)}
            </div>
            <div className="hero-signals" aria-label="How FLIXYFY works">
              <div><SearchCheck size={17} aria-hidden="true" /><strong>Current movies and classics</strong></div>
              <div><Tv2 size={17} aria-hidden="true" /><strong>OTT and YouTube shown separately</strong></div>
              <div><Compass size={17} aria-hidden="true" /><strong>Browse by language and provider</strong></div>
            </div>
          </div>
        </section>

        <section className="discovery-controls" aria-label="Discovery controls">
          <div className="control-heading">
            <div><small>START WITH A SHORTCUT</small><h2>Language-first discovery</h2></div>
            <Link href="/search">Open full search <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
          <div className="language-shortcuts" aria-label="Browse by language">
            {FEATURED_LANGUAGES.map((language) => (
              <button type="button" className={activeLanguage === language.value ? "selected" : undefined} key={language.value} onClick={() => goToSearch({ language: language.value })} aria-pressed={activeLanguage === language.value}>{language.label}</button>
            ))}
            <button type="button" onClick={() => goToSearch({})}>More</button>
          </div>
          <div className="provider-watchbar">
            <div className="watchbar-heading"><span>Watch by provider</span><small>Availability appears on movie details</small></div>
            <ProviderRail providers={providers} onSelect={(provider) => goToSearch({ provider })} />
          </div>
          <div className="compact-filter-row" aria-label="Quick filters">
            <span>Quick filters</span>
            <button type="button" onClick={() => goToSearch({ domain: "current" })}>Movies</button>
            <button type="button" onClick={() => goToSearch({ domain: "historical" })}>Classics</button>
            <button type="button" onClick={() => goToSearch({ language: "te" })}>Language</button>
            <button type="button" onClick={() => goToSearch({ provider: providers[0]?.provider_key })}>Provider</button>
            <button type="button" onClick={() => goToSearch({ q: "Action movies" })}>Genre</button>
            <Link href="/search">More filters <ArrowRight size={14} aria-hidden="true" /></Link>
          </div>
        </section>

        {error ? (
          <div className="status-banner" role="status">
            <div><strong>Discovery is taking a moment.</strong><span>{error}</span></div>
            <button type="button" onClick={() => setRetryKey((value) => value + 1)}>Retry <ArrowRight size={15} aria-hidden="true" /></button>
          </div>
        ) : null}

        {!data && !error ? <LoadingRail /> : null}

        {data && currentItems.length ? (
          <section className="content-section" aria-labelledby="current-heading">
            <div className="section-heading">
              <div><small>NOW DISCOVERING</small><h2 id="current-heading">Current Indian movies</h2><p>Recently released Indian movies across languages.</p></div>
              <div className="section-actions"><RailControls target="current-rail" /><Link href="/search">Explore all <ArrowRight size={15} aria-hidden="true" /></Link></div>
            </div>
            <div className="movie-rail" id="current-rail" tabIndex={0}>{currentItems.map((movie) => <MovieCard movie={movie} key={movie.canonical_movie_id} />)}</div>
          </section>
        ) : null}

        {data && classicItems.length ? (
          <section className="content-section" aria-labelledby="classic-heading">
            <div className="section-heading">
              <div><small>FROM THE ARCHIVE</small><h2 id="classic-heading">Indian classics</h2><p>Beloved historical titles kept in their own discovery lane.</p></div>
              <div className="section-actions"><RailControls target="classic-rail" /><Link href="/search?domain=historical">Explore all <ArrowRight size={15} aria-hidden="true" /></Link></div>
            </div>
            <div className="movie-rail" id="classic-rail" tabIndex={0}>{classicItems.map((movie) => <MovieCard movie={movie} key={movie.canonical_movie_id} />)}</div>
          </section>
        ) : null}

        {data && !currentItems.length && !classicItems.length ? (
          <section className="empty-state"><Sparkles size={22} aria-hidden="true" /><div><strong>No titles are available right now.</strong><span>Search for a specific movie or person to start discovering.</span></div><Link href="/search">Open search <ArrowRight size={15} aria-hidden="true" /></Link></section>
        ) : null}
      </main>
    </AppShell>
  );
}
