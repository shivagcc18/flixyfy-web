"use client";

import Link from "next/link";
import { useState } from "react";
import { movieRoute, type Movie } from "@/lib/api";

export default function MovieCard({ movie }: { movie: Movie }) {
  const [posterFailed, setPosterFailed] = useState(false);
  const route = movieRoute(movie);
  const language = movie.language_name ?? movie.original_language ?? "Language unknown";
  const year = movie.release_year ?? "Year unknown";

  return (
    <Link
      className="movie-card"
      href={route}
      aria-label={`Open ${movie.title}, ${year}, ${language}`}
    >
      <span className="poster-wrap">
        {movie.poster_url && !posterFailed ? (
          <img
            src={movie.poster_url}
            alt={`${movie.title} poster`}
            loading="lazy"
            onError={() => setPosterFailed(true)}
          />
        ) : (
          <span className="poster-fallback" aria-label={`${movie.title} poster unavailable`}>
            <span>{movie.title.slice(0, 1)}</span>
            <small>Poster unavailable</small>
          </span>
        )}
      </span>
      <span className="movie-card-body">
        <strong className="movie-card-title">{movie.title}</strong>
        <span className="movie-card-meta">{year} · {language}</span>
      </span>
    </Link>
  );
}
