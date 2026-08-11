"use client";

import { useEffect, useMemo, useState } from "react";
import { CalendarDays, Clock3, Languages, Star } from "lucide-react";
import { apiFetch, movieApiPath, type AvailabilityOption, type Movie, type Provider } from "@/lib/api";
import AppShell from "./AppShell";
import ProviderButtons from "./ProviderButtons";

type Person = {
  person_id?: number | null;
  name: string;
  role?: string | null;
  character_name?: string | null;
};

type MovieDetail = Movie & {
  genres: { genre_id: number; genre_name: string }[];
  languages: { iso_639_1: string; language_name: string }[];
  cast: Person[];
  crew: Person[];
  providers: Provider[];
  availability?: AvailabilityOption[];
  awards?: string | null;
  metascore?: number | null;
};

type BackendMovieDetail = MovieDetail & {
  youtube?: AvailabilityOption[];
  youtube_versions?: AvailabilityOption[];
};

export default function MovieDetailClient({ tmdbId }: { tmdbId: string }) {
  const [result, setResult] = useState<{
    tmdbId: string;
    movie: MovieDetail | null;
    error: string;
  } | null>(null);
  const [posterFailedFor, setPosterFailedFor] = useState("");

  useEffect(() => {
    let active = true;

    apiFetch<BackendMovieDetail>(movieApiPath(tmdbId))
      .then((response) => {
        if (!active) return;
        const ott = (response.providers ?? []).map((item) => ({ ...item, media_kind: "ott" as const }));
        const youtube = (response.youtube ?? response.youtube_versions ?? []).map((item) => ({
          ...item,
          media_kind: "youtube" as const,
        }));

        setResult({
          tmdbId,
          error: "",
          movie: {
            ...response,
            providers: response.providers ?? [],
            availability: [...ott, ...youtube],
            genres: response.genres ?? [],
            languages: response.languages ?? [],
            cast: response.cast ?? [],
            crew: response.crew ?? [],
          },
        });
      })
      .catch((reason: unknown) => {
        if (!active) return;
        setResult({
          tmdbId,
          movie: null,
          error: reason instanceof Error ? reason.message : "Movie not found",
        });
      });

    return () => {
      active = false;
    };
  }, [tmdbId]);

  const movie = result?.tmdbId === tmdbId ? result.movie : null;
  const error = result?.tmdbId === tmdbId ? result.error : "";
  const posterFailed = posterFailedFor === tmdbId;

  const directors = useMemo(
    () => movie?.crew.filter((person) => (person.role ?? "").toLowerCase().includes("director")).slice(0, 4) ?? [],
    [movie],
  );

  if (error) {
    return (
      <AppShell>
        <main className="page-content">
          <section className="error-panel">
            <h1>Movie unavailable</h1>
            <p>{error}</p>
          </section>
        </main>
      </AppShell>
    );
  }

  if (!movie) {
    return (
      <AppShell>
        <main className="page-content">
          <div className="detail-loading" aria-busy="true">
            <span className="detail-loading-poster" />
            <span className="detail-loading-copy" />
          </div>
        </main>
      </AppShell>
    );
  }

  const rating = movie.tmdb_rating ?? movie.imdb_rating;
  const availability = movie.availability ?? movie.providers ?? [];
  const ottProviders = movie.providers?.length
    ? movie.providers
    : availability.filter((item) => !("media_kind" in item) || item.media_kind !== "youtube");
  const youtubeAvailability = availability.filter(
    (item) => "media_kind" in item && item.media_kind === "youtube",
  );

  return (
    <AppShell>
      <main className="movie-detail">
        <section
          className="detail-hero"
          style={
            movie.backdrop_url
              ? {
                  backgroundImage: `linear-gradient(90deg,rgba(7,16,24,.98) 0%,rgba(7,16,24,.78) 54%,rgba(7,16,24,.95) 100%),url("${movie.backdrop_url}")`,
                }
              : undefined
          }
        >
          <div className="detail-poster">
            {movie.poster_url && !posterFailed ? (
              <img src={movie.poster_url} alt={`${movie.title} poster`} onError={() => setPosterFailedFor(tmdbId)} />
            ) : (
              <div className="poster-fallback">
                <span>{movie.title[0]}</span>
                <small>Poster unavailable</small>
              </div>
            )}
          </div>

          <div className="detail-copy">
            <span className="section-kicker">
              {movie.domain === "current" ? "INDIAN MOVIE" : "INDIAN CLASSIC"}
            </span>
            <h1>{movie.title}</h1>

            {movie.original_title && movie.original_title !== movie.title ? (
              <p className="original-title">{movie.original_title}</p>
            ) : null}

            <div className="detail-meta">
              <span><CalendarDays size={17} aria-hidden="true" />{movie.release_year ?? "Year unknown"}</span>
              {movie.runtime ? <span><Clock3 size={17} aria-hidden="true" />{movie.runtime} min</span> : null}
              <span><Languages size={17} aria-hidden="true" />{movie.language_name ?? movie.original_language ?? "Unknown"}</span>
              {rating ? <span><Star size={17} aria-hidden="true" />Rating {Number(rating).toFixed(1)}</span> : null}
            </div>

            {movie.genres.length ? (
              <div className="genre-row">
                {movie.genres.map((genre) => <span key={genre.genre_id}>{genre.genre_name}</span>)}
              </div>
            ) : null}

            {directors.length ? (
              <p className="director-line">
                <strong>Director{directors.length > 1 ? "s" : ""}:</strong>{" "}
                {directors.map((person) => person.name).join(", ")}
              </p>
            ) : null}

            <p className="detail-overview">{movie.overview || "Overview is not available."}</p>

            <div className="watch-panels" aria-label="Watch options">
              <section className="watch-panel ott-panel" aria-labelledby="ott-watch-title">
                <span className="section-kicker">WHERE TO WATCH IN INDIA</span>
                <h2 id="ott-watch-title">OTT and store options</h2>
                <ProviderButtons providers={ottProviders} />
              </section>

              <section className="watch-panel youtube-panel" aria-labelledby="youtube-watch-title">
                <span className="section-kicker youtube-kicker">WATCH FREE ON YOUTUBE</span>
                <h2 id="youtube-watch-title">Full-movie links</h2>
                <ProviderButtons providers={youtubeAvailability} maxItems={3} />
              </section>
            </div>
          </div>
        </section>

        <section className="detail-sections">
          <div>
            <span className="section-kicker">CAST</span>
            <h2>Actors</h2>
            {movie.cast.length ? (
              <div className="people-grid">
                {movie.cast.slice(0, 18).map((person, index) => (
                  <div key={`${person.person_id ?? person.name}-${index}`}>
                    <strong>{person.name}</strong>
                    <span>{person.character_name || "Cast"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="provider-empty">Cast data is not available for this movie yet.</p>
            )}
          </div>

          <div>
            <span className="section-kicker">CREW</span>
            <h2>Behind the movie</h2>
            {movie.crew.length ? (
              <div className="people-grid">
                {movie.crew.slice(0, 12).map((person, index) => (
                  <div key={`${person.person_id ?? person.name}-${index}`}>
                    <strong>{person.name}</strong>
                    <span>{person.role || "Crew"}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="provider-empty">Crew data is not available for this movie yet.</p>
            )}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
