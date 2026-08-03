"use client";

import { useEffect, useState } from "react";
import { CalendarDays, Clock3, Languages, Star } from "lucide-react";
import { apiFetch, movieApiPath, normalizePosterUrl, type AvailabilityOption, type Movie, type Provider } from "@/lib/api";
import AppShell from "./AppShell";
import ProviderButtons from "./ProviderButtons";
import PosterImage from "./PosterImage";

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
  const [movie, setMovie] = useState<MovieDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setMovie(null);
      setError("");
      apiFetch<BackendMovieDetail>(movieApiPath(tmdbId))
        .then((response) => {
          if (active) {
            const ott = (response.providers ?? []).map((item) => ({ ...item, media_kind: "ott" as const }));
            const youtube = (response.youtube ?? response.youtube_versions ?? []).map((item) => ({ ...item, media_kind: "youtube" as const }));
            setMovie({
              ...response,
              providers: response.providers ?? [],
              availability: [...ott, ...youtube],
              genres: response.genres ?? [],
              languages: response.languages ?? [],
              cast: response.cast ?? [],
              crew: response.crew ?? [],
            });
          }
        })
        .catch((reason: unknown) => {
          if (active) {
            setError(reason instanceof Error ? reason.message : "Movie not found");
          }
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [tmdbId]);

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
          <div className="loading-panel">Loading movie...</div>
        </main>
      </AppShell>
    );
  }

  const rating = movie.imdb_rating ?? movie.tmdb_rating;
  const availability = movie.availability ?? movie.providers ?? [];
  const ottProviders = movie.providers?.length
    ? movie.providers
    : availability.filter((item) => !("media_kind" in item) || item.media_kind !== "youtube");
  const youtubeAvailability = availability.filter(
    (item) => "media_kind" in item && item.media_kind === "youtube",
  );
  const backdrop = normalizePosterUrl(movie.backdrop_url);

  return (
    <AppShell>
      <main className="movie-detail">
        <section
          className="detail-hero"
          style={
            backdrop
              ? {
                  backgroundImage: `linear-gradient(90deg,rgba(5,7,13,.98) 0%,rgba(5,7,13,.72) 58%,rgba(5,7,13,.92) 100%),url("${backdrop}")`,
                }
              : undefined
          }
        >
          <div className="detail-poster">
            <PosterImage src={movie.poster_url} alt={`${movie.title} poster`} fallbackLabel={movie.title} detail />
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
              <span>
                <CalendarDays size={17} aria-hidden="true" />
                {movie.release_year ?? "-"}
              </span>
              {movie.runtime ? (
                <span>
                  <Clock3 size={17} aria-hidden="true" />
                  {movie.runtime} min
                </span>
              ) : null}
              <span>
                <Languages size={17} aria-hidden="true" />
                {movie.language_name ?? movie.original_language ?? "Unknown"}
              </span>
              {rating ? (
                <span>
                  <Star size={17} aria-hidden="true" />
                  {Number(rating).toFixed(1)}
                </span>
              ) : null}
            </div>

            {movie.genres.length ? (
              <div className="genre-row">
                {movie.genres.map((genre) => (
                  <span key={genre.genre_id}>{genre.genre_name}</span>
                ))}
              </div>
            ) : null}

            <p className="detail-overview">
              {movie.overview || "Overview is not available."}
            </p>

            <div className="where-to-watch">
              <span className="section-kicker">WHERE TO WATCH IN INDIA</span>
              <ProviderButtons providers={ottProviders} />
              <span className="section-kicker youtube-kicker">YOUTUBE AVAILABILITY</span>
              <ProviderButtons providers={youtubeAvailability} />
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
              <p className="provider-empty">Cast data is not listed in this snapshot.</p>
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
              <p className="provider-empty">Crew data is not listed in this snapshot.</p>
            )}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
