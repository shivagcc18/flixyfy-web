"use client";

import Link from "next/link";
import { languageName } from "@/lib/languages";
import { movieRoute, type Movie } from "@/lib/api";
import PosterImage from "./PosterImage";

export default function MovieCard({ movie }: { movie: Movie }) {
  const route = movieRoute(movie);
  const displayLanguage = movie.language_name ?? languageName(movie.original_language);
  const labelParts = [movie.title, movie.release_year ? String(movie.release_year) : null, displayLanguage].filter(Boolean);

  return (
    <Link className="movie-card" href={route} aria-label={"Open " + labelParts.join(", ") + " details"}>
      <div className="movie-card-poster-wrap">
        <PosterImage src={movie.poster_url} alt={movie.title + " poster"} fallbackLabel={movie.title} />
        <span className={"movie-domain-badge " + movie.domain}>{movie.domain === "current" ? "Current" : "Classic"}</span>
        <span className="poster-hover-title">{movie.title}</span>
      </div>
      <div className="movie-card-body">
        <h3>{movie.title}</h3>
        <div className="movie-card-meta">
          <span>{movie.release_year ?? "-"}</span>
          <span>{displayLanguage}</span>
        </div>
      </div>
    </Link>
  );
}
