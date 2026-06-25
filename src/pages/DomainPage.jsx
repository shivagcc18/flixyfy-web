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

function domainConfig(domain) {
  if (domain === "historical") {
    return {
      title: "Historical Indian Movies",
      subtitle: "Classic Indian movies from 1960 to 1999 with YouTube full-movie availability where found.",
      apiPath: "/api/v3/historical",
      seoTitle: "Historical Indian Movies 1960–1999",
      seoDescription:
        "Explore classic Indian movies from 1960 to 1999 with historical metadata and free YouTube full-movie links where available.",
    };
  }

  return {
    title: "Hollywood Movies",
    subtitle: "Hollywood movies with streaming and rental availability across major providers.",
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
      const items = data.items || [];

      setMovies((prev) => (append ? [...prev, ...items] : items));
      setTotal(data.total || 0);
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
    fetchMovies(1, false, query);
  }, [domain, year, sort, language]);

  const handleSearch = async (value) => {
    const clean = value.trim();
    setQuery(clean);
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