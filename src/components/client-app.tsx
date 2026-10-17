"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { api, Movie, MovieDetail, Person, PersonHit, Provider } from "@/lib/api";
import catalogFilterOptions from "@/lib/catalog-filter-options.json";

const LANGUAGES = ["all", "te", "hi", "ta", "ml", "kn", "bn", "mr", "pa", "ur", "ne", "or", "gu", "as"];
const LEGEND_LANGUAGES = ["te", "ta", "kn", "hi"];
const DISCOVERY_CATEGORIES = [{ id: "ALL", label: "All" }, { id: "HEROES", label: "Heroes / Leads" }, { id: "HEROINES", label: "Heroines / Leads" }, { id: "DIRECTORS", label: "Directors" }, { id: "ACTORS", label: "Actors" }, { id: "COMEDIANS", label: "Comedians" }, { id: "VILLAINS", label: "Villains" }];
const ROLE_ORDER = ["LEAD_MALE", "LEAD_FEMALE", "SUPPORTING", "VILLAIN", "COMEDIAN", "CHARACTER", "CAMEO"];
const ROLE_LABEL: Record<string, string> = { LEAD_MALE: "Hero / Lead", LEAD_FEMALE: "Heroine", SUPPORTING: "Supporting", VILLAIN: "Villain", COMEDIAN: "Comedian", CHARACTER: "Character", CAMEO: "Cameo" };
const LANGUAGE_NAMES: Record<string, string> = { te: "Telugu", hi: "Hindi", ta: "Tamil", ml: "Malayalam", kn: "Kannada", bn: "Bengali", mr: "Marathi", pa: "Punjabi", ur: "Urdu", ne: "Nepali", or: "Odia", gu: "Gujarati", as: "Assamese", en: "English", "en-in": "English", zxx: "Language independent" };
const slug = (value: string) => value.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
const personSlug = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "person";
const PROVIDER_META: Record<string, { name: string; logo?: string; homeUrl?: string }> = {
  prime_video: { name: "Prime Video", logo: "/prime_video.png" }, amazon_prime: { name: "Prime Video", logo: "/prime_video.png" }, amazon_video: { name: "Prime Video", logo: "/prime_video.png" }, amazon_video_store: { name: "Amazon Video Store" },
  netflix: { name: "Netflix", logo: "/netflix.png" },
  jiohotstar: { name: "JioHotstar", logo: "/jiohotstar.png" }, jio_hotstar: { name: "JioHotstar", logo: "/jiohotstar.png" }, hotstar: { name: "JioHotstar", logo: "/jiohotstar.png" },
  aha: { name: "Aha", logo: "/aha.png" }, aha_video: { name: "Aha", logo: "/aha.png" },
  sun_nxt: { name: "Sun NXT", logo: "/sun_nxt.png", homeUrl: "https://www.sunnxt.com/" }, sunnxt: { name: "Sun NXT", logo: "/sun_nxt.png", homeUrl: "https://www.sunnxt.com/" },
  zee5: { name: "ZEE5", logo: "/zee5.png" },
  sonyliv: { name: "SonyLIV", logo: "/sonyliv.png" }, sony_liv: { name: "SonyLIV", logo: "/sonyliv.png" },
  etv_win: { name: "ETV Win", logo: "/etv_win.png" }, etvwin: { name: "ETV Win", logo: "/etv_win.png" },
  vi_movies_and_tv: { name: "Vi Movies & TV" }, google_play_movies: { name: "Google Play Movies" }, apple_tv_store: { name: "Apple TV Store" },
  eros_now_select_apple_tv_channel: { name: "Eros Now Select on Apple TV" },
  ap_international_south_cinema_amazon_channel: { name: "AP International South Cinema on Amazon" },
  manoramamax_amazon_channel: { name: "ManoramaMAX on Amazon" }, manoramamax: { name: "ManoramaMAX" },
  shemaroome: { name: "ShemarooMe" }, hoichoi_amazon_channel: { name: "Hoichoi on Amazon" }, hoichoi: { name: "Hoichoi" },
  nfdc_amazon_channel: { name: "NFDC on Amazon" }, hungama_play: { name: "Hungama Play" },
  lionsgate_play: { name: "Lionsgate Play" }, lionsgate_play_amazon_channel: { name: "Lionsgate Play on Amazon" }, lionsgate_play_apple_tv_channel: { name: "Lionsgate Play on Apple TV" },
  plex_channel: { name: "Plex Channel" }, plex: { name: "Plex" },
};
const providerMeta = (key: string, dictionaryName?: string | null, dictionaryLogo?: string | null) => {
  const normalized = slug(key);
  const known = PROVIDER_META[normalized];
  if (known) return { ...known, name: dictionaryName || known.name, logo: dictionaryLogo || known.logo };
  const channel = normalized.match(/^(.*?)(?:_on)?_(amazon_channel|apple_tv_channel)$/);
  const store = normalized.match(/^(.*?)(?:_video_store|_store)$/);
  const base = (channel?.[1] || store?.[1] || normalized).replace(/[_-]+/g, " ").replace(/\b\w/g, (x) => x.toUpperCase());
  const name = dictionaryName || (channel ? `${base} on ${channel[2] === "amazon_channel" ? "Amazon" : "Apple TV"}` : store ? `${base} Store` : base);
  return { name, logo: dictionaryLogo || undefined };
};
const safeProviderUrl = (value?: string | null) => {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.href : undefined;
  } catch {
    return undefined;
  }
};
const movieHref = (id: string) => `/movies/${encodeURIComponent(id)}`;
const personHref = (id: string, name?: string) => {
  const match = id.match(/FXP\d{8}/i)?.[0]?.toUpperCase() ?? id;
  const label = personSlug(name ?? "person");
  return `/people/${label}-${match}`;
};
const langName = (code?: string | null) => code ? code.toLowerCase() === "all" ? "All" : LANGUAGE_NAMES[code.toLowerCase()] ?? "Language unknown" : "Language unknown";

function Section({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return <div className="section-head"><div><p className="eyebrow">FLIXYFY DISCOVERY</p><h2>{title}</h2>{subtitle && <p className="section-subtitle">{subtitle}</p>}</div>{action}</div>;
}

function MovieCard({ movie }: { movie: Movie }) {
  return <Link className="movie-card" href={movieHref(movie.id)}>
    <div className="card-poster">{movie.poster ? <Image src={movie.poster} alt={`Poster for ${movie.title}`} fill sizes="(max-width: 600px) 44vw, (max-width: 1000px) 25vw, 180px" unoptimized loading="lazy" /> : <div className="poster-fallback" aria-hidden="true"><span>{movie.title.slice(0, 1)}</span><small>FLIXYFY CLASSIC</small></div>}
      <div className="availability-badges">{movie.provider_count > 0 && <span>OTT</span>}{movie.youtube_count > 0 && <span className="youtube-badge">YouTube</span>}{movie.presentation_role_status === "INFERRED" && <span title="Person-level role inference; not a verified movie-specific role">Inferred {movie.inferred_presentation_role === "LEAD_FEMALE" ? "Heroine" : "Hero"}</span>}</div>
    </div><div className="movie-meta"><strong>{movie.title}</strong><small>{movie.year || "Year unknown"} <i>·</i> {langName(movie.language)}</small></div>
  </Link>;
}
function MovieRail({ title, subtitle, items }: { title: string; subtitle: string; items: Movie[] }) {
  if (!items.length) return null;
  return <section className="movie-rail"><Section title={title} subtitle={subtitle} /><div className="rail-track">{items.map((movie) => <MovieCard key={movie.id} movie={movie} />)}</div></section>;
}
function PersonAvatar({ person, large = false }: { person: Pick<PersonHit, "portrait" | "display_name">; large?: boolean }) {
  const [failed, setFailed] = useState(false);
  const initials = person.display_name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <span className={large ? "person-portrait" : "person-avatar"} aria-hidden="true">{person.portrait && !failed ? <Image src={person.portrait} alt="" fill sizes={large ? "(max-width:600px) 35vw,220px" : "64px"} unoptimized onError={() => setFailed(true)} /> : <span>{initials}</span>}</span>;
}
function PersonRows({ people, onSelect }: { people: PersonHit[]; onSelect?: (person: PersonHit) => void }) {
  return <div className="people-grid">{people.map((person) => <Link className="person-card" href={personHref(person.id, person.display_name)} onClick={(event) => { if (onSelect) { event.preventDefault(); onSelect(person); } }} key={person.id}>
    <PersonAvatar person={person} /><span className="person-card-copy"><strong>{person.display_name}</strong><small>{person.filmography_total} accepted films</small>{person.languages?.length ? <small>{person.languages.slice(0, 3).map(langName).join(" · ")}</small> : null}{person.role_label && <small className="person-role-label">{person.role_label}</small>}</span><span className="person-arrow" aria-hidden="true">↗</span>
  </Link>)}</div>;
}
function ErrorPanel({ message }: { message: string }) { return <div className="error-panel" role="alert">{message}</div>; }
function pageRoute(path: string) { const parts = path.split("/").filter(Boolean); const rawId = parts[1] || ""; const id = rawId.match(/FXP\d{8}/i)?.[0]?.toUpperCase() ?? rawId; return { page: parts[0] || "home", id, rawId }; }

export function ClientApp() {
  const router = useRouter(); const pathname = usePathname() || "/"; const searchParams = useSearchParams();
  const query = searchParams.get("q") || ""; const queryString = searchParams.toString(); const route = pageRoute(pathname);
  const filters = useMemo(() => { const params = new URLSearchParams(queryString); return { genre: params.get("genre") || "", language: params.get("language") || "", year: params.get("year") || "", provider: params.get("provider") || "", sort: params.get("sort") || "newest" }; }, [queryString]);
  const [headerQuery, setHeaderQuery] = useState(query); const [suggestions, setSuggestions] = useState<PersonHit[]>([]); const [suggestOpen, setSuggestOpen] = useState(false);
  const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const [homeMovies, setHomeMovies] = useState<Movie[]>([]); const [teMovies, setTeMovies] = useState<Movie[]>([]); const [hiMovies, setHiMovies] = useState<Movie[]>([]); const [heroMovie, setHeroMovie] = useState<MovieDetail | null>(null);
  const [legendRows, setLegendRows] = useState<{ language: string; people: PersonHit[] }[]>([]);
  const [searchPeople, setSearchPeople] = useState<PersonHit[]>([]); const [searchPerson, setSearchPerson] = useState<Person | null>(null); const [searchPersonMovies, setSearchPersonMovies] = useState<Movie[]>([]); const [searchPersonNext, setSearchPersonNext] = useState<string | null>(null); const [searchMovies, setSearchMovies] = useState<Movie[]>([]); const [searchTotal, setSearchTotal] = useState(0); const [searchNext, setSearchNext] = useState<string | null>(null);
  const [people, setPeople] = useState<PersonHit[]>([]); const [languagePeople, setLanguagePeople] = useState<PersonHit[]>([]); const requestedLanguage = searchParams.get("language"); const [selectedLanguage, setSelectedLanguage] = useState("te"); const language = requestedLanguage || selectedLanguage; const [category, setCategory] = useState("ALL"); const [languageCursor, setLanguageCursor] = useState<string | null>(null); const [languageTotal, setLanguageTotal] = useState(0); const [roleCounts, setRoleCounts] = useState<Record<string, number>>({});
  const [person, setPerson] = useState<Person | null>(null); const [personMovies, setPersonMovies] = useState<Movie[]>([]); const [personTotal, setPersonTotal] = useState(0); const [personNext, setPersonNext] = useState<string | null>(null); const [personFilter, setPersonFilter] = useState(""); const [personPane, setPersonPane] = useState("movies"); const [personRelations, setPersonRelations] = useState<PersonHit[]>([]); const [combinations, setCombinations] = useState<{ people: PersonHit[]; shared_movie_count: number }[]>([]);
  const [movie, setMovie] = useState<MovieDetail | null>(null); const [providers, setProviders] = useState<Provider[]>([]); const [showAllProviders, setShowAllProviders] = useState(false); const [moreBusy, setMoreBusy] = useState(false);

  useEffect(() => { let active = true; const value = headerQuery.trim(); if (!value) return () => { active = false; };
    const timer = window.setTimeout(() => { api.people(value).then((result) => { if (active) setSuggestions(((result.suggested_people?.length ? result.suggested_people : result.items)).slice(0, 5)); }).catch(() => { if (active) setSuggestions([]); }); }, 150);
    return () => { active = false; window.clearTimeout(timer); };
  }, [headerQuery]);

  useEffect(() => { let active = true; let settled = false;
    const loadingTimer = window.setTimeout(() => { if (active && !settled) setBusy(true); }, 0);
    const finish = () => { settled = true; window.clearTimeout(loadingTimer); if (active) setBusy(false); }; const fail = (reason: unknown) => { if (active) setError(reason instanceof Error ? reason.message : "Request failed"); };
    if (route.page === "home") {
      Promise.all([api.movies({ sort: "newest", limit: 12 }), api.movies({ language: "te", sort: "newest", limit: 14 }), api.movies({ language: "hi", sort: "newest", limit: 14 })]).then(async ([recent, te, hi]) => {
        if (!active) return; setHomeMovies(recent.items); const recentIds = new Set(recent.items.map((m) => m.id));
        setTeMovies(te.items.filter((m) => !recentIds.has(m.id)).slice(0, 10)); const teIds = new Set(te.items.map((m) => m.id));
        setHiMovies(hi.items.filter((m) => !recentIds.has(m.id) && !teIds.has(m.id)).slice(0, 10));
        if (recent.items[0]) api.movie(recent.items[0].id).then((detail) => { if (active) setHeroMovie(detail); }).catch(() => { if (active) setHeroMovie(null); });
      }).catch(fail).finally(finish);
    } else if (route.page === "search") {
      const movieParams: Record<string, string | number | undefined> = { q: query, limit: 30, sort: filters.sort, genre: filters.genre, language: filters.language, year: filters.year || undefined, provider: filters.provider };
      Promise.all([query ? api.search(query) : Promise.resolve({ people: { items: [] as PersonHit[] } }), api.movies(movieParams)]).then(async ([p, m]) => {
        if (!active) return;
        setSearchPeople(p.people.items); setSearchMovies(m.items); setSearchTotal(m.total); setSearchNext(m.next_cursor);
        if (p.people.items.length === 1) {
          const hit = p.people.items[0];
          const [profile, filmography] = await Promise.all([api.person(hit.id), api.personMovies(hit.id, "", 30)]);
          if (active) { setSearchPerson(profile); setSearchPersonMovies(filmography.items); setSearchPersonNext(filmography.next_cursor); }
        } else { setSearchPerson(null); setSearchPersonMovies([]); setSearchPersonNext(null); }
      }).catch(fail).finally(finish);
    } else if (route.page === "people" && route.id) {
      Promise.all([api.person(route.id), api.personMovies(route.id, "", 30)]).then(([p, m]) => { if (active) { setPerson(p); setPersonMovies(m.items); setPersonTotal(m.total); setPersonNext(m.next_cursor); setPersonFilter(""); setPersonPane("movies"); } }).catch(fail).finally(finish);
    } else if (route.page === "people") {
      const search = query ? api.people(query) : Promise.resolve({ items: [] as PersonHit[] });
      Promise.all([search, api.peopleLanguage(language, "", 60, category)]).then(([p, l]) => { if (active) { setPeople(p.items); setLanguagePeople(l.items); setLanguageCursor(l.next_cursor); setLanguageTotal(l.total_memberships); } }).catch(fail).finally(finish);
    } else if (route.page === "movies" && route.id) { api.movie(route.id).then((value) => { if (active) setMovie(value); }).catch(fail).finally(finish);
    } else if (route.page === "providers") { api.providers().then((value) => { if (active) setProviders(value.items); }).catch(fail).finally(finish);
    } else finish();
    return () => { active = false; };
  }, [route.page, route.id, query, queryString, language, category, filters]);

  useEffect(() => { if (route.page === "search") api.providers().then((result) => setProviders(result.items)).catch(() => setProviders([])); }, [route.page]);

  useEffect(() => { if (route.page === "people" && !route.id) Promise.all(["HEROES", "HEROINES", "DIRECTORS", "ACTORS"].map((role) => api.peopleLanguage("all", "", 1, role))).then((pages) => setRoleCounts(Object.fromEntries(["HEROES", "HEROINES", "DIRECTORS", "ACTORS"].map((role, index) => [role, pages[index].total_memberships])))).catch(() => setRoleCounts({})); }, [route.page, route.id]);

  useEffect(() => { if (route.page === "people" && !route.id) Promise.all(LEGEND_LANGUAGES.map((code) => api.peopleLanguage(code, "", 8, "ALL"))).then((pages) => setLegendRows(LEGEND_LANGUAGES.map((code, index) => ({ language: code, people: pages[index].items })))).catch(() => setLegendRows([])); }, [route.page, route.id]);

  useEffect(() => { if (route.page === "people" && person?.id === route.id && route.rawId.toLowerCase() !== `${personSlug(person.display_name)}-${person.id.toLowerCase()}`) router.replace(personHref(person.id, person.display_name)); }, [route.page, route.id, route.rawId, person, router]);

  const submitSearch = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const form = new FormData(event.currentTarget); const value = String(form.get("q") || "").trim(); if (!value) return; setHeaderQuery(value); setSuggestOpen(false); router.push(`/search?q=${encodeURIComponent(value)}`); };
  const submitFilters = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); const values = new FormData(event.currentTarget); const params = new URLSearchParams(); if (query) params.set("q", query); for (const key of ["genre", "language", "year", "provider", "sort"] as const) { const value = String(values.get(key) || ""); if (value) params.set(key, value); } router.push(`/search?${params.toString()}`); };
  const loadMoreSearch = async () => { if (!searchNext || moreBusy) return; setMoreBusy(true); try { const next = await api.movies({ q: query, limit: 30, cursor: searchNext, sort: filters.sort, genre: filters.genre, language: filters.language, year: filters.year || undefined, provider: filters.provider }); setSearchMovies((existing) => [...existing, ...next.items]); setSearchNext(next.next_cursor); } catch (reason) { setError(reason instanceof Error ? reason.message : "Request failed"); } finally { setMoreBusy(false); } };
  const loadMoreSearchPerson = async () => { if (!searchPerson || !searchPersonNext || moreBusy) return; setMoreBusy(true); try { const next = await api.personMovies(searchPerson.id, searchPersonNext, 30); setSearchPersonMovies((existing) => [...existing, ...next.items]); setSearchPersonNext(next.next_cursor); } catch (reason) { setError(reason instanceof Error ? reason.message : "Request failed"); } finally { setMoreBusy(false); } };
  const loadMorePerson = async (reset = false, nextFilter = personFilter) => { if (!person || moreBusy) return; setMoreBusy(true); try { const role = ROLE_ORDER.includes(nextFilter) ? nextFilter : undefined; const relation = nextFilter === "DIRECTOR" ? "DIRECTOR" : role ? "ACTOR" : undefined; const result = await api.personMovies(person.id, reset ? "" : personNext || "", 30, { role, relationship_type: relation }); setPersonMovies((existing) => reset ? result.items : [...existing, ...result.items]); setPersonTotal(result.total); setPersonNext(result.next_cursor); } catch (reason) { setError(reason instanceof Error ? reason.message : "Request failed"); } finally { setMoreBusy(false); } };
  const loadMoreLanguage = async () => { if (!languageCursor || moreBusy) return; setMoreBusy(true); try { const result = await api.peopleLanguage(language, languageCursor, 60, category); setLanguagePeople((existing) => [...existing, ...result.items]); setLanguageCursor(result.next_cursor); setLanguageTotal(result.total_memberships); } catch (reason) { setError(reason instanceof Error ? reason.message : "Request failed"); } finally { setMoreBusy(false); } };
  const switchPersonPane = async (pane: string) => { setPersonPane(pane); if (!person) return; try { if (pane === "coactors") setPersonRelations((await api.coactors(person.id)).items); if (pane === "combinations") setCombinations((await api.combinations(person.id)).items); } catch (reason) { setError(reason instanceof Error ? reason.message : "Request failed"); } };

  return <div className="app-shell">
    <header className="site-header"><div className="site-header-inner"><Link className="brand" href="/"><span className="brand-image-frame"><Image src="/brand/flixyfy-approved-emblem.png" alt="" width={56} height={56} unoptimized priority /></span><span className="brand-wordmark"><strong>FLIXYFY</strong><small>FIND · WATCH · ENJOY</small></span></Link>
      <nav className="primary-nav" aria-label="Primary navigation"><NavLink href="/" label="Home" icon="home" active={route.page === "home"} /><NavLink href="/search" label="Search" icon="search" active={route.page === "search"} /><NavLink href="/people" label="People" icon="people" active={route.page === "people"} /><NavLink href="/providers" label="Providers" icon="providers" active={route.page === "providers"} /></nav>
      <form className="header-search" onSubmit={submitSearch}><input role="combobox" name="q" value={headerQuery} onChange={(e) => { setHeaderQuery(e.target.value); setSuggestOpen(true); if (!e.target.value.trim()) setSuggestions([]); }} onFocus={() => setSuggestOpen(true)} onBlur={() => window.setTimeout(() => setSuggestOpen(false), 160)} placeholder="Search movies and people" aria-label="Search movies and people" autoComplete="off" aria-autocomplete="list" aria-expanded={Boolean(suggestOpen && headerQuery.trim() && suggestions.length > 0)} aria-controls={suggestOpen && headerQuery.trim() && suggestions.length > 0 ? "person-suggestions" : undefined} />{suggestOpen && headerQuery.trim() && suggestions.length > 0 && <div className="suggestion-panel" id="person-suggestions" role="listbox" aria-label="People suggestions"><span className="suggestion-label">PEOPLE</span>{suggestions.map((hit) => <Link role="option" aria-selected="false" key={hit.id} href={personHref(hit.id, hit.display_name)} onMouseDown={(e) => e.preventDefault()}><PersonAvatar person={hit} /><span className="suggestion-copy"><strong>{hit.display_name}</strong><small>{hit.filmography_total} films{hit.languages?.length ? ` · ${hit.languages.slice(0,2).map(langName).join(" · ")}` : ""}</small></span></Link>)}</div>}<button type="submit">Search</button></form>
    </div></header>
    <nav className="mobile-nav" aria-label="Mobile navigation"><NavLink href="/" label="Home" icon="home" active={route.page === "home"} /><NavLink href="/search" label="Search" icon="search" active={route.page === "search"} /><NavLink href="/people" label="People" icon="people" active={route.page === "people"} /><NavLink href="/providers" label="Providers" icon="providers" active={route.page === "providers"} /></nav>
    <main className="page-content" id="main-content" tabIndex={-1}>
      {error && <ErrorPanel message={error} />}
      {route.page === "home" && <>
        <section className="cinema-hero">
          <div className="hero-copy"><p className="eyebrow">INDIA&apos;S ULTIMATE MOVIE DISCOVERY PLATFORM</p><h1>Indian movies in<br /><span>every language.</span><br />Know where to watch.</h1><form className="hero-search" onSubmit={submitSearch}><input name="q" placeholder="Search movies, stars, and stories" aria-label="Search FLIXYFY" /><button type="submit">Search</button></form><div className="hero-links"><Link href="/search?sort=rating">Trending</Link><Link href="/search?sort=newest">New Releases</Link><Link href="/people">All Languages</Link><Link href="/search?sort=oldest">Classics 1960–1999</Link><Link href="/search?provider=youtube">Free on YouTube</Link></div></div>
          <aside className="hero-artwork" aria-label={heroMovie ? `Featured artwork for ${heroMovie.title}` : "FLIXYFY cinema artwork"}>
            {heroMovie?.backdrop ? <Image className="hero-art-backdrop" src={heroMovie.backdrop} alt="" fill sizes="(max-width:760px) 90vw, 45vw" unoptimized priority /> : <div className="hero-art-empty"><span>FLIXYFY</span><small>INDIAN CINEMA · EVERY LANGUAGE</small></div>}
            {heroMovie?.poster && <div className="hero-art-poster"><Image src={heroMovie.poster} alt={`Poster for ${heroMovie.title}`} fill sizes="160px" unoptimized /></div>}
            {heroMovie && <Link href={movieHref(heroMovie.id)} className="hero-feature"><span>FEATURED FILM</span><strong>{heroMovie.title}</strong><small>{heroMovie.year || "Classic"} · {langName(heroMovie.language)}</small></Link>}
          </aside>
        </section>
        {busy && !homeMovies.length ? <div className="loading-skeleton">Loading the catalog…</div> : <><MovieRail title="Recently Released" subtitle="Fresh additions, ordered by release date" items={homeMovies} /><MovieRail title="Telugu Cinema" subtitle="Across generations of Telugu storytelling" items={teMovies} /><MovieRail title="Hindi Cinema" subtitle="Discover stories from Hindi-language cinema" items={hiMovies} /></>}
      </>}
      {route.page === "search" && <>
        <section className="page-intro"><p className="eyebrow">SEARCH THE CATALOG</p><h1>{query ? `Results for “${query}”` : "Discover a movie"}</h1><p>Find movies and accepted People identities in one place.</p></section>
        <form className="filter-panel" key={queryString} onSubmit={submitFilters}><label>Genre<select name="genre" defaultValue={filters.genre}><option value="">All genres</option>{catalogFilterOptions.genres.map((genre) => <option key={genre} value={genre}>{genre.replace(/\b\w/g, (letter) => letter.toUpperCase())}</option>)}</select></label><label>Language<select name="language" defaultValue={filters.language}><option value="">All languages</option>{LANGUAGES.filter((code) => code !== "all").map((code) => <option key={code} value={code}>{langName(code)}</option>)}</select></label><label>Year<select name="year" defaultValue={filters.year}><option value="">All years</option>{catalogFilterOptions.years.map((year) => <option key={year} value={year}>{year}</option>)}</select></label><label>Provider<select name="provider" defaultValue={filters.provider}><option value="">All providers</option>{providers.slice().sort((a, b) => providerMeta(a.key, a.friendly_name).name.localeCompare(providerMeta(b.key, b.friendly_name).name)).map((provider) => <option key={provider.key} value={provider.key}>{providerMeta(provider.key, provider.friendly_name).name}</option>)}</select></label><label>Sort<select name="sort" defaultValue={filters.sort}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="rating">Rating</option></select></label><button type="submit">Apply filters</button></form>
        {query && searchPerson && <section className="people-section search-person-result"><Section title="Person" subtitle={`${searchPerson.filmography_total} accepted films`} /><Link className="search-person-heading" href={personHref(searchPerson.id, searchPerson.display_name)}><PersonAvatar person={searchPerson} large /><span><strong>{searchPerson.display_name}</strong><small>{searchPerson.filmography_total} accepted films · {(searchPerson.languages ?? []).slice(0,3).map(langName).join(" · ")}</small></span><span aria-hidden="true">View profile ↗</span></Link><div className="movie-grid">{searchPersonMovies.map((item) => <MovieCard key={item.id} movie={item} />)}</div>{searchPersonNext && <button className="gold-button load-more" onClick={loadMoreSearchPerson} disabled={moreBusy}>{moreBusy ? "Loading…" : "Load more films"}</button>}</section>}
        {query && searchPeople.length > 1 && <section className="people-section"><Section title="Choose a Person" subtitle="These are separate accepted identities" /><PersonRows people={searchPeople} /></section>}
        <section><Section title="Movies" subtitle={`${searchTotal.toLocaleString()} accepted results`} />{searchMovies.length ? <div className="movie-grid">{searchMovies.map((item) => <MovieCard key={item.id} movie={item} />)}</div> : <div className="empty-state">{busy ? "Searching the accepted catalog…" : "No movies match these filters."}</div>}{searchNext && <button className="gold-button load-more" onClick={loadMoreSearch} disabled={moreBusy}>{moreBusy ? "Loading…" : "Load more movies"}</button>}</section>
      </>}
      {route.page === "people" && !route.id && <>
        <section className="page-intro"><p className="eyebrow">THE PEOPLE BEHIND THE STORIES</p><h1>Meet the makers.</h1><p>Search accepted names and aliases across the V3 Person graph.</p></section>
        <form className="hero-search people-search" key={query} onSubmit={(event) => { event.preventDefault(); const q = String(new FormData(event.currentTarget).get("q") || "").trim(); router.push(q ? `/people?q=${encodeURIComponent(q)}` : "/people"); }}><input name="q" defaultValue={query} placeholder="Try ANR, NTR, Jr NTR, or Sundeep Kishan" aria-label="Search people" /><button type="submit">Find people</button></form>
        {query && <section className="people-section"><Section title="Search results" subtitle="Canonical V3 identities" />{people.length ? <PersonRows people={people} /> : <div className="empty-state">No exact Person match.</div>}</section>}
        <section className="people-section"><Section title="Browse by language" subtitle={`${languageTotal.toLocaleString()} priority People · search reaches all accepted identities`} /><div className="discovery-tabs" role="group" aria-label="People category">{DISCOVERY_CATEGORIES.map((item) => <button key={item.id} className={category === item.id ? "active" : ""} aria-pressed={category === item.id} onClick={() => { setCategory(item.id); setLanguagePeople([]); }}>{item.label}{roleCounts[item.id] !== undefined && <span className="role-count" aria-label="accepted across all languages">{roleCounts[item.id].toLocaleString()}</span>}</button>)}</div><div className="language-tabs" role="group" aria-label="People language">{LANGUAGES.map((code) => <button key={code} className={language === code ? "active" : ""} aria-pressed={language === code} onClick={() => { if (requestedLanguage) router.push(`/people?language=${code}`); else setSelectedLanguage(code); setLanguagePeople([]); }}>{langName(code)}</button>)}</div>{category === "HEROES" && languageTotal <= 1 && <p className="empty-state role-coverage-note">Only {languageTotal} accepted Hero / Lead classification is currently available for this language. Browse All or Actors for the broader catalog.</p>}{category === "HEROINES" && languageTotal <= 2 && <p className="empty-state role-coverage-note">Only {languageTotal} accepted Heroine / Lead classifications are currently available for this language. Browse All or Actors for the broader catalog.</p>}{category === "DIRECTORS" && languageTotal === 0 && <p className="empty-state role-coverage-note">No accepted Director classifications are available for this language yet. Browse All or Actors for the broader catalog.</p>}<PersonRows people={languagePeople} />{languageCursor && <button className="gold-button load-more" onClick={loadMoreLanguage} disabled={moreBusy}>{moreBusy ? "Loading…" : "Load more people"}</button>}</section>
        {legendRows.length > 0 && <LegendsSection rows={legendRows.filter((row) => row.people.length > 0)} />}
      </>}
      {route.page === "people" && route.id && person?.id === route.id && <>
        <section className="person-hero"><PersonAvatar person={person} large /><div className="person-hero-copy"><p className="eyebrow">V3 CANONICAL PERSON</p><h1>{person.display_name}</h1>{person.birth_verification_status === "ACCEPTED" && person.date_of_birth && <p className="accepted-birthday">Born {person.date_of_birth}</p>}{person.aliases.length > 0 && <p className="person-aliases">Also known as {person.aliases.slice(0, 8).join(" · ")}</p>}<div className="language-tabs read-only">{(person.languages ?? []).map((item) => <span key={item}>{langName(item)}</span>)}</div><p className="filmography-total">{person.filmography_total} accepted films</p></div></section>
        <div className="person-tabs"><button className={personPane === "movies" ? "active" : ""} onClick={() => switchPersonPane("movies")}>Filmography <span>{person.filmography_total}</span></button><button className={personPane === "coactors" ? "active" : ""} onClick={() => switchPersonPane("coactors")}>Co-actors</button><button className={personPane === "combinations" ? "active" : ""} onClick={() => switchPersonPane("combinations")}>Combinations</button></div>
        {personPane === "movies" && <section><p className="section-subtitle">{personTotal} credits in this view</p>{person.role_inference?.status === "INFERRED" && <p className="section-subtitle">{ROLE_LABEL[person.role_inference.inferred_presentation_role ?? ""]} is inferred from {person.role_inference.verified_lead_credit_counts[person.role_inference.inferred_presentation_role ?? ""] ?? person.role_inference.threshold} verified lead films. Inferred labels are person-level defaults, not verified movie-specific credits.</p>}<div className="role-filters"><button className={!personFilter ? "active" : ""} onClick={() => { setPersonFilter(""); void loadMorePerson(true, ""); }}>All</button>{ROLE_ORDER.filter((role) => (person.effective_role_counts?.[role] || 0) > 0).map((role) => <button key={role} className={personFilter === role ? "active" : ""} onClick={() => { setPersonFilter(role); void loadMorePerson(true, role); }}>{ROLE_LABEL[role]}</button>)}{(person.relationship_counts?.DIRECTOR || 0) > 0 && <button className={personFilter === "DIRECTOR" ? "active" : ""} onClick={() => { setPersonFilter("DIRECTOR"); void loadMorePerson(true, "DIRECTOR"); }}>Director</button>}</div>{personMovies.length ? <div className="movie-grid">{personMovies.map((item) => <MovieCard key={item.id} movie={item} />)}</div> : <div className="empty-state">{busy ? "Loading filmography…" : "No accepted films in this category."}</div>}{personNext && <button className="gold-button load-more" onClick={() => void loadMorePerson()} disabled={moreBusy}>{moreBusy ? "Loading…" : "Load more films"}</button>}</section>}
        {personPane === "coactors" && (personRelations.length ? <section><Section title="Shared credits" subtitle="People connected through accepted movie credits" /><PersonRows people={personRelations} /></section> : <div className="empty-state">No co-actors in the accepted graph.</div>)}
        {personPane === "combinations" && <section><Section title="Frequent combinations" subtitle="Other people sharing movies in this accepted graph" /><div className="combination-list">{combinations.map((item) => <div key={item.people.map((x) => x.id).join("-")}>{item.people.map((x, index) => <span key={x.id}>{index > 0 && " + "}<Link href={personHref(x.id, x.display_name)}>{x.display_name}</Link></span>)}<small>{item.shared_movie_count} shared films</small></div>)}</div></section>}
      </>}
      {route.page === "movies" && movie && <MovieDetailView movie={movie} />}
       {route.page === "providers" && <><section className="page-intro"><p className="eyebrow">ACCEPTED AVAILABILITY</p><h1>Where to watch.</h1><p>Explore movies associated with accepted India provider offers.</p></section>{(() => { const sorted = providers.slice().sort((a, b) => b.movie_count - a.movie_count || providerMeta(a.key, a.friendly_name).name.localeCompare(providerMeta(b.key, b.friendly_name).name)); const primary = sorted.filter((item) => item.movie_count >= 100); const visible = showAllProviders ? sorted : primary; return <><div className="provider-grid">{visible.map((provider) => { const meta = providerMeta(provider.key, provider.friendly_name, provider.logo); return <Link className="provider-card" href={`/search?provider=${encodeURIComponent(provider.key)}&sort=newest`} key={provider.key}><ProviderLogo meta={meta} compact /><span className="provider-copy"><strong>{meta.name}</strong><small>{provider.movie_count.toLocaleString()} accepted movies</small></span><span className="provider-card-arrow" aria-hidden="true">↗</span></Link>; })}</div>{sorted.length > primary.length && <button className="gold-button load-more" aria-expanded={showAllProviders} onClick={() => setShowAllProviders((current) => !current)}>{showAllProviders ? "Show major providers" : `View all ${sorted.length.toLocaleString()} providers`}</button>}</>; })()}</>}
      {busy && route.page !== "home" && route.page !== "search" && (!person || person.id !== route.id) && !movie && <div className="loading-skeleton">Loading accepted data…</div>}
    </main><footer className="site-footer"><Link href="/">FLIXYFY</Link><span>Canonical FXM movies · FXP people · Accepted V3 data</span></footer>
  </div>;
}

function ProviderLogo({ meta, compact = false }: { meta: { name: string; logo?: string }; compact?: boolean }) {
  const [failed, setFailed] = useState(false);
  return <span className={`provider-logo${compact ? " compact" : ""}`}>{meta.logo && !failed ? <Image src={meta.logo} alt={`${meta.name} logo`} width={compact ? 48 : 60} height={compact ? 48 : 60} style={{ width: "auto", height: "auto" }} unoptimized onError={() => setFailed(true)} /> : <span aria-label={`${meta.name} logo unavailable`}>{meta.name.slice(0, 2).toUpperCase()}</span>}</span>;
}
function NavIcon({ name }: { name: string }) {
  const paths: Record<string, ReactNode> = {
    home: <><path d="m3 10 9-7 9 7"/><path d="M5 9v11h14V9M9 20v-7h6v7"/></>,
    search: <><circle cx="10.8" cy="10.8" r="6.8"/><path d="m16 16 5 5"/></>,
    people: <><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0M16 5a3.5 3.5 0 0 1 0 6.8M18 14a5.5 5.5 0 0 1 3.5 5"/></>,
    language: <><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></>,
    providers: <><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 8h4v4H7zM14 8h3M14 12h3M7 16h10"/></>,
  };
  return <svg className="nav-icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}
function NavLink({ href, label, icon, active = false }: { href: string; label: string; icon: string; active?: boolean }) {
  return <Link className="nav-item" href={href} aria-current={active ? "page" : undefined}><NavIcon name={icon} /><span>{label}</span></Link>;
}
function LegendsSection({ rows }: { rows: { language: string; people: PersonHit[] }[] }) {
  if (!rows.length) return null;
  return <section className="legends-section" aria-labelledby="legends-title"><div className="legends-heading"><p className="eyebrow">INDIAN CINEMA · ICONS ACROSS GENERATIONS</p><h2 id="legends-title">Legends</h2><p>Celebrating the artists carried through our accepted people catalog.</p></div>{rows.map(({ language, people }) => <div className="legend-language-row" key={language}><div className="legend-row-title"><h3>{langName(language)} Legends</h3><Link href={`/people?language=${language}`}>Explore {langName(language)} people <span aria-hidden="true">↗</span></Link></div><div className="legend-portraits">{people.map((person) => <Link className="legend-person" href={personHref(person.id, person.display_name)} key={person.id}><PersonAvatar person={person} large /><strong>{person.display_name}</strong><small>{langName(language)}</small></Link>)}</div></div>)}</section>;
}
function MovieDetailView({ movie }: { movie: MovieDetail }) {
  const [showAllCast, setShowAllCast] = useState(false);
  const [relatedResult, setRelatedResult] = useState<{ movieId: string; items: Movie[] }>({ movieId: "", items: [] });
  const relatedGenre = movie.genres[0] ?? "";
  useEffect(() => {
    let active = true;
    if (!relatedGenre) return () => { active = false; };
    api.movies({ genre: relatedGenre, limit: 20, sort: "newest" })
      .then((result) => { if (active) setRelatedResult({ movieId: movie.id, items: result.items.filter((item) => item.id !== movie.id).slice(0, 6) }); })
      .catch(() => { if (active) setRelatedResult({ movieId: movie.id, items: [] }); });
    return () => { active = false; };
  }, [movie.id, relatedGenre]);
  const relatedMovies = relatedResult.movieId === movie.id ? relatedResult.items : [];
  const cast = movie.cast.filter((credit) => credit.name && credit.name !== "Name under review" && /^FXP\d{8}$/.test(credit.person_id));
  const providerOffers = movie.providers.map((provider) => {
    const meta = providerMeta(provider.key);
    return { ...provider, meta, destination: safeProviderUrl(provider.url) ?? safeProviderUrl(meta.homeUrl) };
  });
  const youtube = movie.youtube.slice(0, 3);
  const backdrop = movie.backdrop?.startsWith("/") ? `https://image.tmdb.org/t/p/original${movie.backdrop}` : movie.backdrop;
  return <article className="movie-detail">
    <section className="detail-hero" style={backdrop ? { backgroundImage: `linear-gradient(90deg,rgba(5,5,5,.96) 0%,rgba(5,5,5,.77) 52%,rgba(5,5,5,.48) 100%),linear-gradient(0deg,#050505 0%,transparent 55%),url("${backdrop}")` } : undefined}>
      <div className="detail-poster">{movie.poster ? <Image src={movie.poster} alt={`Poster for ${movie.title}`} fill sizes="(max-width:760px) 35vw,280px" unoptimized priority /> : <div className="poster-fallback large"><span>{movie.title.slice(0, 1)}</span><small>FLIXYFY CLASSIC</small></div>}</div>
      <div className="detail-copy"><p className="eyebrow">{movie.year && movie.year < 1970 ? "FROM THE ARCHIVE" : "INDIAN CINEMA"}</p><h1>{movie.title}</h1>{movie.original_title && movie.original_title !== movie.title && <p className="original-title">{movie.original_title}</p>}
        <div className="detail-meta">{movie.year && <span>{movie.year}</span>}<span>{langName(movie.language)}</span>{movie.runtime && <span>{movie.runtime} min</span>}{movie.rating && <span aria-label="Rating">★ {movie.rating.toFixed(1)}</span>}</div>{movie.genres.length > 0 && <div className="genre-chips">{movie.genres.map((genre) => <span key={genre}>{genre.replace(/\b\w/g, (letter) => letter.toUpperCase())}</span>)}</div>}<p className="detail-overview hero-overview">{movie.overview || "A story from Indian cinema. More details are not available for this title yet."}</p>
      </div>
      <div className="hero-watch-grid"><section className="hero-watch-section"><Section title="Where to Watch in India" subtitle="OTT and store options" />{providerOffers.length ? <div className="offer-grid">{providerOffers.map((offer) => <div className="offer-card offer-cta" key={offer.key}><ProviderLogo meta={offer.meta} compact /><span className="offer-copy"><strong>{offer.meta.name}</strong><small>{offer.offer_count > 1 ? `${offer.offer_count} accepted offers` : "Availability confirmed"}</small></span>{offer.destination ? <a className="offer-action" href={offer.destination} target="_blank" rel="noopener noreferrer">Watch on {offer.meta.name}<span className="external-mark" aria-hidden="true">↗</span></a> : <span className="offer-status">Available on {offer.meta.name}</span>}</div>)}</div> : <p className="empty-state">No accepted India streaming offer is listed.</p>}</section><section className="hero-watch-section hero-youtube-section"><Section title="Watch Free on YouTube" subtitle="Approved full-movie links" />{youtube.length ? <div className="youtube-actions">{youtube.map((item, index) => <a className="youtube-action" href={item.watch_url} key={`${item.watch_url}-${index}`} target="_blank" rel="noopener noreferrer"><Image className="youtube-logo" src="/youtube.svg" alt="YouTube" width={32} height={23} unoptimized /><span><strong>YouTube · {item.language ? langName(item.language) : "Full movie"}</strong><small>Watch full movie free</small></span><span className="external-mark" aria-hidden="true">↗</span></a>)}</div> : <p className="empty-state">No approved YouTube full-movie link available.</p>}</section></div>
    </section>
    <div className="detail-body">
      <section className="detail-section description-section"><Section title="Overview" /><p className="detail-overview">{movie.overview || "A story from Indian cinema. More details are not available for this title yet."}</p></section>
      {cast.length > 0 && <section className="detail-section"><Section title="Cast & Crew" subtitle="People connected through accepted V3 movie credits" /><div className="cast-grid">{cast.slice(0, showAllCast ? cast.length : 12).map((credit) => <Link className="cast-card" href={personHref(credit.person_id, credit.name)} key={`${credit.person_id}-${credit.relationship_type}`}><span className="cast-avatar">{credit.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase()}</span><span><strong>{credit.name}</strong><small>{credit.relationship_type === "DIRECTOR" ? "Director" : ROLE_LABEL[credit.role] || "Actor"}</small></span></Link>)}</div>{cast.length > 12 && <button type="button" className="cast-toggle" aria-expanded={showAllCast} onClick={() => setShowAllCast((current) => !current)}>{showAllCast ? "Show less" : "View full cast"}</button>}</section>}
      <section className="detail-section related-section"><Section title="Related" subtitle={relatedGenre ? `More ${relatedGenre} movies` : "More accepted movies"} />{relatedMovies.length ? <div className="movie-grid">{relatedMovies.map((related) => <MovieCard key={related.id} movie={related} />)}</div> : <p className="empty-state">No related movies are available yet.</p>}</section>
    </div>
  </article>;
}

