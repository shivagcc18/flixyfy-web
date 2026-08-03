"use client";

import Link from "next/link";
import { movieRoute, type Movie } from "@/lib/api";
import PosterImage from "./PosterImage";

export default function MovieCard({ movie }: { movie: Movie }) {
  const route = movieRoute(movie);
  const labelParts = [
    movie.title,
    movie.release_year ? String(movie.release_year) : null,
    movie.language_name ?? movie.original_language ?? null,
  ].filter(Boolean);

  return (
    <Link className="movie-card" href={route} aria-label={`Open ${labelParts.join(", ")} details`}>
      <div className="poster-wrap">
        <PosterImage src={movie.poster_url} alt={`${movie.title} poster`} fallbackLabel={movie.title} />
        <span className={`domain-badge ${movie.domain}`}>
          {movie.domain === "current" ? "Current" : "Classic"}
        </span>
      </div>
      <div className="movie-card-copy">
        <strong>{movie.title}</strong>
        <span>{[movie.release_year, movie.language_name ?? movie.original_language].filter(Boolean).join(" · ") || "Indian movie"}</span>
      </div>
    </Link>
  );
}
