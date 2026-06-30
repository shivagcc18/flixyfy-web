import { Link } from "react-router-dom";
import "./MovieCard.css";

function getMovieUrl(movie) {
  if (movie.movie_url) return movie.movie_url;

  if (movie.domain === "person") return `/historical/person/${movie.slug}`;
  if (movie.domain === "webseries") return `/webseries/${movie.slug}`;
  if (movie.domain === "hollywood") return `/hollywood/${movie.slug}`;
  if (movie.domain === "historical") return `/historical/${movie.slug}`;

  return `/movie/${movie.slug}`;
}

function getDomainLabel(movie) {
  if (movie.source_label) return movie.source_label;
  if (movie.domain === "person") return "People";
  if (movie.domain === "webseries") return "Webseries";
  if (movie.domain === "hollywood") return "Hollywood";
  if (movie.domain === "historical") return "Historical";
  return "";
}

function PosterFallback({ movie, title }) {
  const year = movie.release_year || movie.year || "";
  const language = movie.language_name || movie.primary_language || "";
  const isHistorical = movie.domain === "historical";

  return (
    <div className={`movie-poster-fallback ${movie.domain || "modern"}`}>
      <div className="fallback-glow" />

      <div className="fallback-content">
        {isHistorical && <span className="fallback-kicker">CLASSIC INDIAN</span>}

        <span className="fallback-title">{title}</span>

        <span className="fallback-meta">
          {[year, language].filter(Boolean).join(" / ")}
        </span>
      </div>
    </div>
  );
}

export default function MovieCard({ movie }) {
  if (!movie) return null;

  const title = movie.title || "Untitled";
  const poster = movie.poster_url || movie.poster || "";
  const url = getMovieUrl(movie);
  const label = getDomainLabel(movie);
  const metaYear = movie.domain === "person" ? null : movie.release_year;
  const metaText =
    movie.domain === "person"
      ? [movie.primary_role, movie.movie_count ? `${movie.movie_count} movies` : null].filter(Boolean).join(" / ")
      : movie.primary_language;

  return (
    <Link to={url} className={`movie-card ${movie.domain || "modern"}`}>
      <div className="movie-card-poster-wrap">
        {poster ? (
          <img
            className="movie-card-img"
            src={poster}
            alt={title}
            loading="lazy"
            decoding="async"
          />
        ) : (
          <PosterFallback movie={movie} title={title} />
        )}

        {label && movie.domain && movie.domain !== "modern" && (
          <span className={`movie-domain-badge ${movie.domain}`}>{label}</span>
        )}
      </div>

      <div className="movie-card-body">
        <h3 className="movie-card-title">{title}</h3>

        <div className="movie-card-meta">
          {metaYear && <span>{metaYear}</span>}
          {metaText && <span>{metaText}</span>}
        </div>

        {movie.ott_primary && <p className="movie-card-provider">{movie.ott_primary}</p>}
      </div>
    </Link>
  );
}
