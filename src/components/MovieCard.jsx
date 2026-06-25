import { Link } from "react-router-dom";
import "./MovieCard.css";

function fallbackPoster(title) {
  return (
    "https://dummyimage.com/360x540/111827/ffffff&text=" +
    encodeURIComponent(title || "FLIXYFY")
  );
}

function getMovieUrl(movie) {
  if (movie.movie_url) return movie.movie_url;

  if (movie.domain === "hollywood") return `/hollywood/${movie.slug}`;
  if (movie.domain === "historical") return `/historical/${movie.slug}`;

  return `/movie/${movie.slug}`;
}

export default function MovieCard({ movie }) {
  if (!movie) return null;

  const title = movie.title || "Untitled";
  const poster = movie.poster_url || movie.poster || fallbackPoster(title);
  const url = getMovieUrl(movie);
  const label = movie.source_label || movie.domain;

  return (
    <Link to={url} className="movie-card">
      <div className="movie-card-poster-wrap">
        <img
          className="movie-card-img"
          src={poster}
          alt={title}
          loading="lazy"
          decoding="async"
        />

        {label && movie.domain && movie.domain !== "modern" && (
          <span className={`movie-domain-badge ${movie.domain}`}>{label}</span>
        )}
      </div>

      <div className="movie-card-body">
        <h3 className="movie-card-title">{title}</h3>

        <div className="movie-card-meta">
          {movie.release_year && <span>{movie.release_year}</span>}
          {movie.primary_language && <span>{movie.primary_language}</span>}
        </div>

        {movie.ott_primary && <p className="movie-card-provider">{movie.ott_primary}</p>}
      </div>
    </Link>
  );
}