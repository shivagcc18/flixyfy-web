import SearchBar from "../components/SearchBar";
import "./LanguagePage.css";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

const API_BASE = "http://127.0.0.1:8000";
const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

function posterUrl(path) {
  if (!path) return "";
  return path.startsWith("http") ? path : `${TMDB_IMG}${path}`;
}

export default function LanguagePage() {
  const { language } = useParams();
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";

  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
  async function load() {
    try {
      setLoading(true);

      const url = q
  ? `${API_BASE}/api/v3/search?q=${encodeURIComponent(q)}&language=${language}&limit=100`
  : `${API_BASE}/api/language/${language}?limit=100`;

      const res = await fetch(url);
      const data = await res.json();

if (!res.ok) {
  console.error(data);
  throw new Error("API Error");
}

      console.log("LANGUAGE API URL:", url);
      console.log("LANGUAGE API DATA:", data);

      setMovies(data.movies || data.items || []);
    } catch (err) {
      console.error(err);
      setMovies([]);
    } finally {
      setLoading(false);
    }
  }

  load();
}, [language, q]);


  if (loading) {
    return (
      <div style={{ background: "#111", color: "#fff", minHeight: "100vh", padding: 24 }}>
        <SearchBar large language={language} />
        Loading {language} movies...
      </div>
    );
  }

  return (
    <div style={{ background: "#111", color: "#fff", minHeight: "100vh", padding: 24 }}>
      <SearchBar large language={language} />

      <h1 style={{ color: "#fff", fontSize: 34, marginBottom: 8 }}>
        {q ? `Search "${q}" in ${language?.toUpperCase()} Movies` : `${language?.toUpperCase()} Movies`}
      </h1>

      <p style={{ color: "#bbb", marginBottom: 28 }}>
        Showing {movies.length} {language} movies from WATCHINDIA catalog.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(180px,1fr))",
          gap: 18,
        }}
      >
        {movies.map((movie) => (
          <Link
            key={movie.tmdb_id}
            to={movie.movie_url}
            className="language-movie-card"
            style={{
              textDecoration: "none",
              color: "#fff",
              border: "1px solid #2a2a2a",
              borderRadius: 12,
              overflow: "hidden",
              background: "#181818",
              display: "block",
            }}
          >
            {movie.poster_url ? (
              <img
                src={posterUrl(movie.poster_url)}
                alt={movie.title}
                style={{
                  width: "100%",
                  height: 270,
                  objectFit: "cover",
                  display: "block",
                }}
              />
            ) : (
              <div
                style={{
                  height: 270,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#777",
                  background: "#0f0f0f",
                }}
              >
                No Poster
              </div>
            )}

            <div style={{ padding: 12 }}>
              <h3 style={{ color: "#fff", fontSize: 15, margin: "0 0 6px" }}>
                {movie.title}
              </h3>

              <p style={{ color: "#aaa", margin: "0 0 6px", fontSize: 13 }}>
                {movie.release_year} • ⭐ {movie.rating || "-"}
              </p>

              <span
                style={{
                  display: "inline-block",
                  marginTop: 4,
                  padding: "5px 10px",
                  borderRadius: 999,
                  border: "1px solid #444",
                  background: "#222",
                  color: "#fff",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {movie.ott_primary ? `Watch on ${movie.ott_primary}` : "OTT unavailable"}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}