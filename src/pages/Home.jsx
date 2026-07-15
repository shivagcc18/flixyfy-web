import { useEffect, useState } from "react";
import SkeletonRow from "../components/SkeletonRow";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Row from "../components/Row";
import SearchBar from "../components/SearchBar";
import MovieGrid from "../components/MovieGrid";

import { getHome } from "../api/flixyfyApi";
import { setPageSeo, setJsonLd } from "../utils/seo";
import { trackFilter, trackLanguageOpen, trackLoadMore } from "../utils/analytics";
import { fetchFlixyfyJson, normalizeProviderForApi, providerDisplayLabel, providerFromCurrentUrl, providerValueForState, syncProviderToUrl } from "../utils/providerFetchPatch";
import "./Home.css";

// FLIXYFY_HOME_DIRECT_PROVIDER_RESULTS_V14
// Home provider filters now fetch /api/v4/movies directly from Home.jsx.
// This bypasses stale helper/cache/bridge paths that were producing provider total 0.

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://flixyfy-api-fresh-production.up.railway.app";

// FLIXYFY_HOME_PROVIDER_FETCH_HARDEN_V15
// Some Vercel environments can define the API base as either root, /api, or /api/v4.
// Home provider filters must always hit exactly /api/v4/movies.
function normalizeApiRoot(value) {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api\/v3$/i, "")
    .replace(/\/api$/i, "");
}

const API_ROOT_CANDIDATES = Array.from(
  new Set([
    normalizeApiRoot(API_BASE),
    "https://flixyfy-api-fresh-production.up.railway.app",
  ].filter(Boolean))
);

const PAGE_SIZE = 25;
const FILTER_CACHE_TTL = 60 * 1000;
const filterResponseCache = new Map();
const pendingFilterRequests = new Map();

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

const GLOBAL_WEBSERIES_LANGUAGES = [
  { label: "All Global Languages", slug: "" },
  { label: "English", slug: "en" },
  { label: "Korean", slug: "ko" },
  { label: "Japanese", slug: "ja" },
  { label: "Spanish", slug: "es" },
  { label: "French", slug: "fr" },
  { label: "German", slug: "de" },
];

const PEOPLE_LANGUAGES = [
  { label: "All Indian People", slug: "" },
  { label: "Telugu / Tollywood", slug: "telugu" },
  { label: "Hindi / Bollywood", slug: "hindi" },
  { label: "Tamil / Kollywood", slug: "tamil" },
  { label: "Kannada / Sandalwood", slug: "kannada" },
  { label: "Malayalam / Mollywood", slug: "malayalam" },
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
  { label: "Top IMDb", value: "rating" },
];

const AVAILABILITY = [
  { label: "All Titles", value: "" },
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
  { label: "MX Player", value: "mx_player" },
  { label: "Apple TV", value: "apple_tv_store" },
  { label: "Disney+", value: "disney_plus" },
  { label: "Hulu", value: "hulu" },
  { label: "Max", value: "max" },
  { label: "Rakuten Viki", value: "viki" },
  { label: "Kocowa", value: "kocowa" },
  { label: "TVING", value: "tving" },
  { label: "Wavve", value: "wavve" },
  { label: "Watcha", value: "watcha" },
  { label: "Coupang Play", value: "coupang_play" },
  { label: "YouTube", value: "youtube" },
];

const SEARCH_TYPES = [
  { label: "Movies", value: "movies" },
  { label: "Webseries", value: "webseries" },
  { label: "People", value: "people" },
  { label: "All", value: "all" },
];

function getItems(data) {
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.movies)) return data.movies;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
}

function getTotal(data, items) {
  const value =
    data?.total ??
    data?.count ??
    data?.total_count ??
    data?.total_results ??
    items.length;

  const number = Number(value);
  return Number.isFinite(number) ? number : items.length;
}

async function fetchApiUncached(cleanPath) {
  const urls = API_ROOT_CANDIDATES.map((root) => `${root}/api/v4${cleanPath}`);
  const errors = [];

  for (const url of urls) {
    try {
      const data = await fetchFlixyfyJson(url, {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      if (typeof window !== "undefined") {
        window.__FLIXYFY_HOME_DEBUG__ = {
          version: "FLIXYFY_HOME_PROVIDER_FETCH_HARDEN_V15",
          ok: true,
          url,
          total: data?.total,
          items_len: Array.isArray(data?.items) ? data.items.length : null,
          ts: new Date().toISOString(),
        };
      }

      return data;
    } catch (err) {
      errors.push(`${url} :: ${err?.message || String(err)}`);
    }
  }

  if (typeof window !== "undefined") {
    window.__FLIXYFY_HOME_DEBUG__ = {
      version: "FLIXYFY_HOME_PROVIDER_FETCH_HARDEN_V15",
      ok: false,
      path: cleanPath,
      errors,
      ts: new Date().toISOString(),
    };
  }

  throw new Error(errors.join(" | "));
}

async function fetchApi(path) {
  const cleanPath = String(path || "").startsWith("/") ? String(path || "") : `/${path}`;
  const cached = filterResponseCache.get(cleanPath);
  if (cached && Date.now() - cached.createdAt < FILTER_CACHE_TTL) {
    return cached.data;
  }

  if (pendingFilterRequests.has(cleanPath)) {
    return pendingFilterRequests.get(cleanPath);
  }

  const request = fetchApiUncached(cleanPath)
    .then((data) => {
      filterResponseCache.set(cleanPath, { data, createdAt: Date.now() });
      return data;
    })
    .finally(() => pendingFilterRequests.delete(cleanPath));

  pendingFilterRequests.set(cleanPath, request);
  return request;
}

function buildMoviesPath({
  page,
  limit,
  language,
  year,
  sort,
  availability,
  provider,
  relaxed = false,
}) {
  const params = new URLSearchParams();

  params.set("page", String(page || 1));
  params.set("limit", String(limit || PAGE_SIZE));

  const providerForApi = normalizeProviderForApi(provider);
  if (providerForApi && providerForApi !== "all") {
    params.set("provider", providerForApi);
  }

  if (!relaxed) {
    if (language) params.set("language", language);
    if (year) params.set("year", year);
    if (availability) params.set("availability", availability);

    const cleanSort = String(sort || "").trim();
    if (cleanSort && cleanSort !== "popular") {
      params.set("sort", cleanSort);
    }
  }

  return `/movies?${params.toString()}`;
}

export default function Home() {
  const [sections, setSections] = useState({});
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");
  const [language, setLanguage] = useState("");
  const [year, setYear] = useState("");
  const [sort, setSort] = useState("popular");
  const [availability, setAvailability] = useState("");
  const [provider, setProvider] = useState(() => providerFromCurrentUrl());
  const [searchType, setSearchType] = useState("movies");
  const [searchScope, setSearchScope] = useState("indian");
  const [filterTotal, setFilterTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [filterError, setFilterError] = useState("");

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

  useEffect(() => {
    const urlProvider = providerFromCurrentUrl();
    if (urlProvider && urlProvider !== provider) {
      setProvider(urlProvider);
    }
  }, []);

  useEffect(() => {
    if (searchScope === "global" && searchType === "people") {
      setSearchType("all");
    }
  }, [searchScope, searchType]);

  const showLanguageFilter =
    searchScope === "indian" ||
    searchType === "people" ||
    (searchType === "webseries" && searchScope === "global");
  const showYearFilter = searchType !== "people";
  const showAvailabilityFilter = searchType !== "people";
  const showProviderFilter = searchType !== "people";
  const languageOptions =
    searchType === "people"
      ? PEOPLE_LANGUAGES
      : searchType === "webseries" && searchScope === "global"
        ? GLOBAL_WEBSERIES_LANGUAGES
        : LANGUAGES;

  const activeLanguage = showLanguageFilter ? language : "";
  const activeYear = showYearFilter ? year : "";
  const activeAvailability = showAvailabilityFilter ? availability : "";
  const activeProvider = showProviderFilter ? providerValueForState(provider) : "";

  const showingFiltered = Boolean(
    query ||
      activeLanguage ||
      activeYear ||
      sort !== "popular" ||
      activeAvailability ||
      activeProvider ||
      searchType !== "movies"
  );
  const canLoadMore = showingFiltered && results.length < filterTotal;

  const loadHome = async () => {
    try {
      setLoading(true);
      const data = await getHome();

      setSections({
        "Indian Movies": data.trending || [],
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

  const applyData = (data, selectedPage, append) => {
    const items = getItems(data);
    const total = getTotal(data, items);

    setResults((prev) => (append ? [...prev, ...items] : items));
    setFilterTotal(total);
    setPage(selectedPage);
  };

  const runGlobalSearch = async (
    searchText,
    selectedLanguage,
    selectedYear,
    selectedType,
    selectedScope,
    selectedSort = "popular",
    selectedAvailability = "",
    selectedProvider = "",
    selectedPage,
    append
  ) => {
    const params = new URLSearchParams();
    const cleanType = selectedType || "movies";
    const cleanScope = selectedScope || "indian";

    params.set("q", searchText || "");
    params.set("page", String(selectedPage));
    params.set("limit", String(PAGE_SIZE));
    params.set("type", cleanType);

    if (cleanType === "webseries") {
      params.set("region", cleanScope === "global" ? "global" : "indian");
    } else if (cleanScope === "indian") {
      params.set("domain", "indian");
    }

    const requestLanguage = selectedLanguage || "";
    const requestYear = cleanType === "people" ? "" : selectedYear;
    const requestAvailability = cleanType === "people" ? "" : selectedAvailability;
    const requestProvider = cleanType === "people" ? "" : selectedProvider;

    if (requestYear) params.set("year", requestYear);

    if (cleanType === "webseries" && cleanScope === "global" && selectedLanguage) {
      params.set("language", selectedLanguage);
    } else if (requestLanguage) {
      params.set("language", requestLanguage);
    }

    if (selectedSort && selectedSort !== "popular") params.set("sort", selectedSort);
    if (requestAvailability) params.set("availability", requestAvailability);

    const providerForApi = normalizeProviderForApi(requestProvider);
    if (providerForApi && providerForApi !== "all") {
      params.set("provider", providerForApi);
    }

    const data = await fetchApi(`/global-search?${params.toString()}`);
    applyData(data, selectedPage, append);
  };

  const runMoviesDirect = async (
    selectedLanguage,
    selectedYear,
    selectedSort,
    selectedAvailability,
    selectedProvider,
    selectedPage,
    append
  ) => {
    const providerForApi = normalizeProviderForApi(selectedProvider);

    const strictPath = buildMoviesPath({
      page: selectedPage,
      limit: PAGE_SIZE,
      language: selectedLanguage,
      year: selectedYear,
      sort: selectedSort,
      availability: selectedAvailability,
      provider: providerForApi,
      relaxed: false,
    });

    const strictData = await fetchApi(strictPath);
    const strictItems = getItems(strictData);

    if (!providerForApi || providerForApi === "all" || strictItems.length > 0) {
      applyData(strictData, selectedPage, append);
      return;
    }

    // Provider fallback: provider results must never display zero when the canonical provider endpoint is positive.
    const relaxedPath = buildMoviesPath({
      page: selectedPage,
      limit: PAGE_SIZE,
      provider: providerForApi,
      relaxed: true,
    });

    const relaxedData = await fetchApi(relaxedPath);
    applyData(relaxedData, selectedPage, append);
  };

  const runFilter = async (
    searchText = "",
    selectedLanguage = "",
    selectedYear = "",
    selectedSort = "popular",
    selectedAvailability = "",
    selectedProvider = "",
    selectedType = "movies",
    selectedScope = "indian",
    selectedPage = 1,
    append = false
  ) => {
    try {
      setFilterError("");

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      if (searchText || selectedType !== "movies") {
        await runGlobalSearch(
          searchText,
          selectedLanguage,
          selectedYear,
          selectedType,
          selectedScope,
          selectedSort,
          selectedAvailability,
          selectedProvider,
          selectedPage,
          append
        );
      } else {
        await runMoviesDirect(
          selectedLanguage || "",
          selectedYear || "",
          selectedSort || "popular",
          selectedAvailability || "",
          selectedProvider || "",
          selectedPage,
          append
        );
      }
    } catch (err) {
      console.error("Filter API failed:", err);
      if (!append) {
        setResults([]);
        setFilterTotal(0);
        setFilterError(err?.message || String(err));
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
        runFilter(
          query,
          activeLanguage,
          activeYear,
          sort,
          activeAvailability,
          activeProvider,
          searchType,
          searchScope,
          1,
          false
        );
      }
    }, 150);

    return () => clearTimeout(timeout);
  }, [
    query,
    activeLanguage,
    activeYear,
    sort,
    activeAvailability,
    activeProvider,
    searchType,
    searchScope,
    showingFiltered,
  ]);

  const handleSearch = async (q) => {
    const clean = q.trim();
    setQuery(clean);

    if (!clean && !activeLanguage && !activeYear && sort === "popular" && !activeAvailability && !activeProvider) {
      setResults([]);
      setFilterTotal(0);
      setPage(1);
      await loadHome();
      return;
    }

    await runFilter(
      clean,
      activeLanguage,
      activeYear,
      sort,
      activeAvailability,
      activeProvider,
      searchType,
      searchScope,
      1,
      false
    );
  };

  const handleLoadMore = async () => {
    if (loadingMore || !canLoadMore) return;

    trackLoadMore(page + 1);
    await runFilter(
      query,
      activeLanguage,
      activeYear,
      sort,
      activeAvailability,
      activeProvider,
      searchType,
      searchScope,
      page + 1,
      true
    );
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
    if (String(value || "").toLowerCase().includes("free")) { setProvider("youtube"); syncProviderToUrl("youtube"); }
    if (String(value || "").toLowerCase().includes("free")) { setProvider("youtube"); syncProviderToUrl("youtube"); }
    setAvailability(value);
    trackFilter("availability", value || "all");
  };

  const handleProviderChange = (value) => {
    const normalizedProvider = providerValueForState(value);
    setProvider(normalizedProvider);
    trackFilter("provider", normalizedProvider || "all");

    try {
      const url = new URL(window.location.href);
      if (normalizedProvider) {
        url.searchParams.set("provider", normalizedProvider);
      } else {
        url.searchParams.delete("provider");
      }
      window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
    } catch (_) {
      // URL sync is noncritical.
    }
  };

  const handleSearchTypeChange = (value) => {
    setSearchType(value);
    setLanguage("");
    setYear("");
    setAvailability("");
    setProvider("");
    trackFilter("search_type", value);
  };

  const availabilityLabel =
    AVAILABILITY.find((item) => item.value === availability)?.label || "All Movies";

  const providerLabel =
    PROVIDERS.find((item) => item.value === activeProvider)?.label ||
    providerDisplayLabel(activeProvider) ||
    "All Providers";

  const languageLabel =
    languageOptions.find((item) => item.slug === activeLanguage)?.label ||
    languageOptions[0]?.label ||
    "All Indian Languages";

  const sortLabel = SORTS.find((s) => s.value === sort)?.label || "Popular";
  const searchPlaceholder =
    searchType === "people"
      ? "Search actors, directors, people..."
      : searchType === "webseries"
        ? "Search webseries..."
        : searchType === "all"
          ? "Search movies and webseries..."
          : "Search movies...";

  const contentLabel =
    searchType === "people"
      ? "People"
      : searchType === "webseries"
        ? "Webseries"
        : searchType === "all"
          ? "Movies & Webseries"
          : "Movies";

  const titleParts = [];
  if (activeLanguage) titleParts.push(languageLabel);
  if (activeProvider) titleParts.push(providerLabel);
  if (activeAvailability) titleParts.push(availabilityLabel);
  if (activeYear) titleParts.push(activeYear);
  titleParts.push(sortLabel);

  const resultTitle = query
    ? `${searchScope === "global" ? "Global" : "Indian"} ${contentLabel} Search Results for "${query}" (${filterTotal})`
    : `${titleParts.join(" • ")} ${contentLabel} (${filterTotal})`;

  const displayResultTitle = query
    ? resultTitle
    : `${titleParts.join(" - ")} ${contentLabel} (${filterTotal})`;

  const loadedResultCount = Math.min(results.length, filterTotal || results.length);
  const showingResultText =
    !loading && showingFiltered && filterTotal > 0
      ? `Showing ${loadedResultCount} of ${filterTotal}`
      : "";

  return (
    <div className={`home-page ${searchScope === "global" ? "home-global-scope" : "home-indian-scope"}`}>
      <Navbar />

      {!query && (
        <div className="home-filter-row home-filter-row-v2">
          {showLanguageFilter && (
            <select
              className="year-dropdown language-dropdown-v2"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
            >
              {languageOptions.map((lang) => (
                <option key={lang.slug || "all"} value={lang.slug}>
                  {lang.label}
                </option>
              ))}
            </select>
          )}

          {showYearFilter && (
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
          )}

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

          {showAvailabilityFilter && (
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
          )}

          {showProviderFilter && (
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
          )}
        </div>
      )}

      <div className="home-search-wrap">
        <SearchBar
          onSearch={handleSearch}
          large
          suggestionType={searchType}
          suggestionScope={searchScope}
          placeholder={searchPlaceholder}
          focusKey={searchType}
        />
        <div className="search-control-stack">
          <div className="search-scope-toggle" role="group" aria-label="Search type">
            {SEARCH_TYPES.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`search-scope-btn ${searchType === item.value ? "active" : ""}`}
                onClick={() => handleSearchTypeChange(item.value)}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {showingFiltered ? (
        <section className="home-filter-results">
          <h2>{loading ? `Loading ${contentLabel.toLowerCase()}...` : displayResultTitle}</h2>
          {showingResultText && (
            <p className="home-result-count-note">{showingResultText}</p>
          )}

          {loading ? (
            <SkeletonRow />
          ) : results.length === 0 ? (
            <>
              <p className="home-empty">No {contentLabel.toLowerCase()} found.</p>
              {filterError && (
                <p className="home-empty" style={{ opacity: 0.7, fontSize: "12px" }}>
                  Results could not be loaded. Please try again.
                </p>
              )}
            </>
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
