import { useNavigate } from "react-router-dom";
import { trackMovieClick } from "../utils/analytics";
import "./MovieCard.css";

function buildPosterUrl(path) {
  if (!path) return "/no-poster.png";
  if (path.startsWith("http")) return path;
  return `https://image.tmdb.org/t/p/w500${path}`;
}

export default function MovieCard({ movie }) {
  const navigate = useNavigate();

  const poster = buildPosterUrl(movie.poster_url || movie.poster_path);

  const handleClick = () => {
    trackMovieClick(movie);
    navigate(`/movie/${movie.slug}`);
  };

  return (
    <div className="movie-card" onClick={handleClick}>
      <img
  className="movie-card-img"
  src={posterUrl}
  alt={movie.title}
  loading="lazy"
  decoding="async"
  draggable="false"
/>

      <h3 className="movie-card-title">{movie.title}</h3>

      <p className="movie-card-meta">
        {movie.release_year} • {movie.primary_language}
      </p>

      {movie.ott_primary && (
        <div className="movie-card-ott">
          {movie.is_free ? "Free on " : "Watch on "}
          {movie.ott_primary}
        </div>
      )}
    </div>
  );
}