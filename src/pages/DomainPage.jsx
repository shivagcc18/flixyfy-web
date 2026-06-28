import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MovieGrid from "../components/MovieGrid";
import SkeletonRow from "../components/SkeletonRow";
import SearchBar from "../components/SearchBar";
import { setPageSeo } from "../utils/seo";
import "./DomainPage.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://flixyfy-api-production.up.railway.app";

const PAGE_SIZE = 24;

const YEARS = [];
for (let year = 2026; year >= 1960; year--) {
  YEARS.push(String(year));
}

const SORTS = [
  { label: "Popular", value: "popular" },
  { label: "Latest", value: "latest" },
  { label: "Rating", value: "rating" },
  { label: "Title", value: "title" },
];

const HISTORICAL_LANGUAGES = [
  { label: "All Languages", value: "" },
  { label: "Hindi", value: "hi" },
  { label: "Tamil", value: "ta" },
  { label: "Telugu", value: "te" },
  { label: "Kannada", value: "kn" },
];

const HISTORICAL_NON_MOVIE_TITLES = new Set([
  "a r rahman",
  "a. r. rahman",
  "a.r. rahman",
  "ar rahman",
  "a venkatesh",
  "a. venkatesh",
]);

function normalizeTitle(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function isHistoricalNonMovieRow(movie) {
  const title = normalizeTitle(movie?.title || movie?.name || movie?.original_title);
  if (!title) return false;

  if (HISTORICAL_NON_MOVIE_TITLES.has(title)) return true;

  const slug = normalizeTitle(movie?.slug || "");
  if (slug === "a-r-rahman" || slug === "ar-rahman" || slug === "a-venkatesh") {
    return true;
  }

  return false;
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

function getYear(movie) {
  const value = movie?.release_year || movie?.year || 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getQualityValue(movie) {
  const quality = Number(movie?.quality_score || 0);
  const popularity = Number(movie?.popularity || 0);
  const rating = Number(movie?.rating || 0);

  if (Number.isFinite(quality) && quality > 0) return quality;
  if (Number.isFinite(popularity) && popularity > 0) return popularity;
  if (Number.isFinite(rating) && rating > 0) return rating;

  return 0;
}

function cleanDomainItems(items, domain) {
  if (!Array.isArray(items)) return [];

  if (domain !== "historical") {
    return items;
  }

  return items.filter((movie) => !isHistoricalNonMovieRow(movie));
}

function sortHistoricalPosterFirst(items) {
  if (!Array.isArray(items)) return [];

  return [...items].sort((a, b) => {
    const aPosterRank = hasRealPoster(a) ? 0 : 1;
    const bPosterRank = hasRealPoster(b) ? 0 : 1;

    if (aPosterRank !== bPosterRank) {
      return aPosterRank - bPosterRank;
    }

    const aYear = getYear(a);
    const bYear = getYear(b);

    if (aYear !== bYear) {
      return bYear - aYear;
    }

    const aQuality = getQualityValue(a);
    const bQuality = getQualityValue(b);

    if (aQuality !== bQuality) {
      return bQuality - aQuality;
    }

    return String(a?.title || "").localeCompare(String(b?.title || ""));
  });
}

function prepareDomainItems(items, domain) {
  const cleaned = cleanDomainItems(items, domain);

  if (domain === "historical") {
    return sortHistoricalPosterFirst(cleaned);
  }

  return cleaned;
}

function domainConfig(domain) {
  if (domain === "historical") {
    return {
      title: "Historical Indian Movies",
      subtitle:
        "Classic Indian movies from 1960 to 1999 with YouTube full-movie availability where found.",
      apiPath: "/api/v3/historical",
      seoTitle: "Historical Indian Movies 1960–1999",
      seoDescription:
        "Explore classic Indian movies from 1960 to 1999 with historical metadata and free YouTube full-movie links where available.",
    };
  }

  return {
    title: "Hollywood Movies",
    subtitle:
      "Hollywood movies with streaming and rental availability across major providers.",
    apiPath: "/api/v3/hollywood",
    seoTitle: "Hollywood Movies Streaming Availability",
    seoDescription:
      "Explore Hollywood movies and find where they are available to stream, rent, buy, or watch online.",
  };
}

export default function DomainPage({ domain }) {
  const config = useMemo(() => domainConfig(domain), [domain]);

  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [sort, setSort] = useState("popular");
  const [language, setLanguage] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const canLoadMore = movies.length < total;

  useEffect(() => {
    setPageSeo({
      title: config.seoTitle,
      description: config.seoDescription,
      path: `/${domain}`,
    });
  }, [config, domain]);

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
      if (domain === "historical" && language) params.set("language", language);

      const res = await fetch(`${API_BASE}${config.apiPath}?${params.toString()}`);

      if (!res.ok) {
        throw new Error(`API failed: ${res.status}`);
      }

      const data = await res.json();
      const rawItems = data.items || data.movies || data.results || [];
      const preparedItems = prepareDomainItems(rawItems, domain);

      setMovies((prev) => {
        if (!append) {
          return preparedItems;
        }

        const combined = [...prev, ...preparedItems];
        return prepareDomainItems(combined, domain);
      });

      setTotal(data.total || preparedItems.length || 0);
      setPage(selectedPage);
    } catch (err) {
      console.error(`${domain} API failed:`, err);
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
  }, [domain, year, sort, language]);

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

  return (
    <div className="domain-page">
      <Navbar />

      <section className="domain-hero">
        <div>
          <p className="domain-kicker">FLIXYFY</p>
          <h1>{config.title}</h1>
          <p>{config.subtitle}</p>
        </div>
      </section>

      <div className="domain-controls">
        <SearchBar onSearch={handleSearch} large />

        <div className="domain-filter-row">
          {domain === "historical" && (
            <select value={language} onChange={(e) => setLanguage(e.target.value)}>
              {HISTORICAL_LANGUAGES.map((item) => (
                <option key={item.value || "all"} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          )}

          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">All Years</option>
            {YEARS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            {SORTS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <section className="domain-results">
        <h2>
          {loading
            ? "Loading..."
            : query
            ? `Search Results for "${query}" (${total})`
            : `${config.title} (${total})`}
        </h2>

        {loading ? (
          <SkeletonRow />
        ) : movies.length === 0 ? (
          <p className="domain-empty">No movies found.</p>
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