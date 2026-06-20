import Navbar from "../components/Navbar";
import SearchBar from "../components/SearchBar";
import "./LanguagePage.css";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://flixyfy-api-production.up.railway.app";

const TMDB_IMG = "https://image.tmdb.org/t/p/w500";

const YEARS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017"];

const SORTS = [
  { label: "Popular", value: "popular" },
  { label: "Latest", value: "latest" },
  { label: "Rating", value: "rating" },
];

const AVAILABILITY = [
  { label: "All Movies", value: "" },
  { label: "OTT Available", value: "ott" },
  { label: "Free to Watch", value: "youtube" },
];

const PROVIDERS = [
  { label: "All Providers", value: "" },
  { label: "Netflix", value: "netflix" },
  { label: "Prime Video", value: "prime_video" },
  { label: "JioHotstar", value: "jiohotstar" },
  { label: "ZEE5", value: "zee5" },
  { label: "SonyLIV", value: "sonyliv" },
  { label: "Aha", value: "aha" },
  { label: "Sun NXT", value: "sun_nxt" },
  { label: "ETV Win", value: "etv_win" },
  { label: "YouTube", value: "youtube" },
];

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

function labelLanguage(language) {
  if (!language) return "";
  return language.charAt(0).toUpperCase() + language.slice(1);
}

export default function LanguagePage() {
  const { language } = useParams();
  const [searchParams] = useSearchParams();
  const q = searchParams.get("q") || "";

  const [movies, setMovies] = useState([]);
  const [total, setTotal] = useState(0);
  const [year, setYear] = useState("");
  const [sort, setSort] = useState("popular");
  const [availability, setAvailability] = useState("");
  const [provider, setProvider] = useState("");
  const [loading, setLoading] = useState(true);

  const languageName = labelLanguage(language);

  useEffect(() => {
    const title = q
      ? `${q} in ${languageName} Movies | Flixyfy`
      : `${languageName} Movies on OTT | Flixyfy`;

    const description = q
      ? `Search ${q} in ${languageName} movies and find where to watch online across Indian OTT platforms.`
      : `Discover ${languageName} movies streaming on Netflix, Prime Video, JioHotstar, ZEE5, SonyLIV, Aha, Sun NXT, ETV Win and more.`;

    document.title = title;

    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", description);
  }, [languageName, q]);

  useEffect(() => {
    setYear("");
    setSort("popular");
    setAvailability("");
    setProvider("");
  }, [language]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);

        const params = new URLSearchParams();
        params.set("page", "1");
        params.set("limit", "100");

        if (year) params.set("year", year);

        let url;

        if (q) {
          params.set("q", q);
          params.set("language", language);
          url = `${API_BASE}/api/v3/search?${params.toString()}`;
        } else {
          params.set("sort", sort || "popular");
          if (availability) params.set("availability", availability);
          if (provider) params.set("provider", provider);
          url = `${API_BASE}/api/v3/language/${encodeURIComponent(language)}?${params.toString()}`;
        }

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
        console.error("Language page failed:", err);
        setMovies([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [language, q, year, sort, availability, provider]);

  return (
    <div className="language-page">
      <Navbar />

      <div className="language-search-wrap">
        <SearchBar large language={language} />
      </div>

      <div className="language-header-row">
        <div>
          <h1 className="language-title">
            {q ? `Search "${q}" in ${languageName} Movies` : `${languageName} Movies`}
          </h1>

          <p className="language-subtitle">
            {loading
              ? `Loading ${languageName} movies...`
              : `${total.toLocaleString()} ${languageName} movies available`}
          </p>
        </div>

        <div className="language-filter-controls">
          <select
            className="year-dropdown language-year-dropdown"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="">All Years</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {!q && (
            <>
              <select
                className="year-dropdown language-year-dropdown"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>

              <select
                className="year-dropdown language-year-dropdown"
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
              >
                {AVAILABILITY.map((item) => (
                  <option key={item.value || "all"} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>

              <select
                className="year-dropdown language-year-dropdown"
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
              >
                {PROVIDERS.map((item) => (
                  <option key={item.value || "all"} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </>
          )}
        </div>
      </div>

      {!loading && movies.length === 0 && <p className="language-empty">No movies found.</p>}

      <div className="language-grid">
        {movies.map((movie) => (
          <Link key={movie.tmdb_id} to={moviePath(movie)} className="language-movie-card">
            <img
              src={posterUrl(movie.poster_url)}
              alt={movie.title}
              className="language-poster"
              loading="lazy"
              decoding="async"
            />

            <div className="language-card-body">
              <h3>{movie.title}</h3>

              <p>
                {movie.release_year || "-"} • ⭐{" "}
                {movie.rating ? Number(movie.rating).toFixed(1) : "-"}
              </p>

              <span>{movie.ott_primary ? `Watch on ${movie.ott_primary}` : "OTT unavailable"}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}