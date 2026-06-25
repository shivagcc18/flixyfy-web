from pathlib import Path

LANGUAGE_PAGE = r'''import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SearchBar from "../components/SearchBar";
import MovieGrid from "../components/MovieGrid";
import SkeletonRow from "../components/SkeletonRow";

import { setPageSeo } from "../utils/seo";
import "./LanguagePage.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://flixyfy-api-production.up.railway.app";

const PAGE_SIZE = 24;

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
];

function extractItems(data) {
  if (!data) return [];

  if (Array.isArray(data)) return data;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.movies)) return data.movies;
  if (Array.isArray(data.results)) return data.results;
  if (Array.isArray(data.data)) return data.data;

  return [];
}

function totalFrom(data, fallbackCount) {
  if (!data) return fallbackCount;

  return data.total || data.count_total || data.movie_count || fallbackCount;
}

export default function LanguagePage() {
  const { language } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const languageSlug = String(language || "").toLowerCase();
  const languageLabel = LANGUAGE_LABELS[languageSlug] || languageSlug || "Language";

  const initialQuery = searchParams.get("q") || "";

  const [query, setQuery] = useState(initialQuery);
  const [movies, setMovies] = useState([]);
  const [year, setYear] = useState("");
  const [sort, setSort] = useState("popular");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const isSearchMode = Boolean(query.trim());
  const canLoadMore = movies.length < total;

  const seoTitle = useMemo(() => {
    if (isSearchMode) {
      return `Search ${query} across Indian Movies`;
    }

    return `${languageLabel} Movies Streaming Online`;
  }, [isSearchMode, query, languageLabel]);

  useEffect(() => {
    setPageSeo({
      title: seoTitle,
      description: isSearchMode
        ? `Search ${query} across Indian movies, including pan-Indian and dubbed movie results.`
        : `Find where to watch ${languageLabel} movies online on OTT platforms and free YouTube links.`,
      path: isSearchMode
        ? `/language/${languageSlug}?q=${encodeURIComponent(query)}`
        : `/language/${languageSlug}`,
    });
  }, [seoTitle, isSearchMode, query, languageSlug, languageLabel]);

  async function fetchLanguageMovies(selectedPage = 1, append = false) {
    const params = new URLSearchParams();

    params.set("page", String(selectedPage));
    params.set("limit", String(PAGE_SIZE));
    params.set("sort", sort || "popular");

    if (year) {
      params.set("year", year);
    }

    const url = `${API_BASE}/api/v3/language/${languageSlug}?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Language API failed: ${res.status}`);
    }

    return await res.json();
  }

  async function fetchPanIndianSearch(selectedPage = 1, append = false) {
    const params = new URLSearchParams();

    params.set("q", query.trim());
    params.set("page", String(selectedPage));
    params.set("limit", String(PAGE_SIZE));

    // Search only Indian domains. Do not include Hollywood here.
    params.set("domain", "modern,historical");

    if (year) {
      params.set("year", year);
    }

    const url = `${API_BASE}/api/v3/global-search?${params.toString()}`;
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Global search API failed: ${res.status}`);
    }

    return await res.json();
  }

  async function loadMovies(selectedPage = 1, append = false) {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const data = isSearchMode
        ? await fetchPanIndianSearch(selectedPage, append)
        : await fetchLanguageMovies(selectedPage, append);

      const items = extractItems(data);

      setMovies((prev) => (append ? [...prev, ...items] : items));
      setTotal(totalFrom(data, items.length));
      setPage(selectedPage);
    } catch (err) {
      console.error("Language page load failed:", err);

      if (!append) {
        setMovies([]);
        setTotal(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadMovies(1, false);
    }, 200);

    return () => clearTimeout(timeout);
  }, [languageSlug, query, year, sort]);

  async function handleSearch(value) {
    const clean = value.trim();

    setQuery(clean);
    setPage(1);

    if (clean) {
      navigate(`/language/${languageSlug}?q=${encodeURIComponent(clean)}`);
    } else {
      navigate(`/language/${languageSlug}`);
    }
  }

  async function handleLoadMore() {
    if (loadingMore || !canLoadMore) return;
    await loadMovies(page + 1, true);
  }

  const title = isSearchMode
    ? `Search Results for "${query}" across Indian Movies`
    : `${languageLabel} Movies`;

  const subtitle = isSearchMode
    ? `Showing pan-Indian matches too, not only ${languageLabel}-primary movies.`
    : `${total} ${languageLabel} movies available`;

  return (
    <div className="language-page">
      <Navbar />

      <div className="language-search-wrap">
        <SearchBar onSearch={handleSearch} large />
      </div>

      <section className="language-header">
        <div>
          <h1>{title}</h1>
          <p>{loading ? "Loading..." : subtitle}</p>
        </div>

        <div className="language-filter-row">
          <select
            className="year-dropdown"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="">All Years</option>
            {YEARS.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          {!isSearchMode && (
            <select
              className="year-dropdown"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              {SORTS.map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
          )}
        </div>
      </section>

      <section className="language-results">
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
'''

Path("src/pages/LanguagePage.jsx").write_text(LANGUAGE_PAGE, encoding="utf-8")

print("PATCHED:")
print("src/pages/LanguagePage.jsx")
print("Hindi page search now uses global Indian search when q is present.")
print("Pushpa can appear even if its primary language is Telugu.")