"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Film, Sparkles } from "lucide-react";
import {
  apiFetch,
  normalizeBackdropUrl,
  normalizePosterUrl,
  type Movie,
} from "@/lib/api";
import AppShell from "./AppShell";
import MovieCard from "./MovieCard";
import SearchInput from "./SearchInput";

type HomeApiMovie = Partial<Movie> & {
  canonical_movie_id: Movie["canonical_movie_id"];
  tmdb_id: number | null;
  title: string;
  poster?: string | null;
  backdrop?: string | null;
  rating?: number | null;
  youtube_count?: number;
};

type HomePayload = {
  current?: { items?: HomeApiMovie[] };
  historical?: { items?: HomeApiMovie[] };
  webseries?: { items?: HomeApiMovie[] };
  hollywood?: { items?: HomeApiMovie[] };
};

type HomeDiscoveryPayload = {
  hero?: HomeApiMovie[];
  trending?: HomeApiMovie[];
  new_releases?: HomeApiMovie[];
  languages?: Partial<Record<"te" | "hi" | "ta" | "kn" | "ml", HomeApiMovie[]>>;
  classics?: HomeApiMovie[];
  youtube?: HomeApiMovie[];
};

const shortcuts = [
  { label: "Trending", href: "/search?sort=popular" },
  { label: "New Releases", href: `/search?year=${new Date().getFullYear()}` },
  { label: "All Languages", href: "/#language-movies" },
  { label: "Classics 1960-1999", href: "/search?q=Indian%20classics" },
  { label: "Free on YouTube", href: "/search?provider=youtube" },
] as const;

const languageRails = [
  { key: "te", label: "Top Telugu" },
  { key: "hi", label: "Top Hindi" },
  { key: "ta", label: "Top Tamil" },
  { key: "kn", label: "Top Kannada" },
  { key: "ml", label: "Top Malayalam" },
] as const;

function homeApiMovieToMovie(
  item: HomeApiMovie,
  fallbackDomain: Movie["domain"],
): Movie {
  const domain: Movie["domain"] =
    item.domain === "historical"
      ? "historical"
      : item.domain === "current"
        ? "current"
        : fallbackDomain;

  return {
    canonical_movie_id: item.canonical_movie_id,
    tmdb_id: item.tmdb_id ?? null,
    movie_identity: item.movie_identity,
    imdb_id: item.imdb_id,
    title: item.title,
    original_title: item.original_title,
    release_year: item.release_year,
    domain,
    original_language: item.original_language,
    language_name: item.language_name,
    runtime: item.runtime,
    overview: item.overview,
    poster_url: normalizePosterUrl(item.poster ?? item.poster_url) || null,
    backdrop_url: normalizeBackdropUrl(item.backdrop ?? item.backdrop_url) || null,
    tmdb_rating: item.rating ?? item.tmdb_rating,
    imdb_rating: item.imdb_rating,
    provider_count: item.provider_count ?? 0,
    youtube_video_count: item.youtube_count ?? item.youtube_video_count,
    availability_count: item.availability_count,
    providers: Array.isArray(item.providers) ? item.providers : [],
    availability: item.availability,
    availability_summary: item.availability_summary,
    matched_fields: item.matched_fields,
  };
}

function movieLanguage(movie: Movie) {
  return (movie.original_language ?? "").trim().toLowerCase();
}

export default function HomeClient() {
  const [currentItems, setCurrentItems] = useState<Movie[]>([]);
  const [historicalItems, setHistoricalItems] = useState<Movie[]>([]);
  const [fullLanguageMovieSections, setFullLanguageMovieSections] = useState<
    Array<{ key: string; label: string; items: Movie[] }>
  >([]);
  const [fullClassicItems, setFullClassicItems] = useState<Movie[]>([]);
    const [homeError, setHomeError] = useState("");

  const [aggregateHeroItems, setAggregateHeroItems] = useState<Movie[]>([]);
  const [aggregateNewReleaseItems, setAggregateNewReleaseItems] = useState<Movie[]>([]);
  const [aggregateYoutubeItems, setAggregateYoutubeItems] = useState<Movie[]>([]);
  const [aggregateLoaded, setAggregateLoaded] = useState(false);
  const [aggregateAttempted, setAggregateAttempted] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadAggregate() {
      try {
        const response = await apiFetch<HomeDiscoveryPayload>(
          "/api/v4/discovery/home",
        );
        const languageKeys = ["te", "hi", "ta", "kn", "ml"] as const;
        const languages = response.languages;
        const valid =
          Array.isArray(response.hero) &&
          Array.isArray(response.trending) &&
          Array.isArray(response.new_releases) &&
          Array.isArray(response.classics) &&
          languages &&
          languageKeys.every((key) => Array.isArray(languages[key]));

        if (!valid) throw new Error("Invalid homepage discovery response");
        if (!active) return;

        const normalize = (
          items: HomeApiMovie[] | undefined,
          fallbackDomain: Movie["domain"],
        ) => (items ?? []).map((item) => homeApiMovieToMovie(item, fallbackDomain));

        setAggregateHeroItems(normalize(response.hero, "current"));
        setAggregateNewReleaseItems(normalize(response.new_releases, "current"));
        setAggregateYoutubeItems(normalize(response.youtube, "current"));
        setCurrentItems(normalize(response.trending, "current"));
        setHistoricalItems(normalize(response.classics, "historical"));
        setFullLanguageMovieSections(
          languageKeys
            .map((key) => ({
              key,
              label:
                languageRails.find((language) => language.key === key)?.label ??
                key,
              items: normalize(languages[key], "current")
                .filter(
                  (movie) =>
                    movie.domain === "current" &&
                    movieLanguage(movie) === key &&
                    Boolean(movie.poster_url),
                )
                .slice(0, 12),
            }))
            .filter((section) => section.items.length > 0),
        );
        setFullClassicItems(
          normalize(response.classics, "historical")
            .filter(
              (movie) =>
                movie.domain === "historical" &&
                Number(movie.release_year) >= 1960 &&
                Number(movie.release_year) <= 1999 &&
                Boolean(movie.poster_url),
            )
            .slice(0, 12),
        );
        setAggregateLoaded(true);
        setAggregateAttempted(true);
        setHomeError("");
      } catch {
        if (active) setAggregateAttempted(true);
      }
    }

    void loadAggregate();
    return () => {
      active = false;
    };
  }, []);

  const allMovieItems = useMemo(
    () => [...currentItems, ...historicalItems],
    [currentItems, historicalItems],
  );

  useEffect(() => {
    if (!aggregateAttempted || aggregateLoaded) return;

    let active = true;
    const currentYear = new Date().getFullYear();

    async function loadFullCatalogRails() {
      try {
        const homeResponse = await apiFetch<HomePayload>("/api/v4/home?limit=36");
        setCurrentItems((homeResponse.current?.items ?? []).map((item) => homeApiMovieToMovie(item, "current")));
        setHistoricalItems((homeResponse.historical?.items ?? []).map((item) => homeApiMovieToMovie(item, "historical")));
        const languageSections = await Promise.all(
          languageRails.map(async (language) => {
            const params = new URLSearchParams({
              language: language.key,
              year_from: "2000",
              year_to: String(currentYear),
              sort: "popular",
              limit: "48",
            });

            const response = await apiFetch<{
              items?: Movie[];
              results?: Movie[];
              total?: number;
              limit?: number;
            }>(`/api/v4/movies?${params.toString()}`);

            const items = (response.items ?? response.results ?? [])
              .filter(
                (movie) =>
                  movie.domain === "current" &&
                  movieLanguage(movie) === language.key &&
                  Boolean(movie.poster_url),
              )
              .slice(0, 12);

            return { ...language, items };
          }),
        );

        const classicsParams = new URLSearchParams({
          year_from: "1960",
          year_to: "1999",
          sort: "popular",
          limit: "48",
        });

        const classicsResponse = await apiFetch<{
          items?: Movie[];
          results?: Movie[];
          total?: number;
          limit?: number;
        }>(`/api/v4/movies?${classicsParams.toString()}`);

        const classics = (classicsResponse.items ?? classicsResponse.results ?? [])
          .filter(
            (movie) =>
              movie.domain === "historical" &&
              Number(movie.release_year) >= 1960 &&
              Number(movie.release_year) <= 1999 &&
              Boolean(movie.poster_url),
          )
          .slice(0, 12);

        if (!active) return;

        setFullLanguageMovieSections(
          languageSections.filter((section) => section.items.length > 0),
        );
        setFullClassicItems(classics);
      } catch {
        if (!active) return;
        setFullLanguageMovieSections([]);
        setFullClassicItems([]);
        setHomeError("Movie data is temporarily unavailable.");
      }
    }

    void loadFullCatalogRails();

    return () => {
      active = false;
    };
  }, [aggregateAttempted, aggregateLoaded]);
  const fallbackHeroMovies = useMemo(() => {
    const candidates = allMovieItems.filter((movie) => movie.poster_url);

    return candidates
      .sort(
        (a, b) =>
          Number(b.tmdb_rating ?? b.imdb_rating ?? 0) -
          Number(a.tmdb_rating ?? a.imdb_rating ?? 0),
      )
      .slice(0, 5);
  }, [allMovieItems]);

  const heroMovies = aggregateLoaded ? aggregateHeroItems : fallbackHeroMovies;
  const heroBackdropMovie = heroMovies.find((movie) => movie.backdrop_url) ?? heroMovies[0];
  const heroSupportMovies = heroMovies.filter((movie) => movie.poster_url).slice(0, 2);

  const heroBackground = useMemo(
    () =>
      heroBackdropMovie?.backdrop_url ??
      heroBackdropMovie?.poster_url ??
      "",
    [heroBackdropMovie],
  );

  const fallbackLanguageMovieSections = useMemo(
    () =>
      languageRails
        .map((language) => ({
          ...language,
          items: currentItems
            .filter((movie) => movieLanguage(movie) === language.key)
            .slice(0, 12),
        }))
        .filter((section) => section.items.length > 0),
    [currentItems],
  );

  const languageMovieSections = aggregateLoaded
    ? fullLanguageMovieSections
    : fallbackLanguageMovieSections;
  const fallbackNewReleaseItems = useMemo(
    () =>
      [...currentItems]
        .filter((movie) => movie.release_year)
        .sort((a, b) => Number(b.release_year) - Number(a.release_year))
        .slice(0, 12),
    [currentItems],
  );

  const fallbackClassicItems = useMemo(
    () =>
      historicalItems
        .filter(
          (movie) =>
            Number(movie.release_year) >= 1960 &&
            Number(movie.release_year) <= 1999,
        )
        .slice(0, 12),
    [historicalItems],
  );

  const newReleaseItems = aggregateLoaded
    ? aggregateNewReleaseItems
    : fallbackNewReleaseItems;
  const classicItems = aggregateLoaded
    ? fullClassicItems
    : fallbackClassicItems;
  const heroStyle = heroBackground
    ? ({
        "--flixyfy-hero-backdrop": `url("${heroBackground}")`,
      } as React.CSSProperties)
    : undefined;

  return (
    <AppShell>
      <main className="page-content flixyfy-target-home v3-home">
        <section
          className="target-hero v3-target-hero"
          style={heroStyle}
          aria-labelledby="target-home-title"
        >
          <div className="target-hero-copy">
            <div className="target-eyebrow">
              <Sparkles size={14} aria-hidden="true" />
              India&apos;s ultimate movie discovery platform
            </div>

            <h1 id="target-home-title">
              <span>Indian movies in every language.</span>
              <strong>Know where to watch.</strong>
            </h1>

            <SearchInput large />

            <div
              className="target-search-chips"
              aria-label="Homepage discovery shortcuts"
            >
              {shortcuts.map((shortcut) => (
                <a
                  href={shortcut.href}
                  key={shortcut.label}
                >
                  {shortcut.label}
                </a>
              ))}
            </div>
          </div>

          <div className="target-hero-art v3-hero-art" aria-label="Movie artwork">
            {heroMovies.length > 0 ? (
              <>
                <div className="target-hero-backdrop">
                  <img
                    src={heroBackdropMovie?.backdrop_url || heroBackdropMovie?.poster_url || ""}
                    alt=""
                  />
                </div>
                <div className="target-hero-stack v3-hero-stack">
                  {heroSupportMovies.map((movie, index) => (
                    <a
                      href={"/movie/" + encodeURIComponent(movie.canonical_movie_id) + "?domain=" + movie.domain}
                      className={"target-hero-poster target-hero-poster-" + (index + 1)}
                      key={movie.canonical_movie_id}
                      aria-label={"Open " + movie.title}
                    >
                      <img src={movie.poster_url || ""} alt="" />
                    </a>
                  ))}
                </div>
              </>
            ) : (
              <div className="target-hero-art-fallback">
                <strong>FLIXYFY</strong>
                <small>FIND ┬╖ WATCH ┬╖ ENJOY</small>
              </div>
            )}
          </div>
        </section>

        <section
          className="content-section poster-section target-primary-rail"
          aria-labelledby="discover-india-title"
        >
          <div className="section-heading target-section-heading">
            <div>
              <small>DISCOVER</small>
              <h2 id="discover-india-title">Trending in India</h2>
            </div>
            <a href="/search">
              Explore all <ArrowRight size={16} aria-hidden="true" />
            </a>
          </div>

          {currentItems.length > 0 ? (
            <div
              className="poster-row target-poster-row"
              tabIndex={0}
              aria-label="Trending in India"
            >
              {currentItems.slice(0, 12).map((movie) => (
                <MovieCard movie={movie} key={movie.canonical_movie_id} />
              ))}
            </div>
          ) : (
            <div className="target-home-data-state">
              <Film size={21} aria-hidden="true" />
              <span>
                {homeError
                  ? "Movie data is temporarily unavailable."
                  : "Loading Indian movies..."}
              </span>
            </div>
          )}
        </section>

        <div id="language-movies" className="v3-language-movie-groups">
        {[
          { key: "new-releases", title: "New Releases", items: newReleaseItems },
          ...languageMovieSections.map((section) => ({
            key: section.key,
            title: section.label,
            items: section.items,
            language: section.key,
          })),
          { key: "classics", title: "Classics & Old Gems", items: classicItems },
          ...(aggregateLoaded && aggregateYoutubeItems.length > 0
            ? [{ key: "youtube", title: "Free Movies on YouTube", items: aggregateYoutubeItems }]
            : []),
        ].filter((section) => section.items.length > 0).map((section) => (
          <section
            className="content-section poster-section"
            key={section.key}
            aria-labelledby={`section-${section.key}`}
          >
            <div className="section-heading target-section-heading">
              <div>
                <small>DISCOVER</small>
                <h2 id={`section-${section.key}`}>{section.title}</h2>
              </div>
              <a href={section.key === "new-releases" ? `/search?year=${new Date().getFullYear()}` : section.key === "classics" ? "/search?q=Indian%20classics" : "language" in section ? `/search?language=${section.language}` : "/search"}>
                View all <ArrowRight size={16} aria-hidden="true" />
              </a>
            </div>

            <div
              className="poster-row target-poster-row"
              tabIndex={0}
              aria-label={`${section.title} poster row`}
            >
              {section.items.slice(0, 12).map((movie) => (
                <MovieCard movie={movie} key={movie.canonical_movie_id} />
              ))}
            </div>
          </section>
        ))}
        </div>
      </main>
    </AppShell>
  );
}
