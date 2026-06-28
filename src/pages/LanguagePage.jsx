import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MovieGrid from "../components/MovieGrid";
import SkeletonRow from "../components/SkeletonRow";
import SearchBar from "../components/SearchBar";
import { setPageSeo } from "../utils/seo";
import "./LanguagePage.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://flixyfy-api-production.up.railway.app";

const PAGE_SIZE = 24;

const INDIAN_LANGUAGES = [
  { label: "All Indian Languages", value: "all", path: "/" },
  { label: "Hindi", value: "hindi", path: "/language/hindi" },
  { label: "Telugu", value: "telugu", path: "/language/telugu" },
  { label: "Tamil", value: "tamil", path: "/language/tamil" },
  { label: "Malayalam", value: "malayalam", path: "/language/malayalam" },
  { label: "Kannada", value: "kannada", path: "/language/kannada" },
  { label: "Bengali", value: "bengali", path: "/language/bengali" },
  { label: "Marathi", value: "marathi", path: "/language/marathi" },
  { label: "Punjabi", value: "punjabi", path: "/language/punjabi" },
  { label: "Gujarati", value: "gujarati", path: "/language/gujarati" },
  { label: "Odia", value: "odia", path: "/language/odia" },
  { label: "Assamese", value: "assamese", path: "/language/assamese" },
];

const LANGUAGE_ALIASES = {
  hi: "hindi",
  te: "telugu",
  ta: "tamil",
  ml: "malayalam",
  kn: "kannada",
  bn: "bengali",
  mr: "marathi",
  pa: "punjabi",
  gu: "gujarati",
  or: "odia",
  as: "assamese",
};

const LANGUAGE_LABELS = {
  hindi: "Hindi",
  telugu: "Telugu",
  tamil: "Tamil",
  malayalam: "Malayalam",
  kannada: "Kannada",
  bengali: "Bengali",
  marathi: "Marathi",
  punjabi: "Punjabi",
  gujarati: "Gujarati",
  odia: "Odia",
  assamese: "Assamese",
};

const YEARS = [];
for (let year = 2026; year >= 2000; year--) {
  YEARS.push(String(year));
}

const SORTS = [
  { label: "Popular", value: "popular" },
  { label: "Latest", value: "latest" },
  { label: "Rating", value: "rating" },
  { label: "Title", value: "title" },
];

const AVAILABILITY_OPTIONS = [
  { label: "All Movies", value: "all" },
  { label: "OTT Only", value: "ott" },
  { label: "Free", value: "free" },
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

function normalizeLanguageSlug(value) {
  const raw = String(value || "").trim().toLowerCase();
  return LANGUAGE_ALIASES[raw] || raw || "hindi";
}

function getLanguageLabel(slug) {
  return LANGUAGE_LABELS[slug] || "Indian";
}

function hasRealPoster(movie) {
  const value =
    movie?.poster_url ||
    movie?.poster ||
    movie?.poster_path ||
    movie?.image_url ||
    movie?.image ||
    movie?.thumbnail ||
    "";

  if (!value) return false;

  const poster = String(value).trim();
  if (!poster) return false;

  const lowered = poster.toLowerCase();

  if (lowered.includes("placeholder")) return false;
  if (lowered.includes("classic-indian")) return false;
  if (lowered.includes("classic indian")) return false;
  if (lowered.includes("no-poster")) return false;
  if (lowered.includes("no_poster")) return false;
  if (lowered.includes("default")) return false;
  if (lowered === "null") return false;
  if (lowered === "none") return false;
  if (lowered === "unknown") return false;

  return (
    lowered.startsWith("http://") ||
    lowered.startsWith("https://") ||
    lowered.startsWith("/")
  );
}

function getNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getYear(movie) {
  const parsed = Number(movie?.release_year || movie?.year || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getPopularScore(movie, originalIndex = 0) {
  const quality = getNumber(movie?.quality_score);
  const popularity = getNumber(movie?.popularity);
  const rating = getNumber(movie?.rating);
  const voteCount = getNumber(movie?.vote_count);
  const ottBoost = movie?.has_ott ? 250 : 0;
  const freeBoost = movie?.is_free || movie?.has_free_ott ? 150 : 0;
  const posterBoost = hasRealPoster(movie) ? 300 : 0;
  const apiOrderScore = Math.max(0, 1000 - originalIndex);

  return (
    posterBoost +
    ottBoost +
    freeBoost +
    quality * 20 +
    popularity * 10 +
    rating * 100 +
    Math.min(voteCount, 5000) / 5 +
    apiOrderScore
  );
}

function sortLanguageItems(items, selectedSort) {
  if (!Array.isArray(items)) return [];

  return [...items]
    .map((movie, index) => ({ movie, index }))
    .sort((a, b) => {
      if (selectedSort === "title") {
        return String(a.movie?.title || "").localeCompare(String(b.movie?.title || ""));
      }

      if (selectedSort === "latest") {
        const yearDiff = getYear(b.movie) - getYear(a.movie);
        if (yearDiff !== 0) return yearDiff;

        const popularDiff = getPopularScore(b.movie, b.index) - getPopularScore(a.movie, a.index);
        if (popularDiff !== 0) return popularDiff;

        return a.index - b.index;
      }

      if (selectedSort === "rating") {
        const ratingDiff = getNumber(b.movie?.rating) - getNumber(a.movie?.rating);
        if (ratingDiff !== 0) return ratingDiff;

        const popularDiff = getPopularScore(b.movie, b.index) - getPopularScore(a.movie, a.index);
        if (popularDiff !== 0) return popularDiff;

        return a.index - b.index;
      }

      const popularDiff = getPopularScore(b.movie, b.index) - getPopularScore(a.movie, a.index);
      if (popularDiff !== 0) return popularDiff;

      return a.index - b.index;
    })
    .map((item) => item.movie);
}

export default function LanguagePage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const languageSlug = useMemo(() => normalizeLanguageSlug(slug), [slug]);
  const languageLabel = useMemo(() => getLanguageLabel(languageSlug), [languageSlug]);

  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [sort, setSort] = useState("popular");
  const [availability, setAvailability] = useState("all");
  const [provider, setProvider] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const canLoadMore = movies.length < total;

  useEffect(() => {
    setPageSeo({
      title: `${languageLabel} Movies Streaming Availability`,
      description: `Explore ${languageLabel} movies and find where to watch them online on OTT platforms.`,
      path: `/language/${languageSlug}`,
    });
  }, [languageLabel, languageSlug]);

  const fetchMovies = async (selectedPage = 1, append = false, searchText = query) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams();
      params.set("page", String(selectedPage));
      params.set("limit", String(PAGE_SIZE));
      params.set("sort", sort || "popular");

      if (searchText) params.set("q", searchText);
      if (year) params.set("year", year);

      if (availability === "ott") {
        params.set("has_ott", "true");
      }

      if (availability === "free") {
        params.set("has_ott", "true");
        params.set("has_free_ott", "true");
        params.set("is_free", "true");
      }

      if (provider) {
        params.set("provider", provider);
      }

      const url = `${API_BASE}/api/v3/language/${languageSlug}?${params.toString()}`;
      const res = await fetch(url);

      if (!res.ok) {
        throw new Error(`Language API failed: ${res.status}`);
      }

      const data = await res.json();
      const rawItems = data.items || data.movies || data.results || [];
      const preparedItems = sortLanguageItems(rawItems, sort);

      setMovies((prev) => {
        if (!append) {
          return preparedItems;
        }

        return sortLanguageItems([...prev, ...preparedItems], sort);
      });

      setTotal(data.total || preparedItems.length || 0);
      setPage(selectedPage);
    } catch (err) {
      console.error("Language API failed:", err);
      if (!append) {
        setMovies([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setMovies([]);
    setPage(1);
    fetchMovies(1, false, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageSlug, year, sort, availability, provider]);

  const handleSearch = async (value) => {
    const clean = value.trim();
    setQuery(clean);
    setMovies([]);
    setPage(1);
    await fetchMovies(1, false, clean);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !canLoadMore) return;
    await fetchMovies(page + 1, true, query);
  };

  const handleLanguageChange = (value) => {
    const selected = INDIAN_LANGUAGES.find((item) => item.value === value);
    if (!selected) return;
    navigate(selected.path);
  };

  return (
    <div className="language-page">
      <Navbar />

      <section className="language-hero">
        <SearchBar onSearch={handleSearch} large />

        <div className="language-filter-row">
          <select
            value={languageSlug}
            onChange={(e) => handleLanguageChange(e.target.value)}
            aria-label="Select Indian language"
          >
            {INDIAN_LANGUAGES.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <button
            className="domain-filter-pill"
            type="button"
            onClick={() => navigate("/hollywood")}
          >
            Hollywood
          </button>

          <button
            className="domain-filter-pill"
            type="button"
            onClick={() => navigate("/historical")}
          >
            Historical
          </button>

          <select value={year} onChange={(e) => setYear(e.target.value)} aria-label="Select year">
            <option value="">All Years</option>
            {YEARS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort movies">
            {SORTS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            aria-label="Select availability"
          >
            {AVAILABILITY_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            value={provider}
            onChange={(e) => setProvider(e.target.value)}
            aria-label="Select provider"
          >
            {PROVIDERS.map((item) => (
              <option key={item.value || "all"} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="language-results">
        <h1>{languageLabel} Movies</h1>

        <p className="language-count">
          {loading
            ? "Loading..."
            : `${total} ${languageLabel} movies available`}
        </p>

        {loading ? (
          <SkeletonRow />
        ) : movies.length === 0 ? (
          <p className="language-empty">No movies found.</p>
        ) : (
          <>
            <MovieGrid movies={movies} />

            {canLoadMore && (
              <div className="load-more-wrap">
                <button
                  className="load-more-btn"
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Loading..." : "Load More"}
                </button>
              </div>
            )}
          </>
        )}
      </section>

      <Footer />
    </div>
  );
}