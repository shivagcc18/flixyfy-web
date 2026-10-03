"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { movieRoute, normalizePosterUrl, type Movie } from "@/lib/api";
import { trackMovieOpened } from "@/lib/analytics";

export default function MovieCard({ movie }: { movie: Movie }) {
  const [posterFailed, setPosterFailed] = useState(false);
  const pathname = usePathname();
  const route = movieRoute(movie);
  const language =
    movie.language_name ?? movie.original_language ?? "Language unknown";
  const year = movie.release_year ?? "Year unknown";
  const posterUrl = normalizePosterUrl(movie.poster_url);

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
      </span>
    </Link>
  );
}
