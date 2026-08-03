"use client";

import Link from "next/link";
import { movieRoute } from "@/lib/api";
import PosterImage from "./PosterImage";

export default function MovieCard({ movie }) {
  if (!movie) return null;
  const detailLabel = [movie.title, movie.release_year, movie.language_name || movie.original_language].filter(Boolean).join(", ");
  const domainLabel = movie.domain === "historical" ? "Classic" : "Current";

  return (
    <Link className="movie-card" href={movieRoute(movie)} aria-label={`Open ${detailLabel} details`}>
      <div className="movie-card-poster-wrap">
        <PosterImage src={movie.poster_url} alt={`${movie.title} poster`} fallbackLabel={movie.title} />
        <span className={`movie-domain-badge ${movie.domain}`}>{domainLabel}</span>
        <span className="poster-hover-title" aria-hidden="true">{movie.title}</span>
      </div>
      <div className="movie-card-body">
        <h3>{movie.title}</h3>
        <div className="movie-card-meta">
          {movie.release_year ? <span>{movie.release_year}</span> : null}
          {movie.language_name || movie.original_language ? <span>{movie.language_name || movie.original_language}</span> : null}
        </div>
      </div>
    </Link>
  );
}
