"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { movieRoute, normalizePosterUrl, type Movie } from "@/lib/api";
import { trackMovieOpened } from "@/lib/analytics";
import { projectSearchCardSummary } from "@/lib/search-card-summary";

export default function MovieCard({
  movie,
  showAvailabilitySummary = false,
}: {
  movie: Movie;
  showAvailabilitySummary?: boolean;
}) {
  const [posterFailed, setPosterFailed] = useState(false);
  const pathname = usePathname();
  const route = movieRoute(movie);
  const language =
    movie.language_name ?? movie.original_language ?? "Language unknown";
  const year = movie.release_year ?? "Year unknown";
  const posterUrl = normalizePosterUrl(movie.poster_url);
  const availabilitySummary = projectSearchCardSummary(movie);

  return (
    <Link
      className="movie-card"
      href={route}
      aria-label={`Open ${movie.title}, ${year}, ${language}`}
      onClick={() => trackMovieOpened({
        canonicalMovieId: movie.canonical_movie_id,
        tmdbId: movie.tmdb_id,
        movieLanguage: movie.original_language ?? movie.language_name,
        releaseYear: movie.release_year,
        sourceContext: pathname === "/" ? "home" : pathname?.startsWith("/search") ? "search" : "movie_list",
      })}
    >
      <span className="poster-wrap">
        {posterUrl && !posterFailed ? (
          <img
            src={posterUrl}
            alt={`${movie.title} poster`}
            loading="lazy"
            onError={() => setPosterFailed(true)}
          />
        ) : (
          <span
            className="poster-fallback"
            aria-label={`${movie.title} poster unavailable`}
          >
            <span>{movie.title.slice(0, 1)}</span>
            <small>Poster unavailable</small>
          </span>
        )}
      </span>

      <span className="movie-card-body">
        <strong className="movie-card-title">{movie.title}</strong>
        <span className="movie-card-meta">
          <span className="movie-card-year">{year}</span>
          <span className="movie-card-meta-separator" aria-hidden="true">·</span>
          <span className="movie-card-language">{language}</span>
        </span>
        {showAvailabilitySummary && (availabilitySummary.providers.length || availabilitySummary.youtubeVideoCount !== null) ? (
          <span className="movie-card-authority-summary" data-search-card-summary="true" data-canonical-movie-id={movie.canonical_movie_id}>
            {availabilitySummary.providers.length ? (
              <span className="movie-card-provider-summary" data-search-provider-summary="true">
                <span className="movie-card-summary-label">Available on</span>
                <span data-provider-labels={availabilitySummary.providers.join(" · ")}>{availabilitySummary.providers.join(" · ")}</span>
              </span>
            ) : null}
            {availabilitySummary.youtubeVideoCount !== null ? (
              <span
                className="movie-card-youtube-summary"
                data-search-youtube-presence="true"
                data-youtube-video-count={availabilitySummary.youtubeVideoCount}
              >
                <span className="movie-card-summary-label">YouTube</span>
                <span>
                  {availabilitySummary.youtubeVideoCount > 0
                    ? `${availabilitySummary.youtubeVideoCount} approved videos`
                    : "No approved videos"}
                  {availabilitySummary.youtubeLanguages.length ? (
                    <span data-search-youtube-language="true" data-youtube-language-summary={availabilitySummary.youtubeLanguages.join(", ")}>
                      · {availabilitySummary.youtubeLanguages.join(", ")}
                    </span>
                  ) : null}
                </span>
              </span>
            ) : null}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
