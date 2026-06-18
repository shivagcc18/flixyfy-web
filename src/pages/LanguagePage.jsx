import SearchBar from "../components/SearchBar";
import "./LanguagePage.css";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://flixyfy-api-production.up.railway.app";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

function posterUrl(path) {
  if (!path) return "/no-poster.png";
  if (path.startsWith("http")) return path;
  return `${TMDB_IMG}${path}`;
}

function moviePath(movie) {
  if (movie.movie_url) return movie.movie_url;
  if (movie.slug) return `/movie/${movie.slug}`;
  return "/";
}

export default function LanguagePage() {
  const { language } = useParams();
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";

  const [movies, setMovies] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const url = q
          ? `${API_BASE}/api/v3/search?q=${encodeURIComponent(q)}&language=${encodeURIComponent(language)}&limit=100`
          : `${API_BASE}/api/v3/language/${encodeURIComponent(language)}?limit=100`;

        const res = await fetch(url);
        const data = await res.json();

        if (!res.ok) {
          console.error("Language API error:", data);
          throw new Error("API Error");
        }

        const list = data.items || data.movies || [];
        setMovies(list);
        setTotal(data.total || data.count || list.length || 0);
      } catch (err) {
        console.error(err);
        setMovies([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [language, q]);

  return (
    <div className="language-page">
      <SearchBar large language={language} />

      <h1 className="language-title">
        {q
          ? `Search "${q}" in ${language?.toUpperCase()} Movies`
          : `${language?.toUpperCase()} Movies`}
      </h1>

      <p className="language-subtitle">
        {loading
          ? `Loading ${language} movies...`
          : `Showing ${movies.length} of ${total} ${language} movies from FLIXYFY catalog.`}
      </p>

      {!loading && movies.length === 0 && (
        <p className="language-empty">No movies found.</p>
      )}

      <div className="language-grid">
        {movies.map((movie) => (
          <Link
            key={movie.tmdb_id}
            to={moviePath(movie)}
            className="language-movie-card"
          >
            <img
              src={posterUrl(movie.poster_url)}
              alt={movie.title}
              className="language-poster"
            />

            <div className="language-card-body">
              <h3>{movie.title}</h3>

              <p>
                {movie.release_year || "-"} • ⭐{" "}
                {movie.rating ? Number(movie.rating).toFixed(1) : "-"}
              </p>

              <span>
                {movie.ott_primary
                  ? `Watch on ${movie.ott_primary}`
                  : "OTT unavailable"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}