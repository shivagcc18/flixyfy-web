import { useEffect, useState } from "react";
import SkeletonRow from "../components/SkeletonRow";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Row from "../components/Row";
import SearchBar from "../components/SearchBar";
import MovieGrid from "../components/MovieGrid";

import { getHome, getMovies } from "../api/watchindiaApi";
import { setPageSeo, setJsonLd } from "../utils/seo";
import { trackFilter, trackLanguageOpen, trackLoadMore } from "../utils/analytics";
import "./Home.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://flixyfy-api-production.up.railway.app";

const PAGE_SIZE = 24;

const LANGUAGES = [
  { label: "All Indian Languages", slug: "" },
  { label: "Hindi", slug: "hindi" },
  { label: "Telugu", slug: "telugu" },
  { label: "Tamil", slug: "tamil" },
  { label: "Malayalam", slug: "malayalam" },
  { label: "Kannada", slug: "kannada" },
  { label: "Bengali", slug: "bengali" },
  { label: "Marathi", slug: "marathi" },
  { label: "Punjabi", slug: "punjabi" },
  { label: "Gujarati", slug: "gujarati" },
  { label: "Odia", slug: "odia" },
  { label: "Assamese", slug: "assamese" },
];

const YEARS = [];
for (let year = 2026; year >= 2000; year--) {
  YEARS.push(String(year));
}

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
  { label: "Prime Video", value: "prime" },
  { label: "JioHotstar", value: "jiohotstar" },
  { label: "ZEE5", value: "zee5" },
  { label: "SonyLIV", value: "sonyliv" },
  { label: "Aha", value: "aha" },
  { label: "Sun NXT", value: "sunnxt" },
  { label: "ETV Win", value: "etvwin" },
  { label: "YouTube", value: "youtube" },
];

export default function Home() {
  const [sections, setSections] = useState({});
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("");
  const [year, setYear] = useState("");
  const [sort, setSort] = useState("popular");
  const [availability, setAvailability] = useState("");
  const [provider, setProvider] = useState("");
  const [filterTotal, setFilterTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    setPageSeo({
      title: "Find Where Movies Are Streaming in India",
      description:
        "Search Indian movies, Hollywood movies, and classic Indian movies across OTT platforms and free YouTube full-movie links.",
      path: "/",
    });

    setJsonLd({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Flixyfy",
      url: "https://www.flixyfy.com",
      potentialAction: {
        "@type": "SearchAction",
        target: "https://www.flixyfy.com/?q={search_term_string}",
        "query-input": "required name=search_term_string",
      },
    });
  }, []);

  const showingFiltered = Boolean(query || language || year || sort !== "popular" || availability || provider);
  const canLoadMore = showingFiltered && results.length < filterTotal;

  const loadHome = async () => {
    try {
      setLoading(true);

      const data = await getHome();

      setSections({
        "Popular Movies": data.trending || [],
        Latest: data.latest || [],
        "Free to Watch": data.free || [],
        "Hindi Movies": data.hindi || [],
        "Telugu Movies": data.telugu || [],
        "Tamil Movies": data.tamil || [],
      });
    } catch (err) {
      console.error("Home API failed:", err);
      setSections({});
    } finally {
      setLoading(false);
    }
  };

  const runGlobalSearch = async (searchText, selectedLanguage, selectedYear, selectedPage, append) => {
    const params = new URLSearchParams();
    params.set("q", searchText);
    params.set("page", String(selectedPage));
    params.set("limit", String(PAGE_SIZE));

    if (selectedYear) params.set("year", selectedYear);
    if (selectedLanguage) params.set("language", selectedLanguage);

    const res = await fetch(`${API_BASE}/api/v3/global-search?${params.toString()}`);

    if (!res.ok) {
      throw new Error(`Global search failed: ${res.status}`);
    }

    const data = await res.json();
    const items = data.items || [];

    setResults((prev) => (append ? [...prev, ...items] : items));
    setFilterTotal(data.total || 0);
    setPage(selectedPage);
  };

  const runFilter = async (
    searchText = "",
    selectedLanguage = "",
    selectedYear = "",
    selectedSort = "popular",
    selectedAvailability = "",
    selectedProvider = "",
    selectedPage = 1,
    append = false
  ) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      if (searchText) {
        await runGlobalSearch(searchText, selectedLanguage, selectedYear, selectedPage, append);
      } else {
        const data = await getMovies({
          page: selectedPage,
          limit: PAGE_SIZE,
          language: selectedLanguage || "",
          year: selectedYear || "",
          sort: selectedSort || "popular",
          availability: selectedAvailability || "",
          provider: selectedProvider || "",
        });

        const items = data.items || [];

        setResults((prev) => (append ? [...prev, ...items] : items));
        setFilterTotal(data.total || 0);
        setPage(selectedPage);
      }
    } catch (err) {
      console.error("Filter API failed:", err);
      if (!append) {
        setResults([]);
        setFilterTotal(0);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    loadHome();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (showingFiltered) {
        runFilter(query, language, year, sort, availability, provider, 1, false);
      }
    }, 250);

    return () => clearTimeout(timeout);
  }, [language, year, sort, availability, provider]);

  const handleSearch = async (q) => {
    const clean = q.trim();
    setQuery(clean);

    if (!clean && !language && !year && sort === "popular" && !availability && !provider) {
      setResults([]);
      setFilterTotal(0);
      setPage(1);
      await loadHome();
      return;
    }

    await runFilter(clean, language, year, sort, availability, provider, 1, false);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !canLoadMore) return;

    trackLoadMore(page + 1);
    await runFilter(query, language, year, sort, availability, provider, page + 1, true);
  };

  const handleLanguageChange = (value) => {
    setLanguage(value);
    trackLanguageOpen(value || "all");
  };

  const handleYearChange = (value) => {
    setYear(value);
    trackFilter("year", value || "all");
  };

  const handleSortChange = (value) => {
    setSort(value);
    trackFilter("sort", value || "popular");
  };

  const handleAvailabilityChange = (value) => {
    setAvailability(value);
    trackFilter("availability", value || "all");
  };

  const handleProviderChange = (value) => {
    setProvider(value);
    trackFilter("provider", value || "all");
  };

  const availabilityLabel =
    AVAILABILITY.find((item) => item.value === availability)?.label || "All Movies";

  const providerLabel =
    PROVIDERS.find((item) => item.value === provider)?.label || "All Providers";

  const languageLabel =
    LANGUAGES.find((item) => item.slug === language)?.label || "All Indian Languages";

  const sortLabel = SORTS.find((s) => s.value === sort)?.label || "Popular";

  const titleParts = [];
  if (language) titleParts.push(languageLabel);
  if (provider) titleParts.push(providerLabel);
  if (availability) titleParts.push(availabilityLabel);
  if (year) titleParts.push(year);
  titleParts.push(sortLabel);

  const resultTitle = query
    ? `Search Results for "${query}" (${filterTotal})`
    : `${titleParts.join(" • ")} Movies (${filterTotal})`;

  return (
    <div className="home-page">
      <Navbar />

      {!query && (
        <div className="home-filter-row home-filter-row-v2">
          <select
            className="year-dropdown language-dropdown-v2"
            value={language}
            onChange={(e) => handleLanguageChange(e.target.value)}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.slug || "all"} value={lang.slug}>
                {lang.label}
              </option>
            ))}
          </select>

          <select
            className="year-dropdown"
            value={year}
            onChange={(e) => handleYearChange(e.target.value)}
          >
            <option value="">All Years</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          <select
            className="year-dropdown"
            value={sort}
            onChange={(e) => handleSortChange(e.target.value)}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            className="year-dropdown"
            value={availability}
            onChange={(e) => handleAvailabilityChange(e.target.value)}
          >
            {AVAILABILITY.map((item) => (
              <option key={item.value || "all"} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select
            className="year-dropdown"
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value)}
          >
            {PROVIDERS.map((item) => (
              <option key={item.value || "all-provider"} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="home-search-wrap">
        <SearchBar onSearch={handleSearch} large />
      </div>

      {showingFiltered ? (
        <section className="home-filter-results">
          <h2>{loading ? "Loading movies..." : resultTitle}</h2>

          {loading ? (
            <SkeletonRow />
          ) : results.length === 0 ? (
            <p className="home-empty">No movies found.</p>
          ) : (
            <>
              <MovieGrid movies={results} />

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
      ) : (
        <>
          {loading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : (
            Object.entries(sections).map(([title, movies]) => (
              <Row key={title} title={title} movies={movies} />
            ))
          )}
        </>
      )}

      <Footer />
    </div>
  );
}
