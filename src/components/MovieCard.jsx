import { Link } from "react-router-dom";
import "./MovieCard.css";

function encodePath(value) {
  return encodeURIComponent(String(value || "").trim());
}

function getPersonLanguage(movie) {
  return (
    movie.primary_language_slug ||
    movie.language_slug ||
    movie.language ||
    movie.primary_language ||
    ""
  );
}

function getMovieUrl(movie) {
  const domain = movie.domain || movie.source_domain || "";
  const slug = movie.slug || movie.person_slug || movie.movie_slug || "";

  // Person cards must go to unified person route, not historical person route.
  // Do this before movie.movie_url because older API/search rows may still carry historical URLs.
  if (domain === "person") {
    const language = getPersonLanguage(movie);

    if (!slug) return "/historical/people";

    return language
      ? `/person/${encodePath(slug)}?language=${encodePath(language)}`
      : `/person/${encodePath(slug)}`;
  }

  if (movie.movie_url) return movie.movie_url;

  if (domain === "webseries") return `/webseries/${encodePath(slug)}`;
  if (domain === "hollywood") return `/hollywood/${encodePath(slug)}`;
  if (domain === "historical") return `/historical/${encodePath(slug)}`;

  return `/movie/${encodePath(slug)}`;
}

function getDomainLabel(movie) {
  const domain = movie.domain || movie.source_domain || "";

  if (movie.source_label) return movie.source_label;
  if (domain === "person") return "People";
  if (domain === "webseries") return "Webseries";
  if (domain === "hollywood") return "Hollywood";
  if (domain === "historical") return "Historical";

  return "";
}

function safeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function cleanLanguageName(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

function getPersonMeta(movie) {
  const languageName = cleanLanguageName(
    movie.primary_language_name ||
      movie.primary_language_slug ||
      movie.language_name ||
      movie.language_slug ||
      movie.language ||
      movie.primary_language
  );

  const pageMovieCount = safeNumber(
    movie.primary_language_movie_count ?? movie.movie_count ?? movie.total_movie_count,
    0
  );

  const careerMovieCount = safeNumber(
    movie.career_attached_movie_count ?? movie.career_movie_count,
    pageMovieCount
  );

  const role = movie.primary_role ? String(movie.primary_role).replace(/_/g, " ") : "";

  const parts = [];

  if (role) parts.push(role);
  if (pageMovieCount) {
    parts.push(languageName ? `${pageMovieCount} ${languageName} movies` : `${pageMovieCount} movies`);
  }
  if (careerMovieCount > pageMovieCount) {
    parts.push(`${careerMovieCount} total mapped`);
  }

  return parts.join(" / ");
}

function PosterFallback({ movie, title }) {
  const domain = movie.domain || movie.source_domain || "modern";
  const year = movie.release_year || movie.year || "";
  const language = movie.language_name || movie.primary_language || movie.language_slug || "";
  const isHistorical = domain === "historical";

  return (
    <div className={`movie-poster-fallback ${domain}`}>
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

  const domain = movie.domain || movie.source_domain || "modern";
  const title = movie.title || movie.person_name || movie.display_name || "Untitled";
  const poster = movie.poster_url || movie.poster || "";
  const url = getMovieUrl(movie);
  const label = getDomainLabel(movie);

  const metaYear = domain === "person" ? null : movie.release_year || movie.year;

  const metaText =
    domain === "person"
      ? getPersonMeta(movie)
      : movie.primary_language || movie.language_name || movie.language_slug || "";

  return (
    <Link to={url} className={`movie-card ${domain}`}>
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
          <PosterFallback movie={{ ...movie, domain }} title={title} />
        )}

        {label && domain && domain !== "modern" && (
          <span className={`movie-domain-badge ${domain}`}>{label}</span>
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