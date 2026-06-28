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
const DOMAIN_FETCH_LIMIT = 5000;

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

const PROVIDER_ALIASES = {
  netflix: ["netflix"],
  prime_video: ["prime_video", "prime video", "amazon prime", "amazon prime video", "prime"],
  jiohotstar: ["jiohotstar", "hotstar", "disney+ hotstar", "disney hotstar", "jio hotstar"],
  zee5: ["zee5", "zee 5"],
  sonyliv: ["sonyliv", "sony liv"],
  aha: ["aha"],
  sun_nxt: ["sun nxt", "sunnxt", "sun_nxt"],
  etv_win: ["etv win", "etv_win"],
  youtube: ["youtube", "you tube"],
};

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

const HISTORICAL_BLOCKED_SLUGS = new Set([
  "a-k-47-1999-te",
  "a-r-rahman",
  "ar-rahman",
  "a-venkatesh",
]);

const HISTORICAL_CLASSIC_TITLE_BOOSTS = new Map([
  ["dilwale dulhania le jayenge", 10000],
  ["sholay", 9950],
  ["hum aapke hain koun", 9900],
  ["hum aapke hain kaun", 9900],
  ["mughal-e-azam", 9850],
  ["mughal e azam", 9850],
  ["mother india", 9800],
  ["guide", 9750],
  ["pyaasa", 9700],
  ["deewaar", 9650],
  ["deewar", 9650],
  ["anand", 9600],
  ["nayakan", 9550],
  ["thevar magan", 9500],
  ["thalapathi", 9450],
  ["baasha", 9400],
  ["indian", 9350],
  ["bombay", 9300],
  ["roja", 9250],
  ["manichitrathazhu", 9200],
  ["kireedam", 9150],
  ["bharatham", 9100],
  ["mayabazar", 9050],
  ["sankarabharanam", 9000],
  ["sagara sangamam", 8950],
  ["rudraveena", 8900],
  ["swathi muthyam", 8850],
  ["jagadeka veerudu athiloka sundari", 8800],
  ["gang leader", 8750],
  ["bangarada manushya", 8700],
  ["nagarahavu", 8650],
  ["om", 8600],
  ["upendra", 8550],
  ["baazigar", 8500],
  ["darr", 8450],
  ["kuch kuch hota hai", 8400],
  ["andaz apna apna", 8350],
  ["sarfarosh", 8300],
  ["rangeela", 8250],
  ["satya", 8200],
  ["parinda", 8150],
]);

function normalizeTitle(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[._:;'"!?()[\]{}]/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeSlug(value) {
  return String(value || "").trim().toLowerCase();
}

function isHistoricalNonMovieRow(movie) {
  const title = normalizeTitle(movie?.title || movie?.name || movie?.original_title);
  const slug = normalizeSlug(movie?.slug || "");

  if (slug && HISTORICAL_BLOCKED_SLUGS.has(slug)) return true;
  if (title && HISTORICAL_NON_MOVIE_TITLES.has(title)) return true;

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

  return lowered.startsWith("http://") || lowered.startsWith("https://") || lowered.startsWith("/");
}

function getYear(movie) {
  const parsed = Number(movie?.release_year || movie?.year || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function collectProviderText(value, parts = [], depth = 0) {
  if (depth > 3 || value == null) return parts;

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    parts.push(String(value));
    return parts;
  }

  if (Array.isArray(value)) {
    value.slice(0, 20).forEach((item) => collectProviderText(item, parts, depth + 1));
    return parts;
  }

  if (typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => {
      const loweredKey = String(key).toLowerCase();
      if (
        loweredKey.includes("ott") ||
        loweredKey.includes("provider") ||
        loweredKey.includes("watch") ||
        loweredKey.includes("link") ||
        loweredKey.includes("platform") ||
        loweredKey.includes("source")
      ) {
        parts.push(key);
        collectProviderText(item, parts, depth + 1);
      }
    });
  }

  return parts;
}

function getProviderText(movie) {
  const parts = [];

  [
    movie?.ott_primary,
    movie?.ott_primary_key,
    movie?.provider,
    movie?.provider_key,
    movie?.provider_name,
    movie?.watch_provider,
    movie?.watch_providers,
    movie?.ott_provider,
    movie?.ott_providers,
    movie?.ott_links,
    movie?.watch_links,
    movie?.youtube_url,
    movie?.youtube_link,
  ].forEach((value) => collectProviderText(value, parts));

  return parts.join(" ").toLowerCase();
}

function hasAnyProvider(movie) {
  if (movie?.has_ott === true) return true;
  if (movie?.has_free_ott === true) return true;
  if (movie?.has_subscription_ott === true) return true;
  if (movie?.has_rent_ott === true) return true;
  if (movie?.has_buy_ott === true) return true;
  if (movie?.is_free === true) return true;

  if (getNumber(movie?.ott_count) > 0) return true;

  const providerText = getProviderText(movie);
  return Object.values(PROVIDER_ALIASES).some((aliases) =>
    aliases.some((alias) => providerText.includes(alias))
  );
}

function matchesSelectedProvider(movie, selectedProvider) {
  if (!selectedProvider) return true;

  const aliases = PROVIDER_ALIASES[selectedProvider] || [selectedProvider];
  const providerText = getProviderText(movie);

  return aliases.some((alias) => providerText.includes(alias));
}

function matchesAvailability(movie, selectedAvailability) {
  if (selectedAvailability === "all") return true;

  if (selectedAvailability === "ott") {
    return hasAnyProvider(movie);
  }

  if (selectedAvailability === "free") {
    if (movie?.is_free === true || movie?.has_free_ott === true) return true;

    const text = getProviderText(movie);
    return text.includes("youtube") || text.includes("free");
  }

  return true;
}

function getClassicTitleBoost(movie) {
  const title = normalizeTitle(movie?.title || movie?.name || movie?.original_title);
  const slug = normalizeSlug(movie?.slug || "")
    .replace(/-\d{4}.*/, "")
    .replace(/-/g, " ");

  if (HISTORICAL_CLASSIC_TITLE_BOOSTS.has(title)) {
    return HISTORICAL_CLASSIC_TITLE_BOOSTS.get(title);
  }

  if (HISTORICAL_CLASSIC_TITLE_BOOSTS.has(slug)) {
    return HISTORICAL_CLASSIC_TITLE_BOOSTS.get(slug);
  }

  return 0;
}

function getPopularScore(movie, originalIndex = 0, domain = "") {
  const classicBoost = domain === "historical" ? getClassicTitleBoost(movie) : 0;
  const quality = getNumber(movie?.quality_score);
  const popularity = getNumber(movie?.popularity);
  const rating = getNumber(movie?.rating);
  const voteCount = getNumber(movie?.vote_count);
  const apiOrderScore = Math.max(0, 1000 - originalIndex);

  return (
    classicBoost +
    quality * 20 +
    popularity * 10 +
    rating * 100 +
    Math.min(voteCount, 5000) / 5 +
    apiOrderScore
  );
}

function cleanAndFilterDomainItems(items, domain, selectedAvailability, selectedProvider) {
  if (!Array.isArray(items)) return [];

  return items.filter((movie) => {
    if (domain === "historical" && isHistoricalNonMovieRow(movie)) return false;
    if (!matchesAvailability(movie, selectedAvailability)) return false;
    if (!matchesSelectedProvider(movie, selectedProvider)) return false;
    return true;
  });
}

function sortDomainItems(items, selectedSort, domain) {
  if (!Array.isArray(items)) return [];

  return [...items]
    .map((movie, index) => ({ movie, index }))
    .sort((a, b) => {
      const aPosterRank = hasRealPoster(a.movie) ? 0 : 1;
      const bPosterRank = hasRealPoster(b.movie) ? 0 : 1;

      if (aPosterRank !== bPosterRank) return aPosterRank - bPosterRank;

      const aProviderRank = hasAnyProvider(a.movie) ? 0 : 1;
      const bProviderRank = hasAnyProvider(b.movie) ? 0 : 1;

      if (aProviderRank !== bProviderRank) return aProviderRank - bProviderRank;

      if (selectedSort === "title") {
        return String(a.movie?.title || "").localeCompare(String(b.movie?.title || ""));
      }

      if (selectedSort === "latest") {
        const yearDiff = getYear(b.movie) - getYear(a.movie);
        if (yearDiff !== 0) return yearDiff;

        const scoreDiff =
          getPopularScore(b.movie, b.index, domain) - getPopularScore(a.movie, a.index, domain);
        if (scoreDiff !== 0) return scoreDiff;

        return a.index - b.index;
      }

      if (selectedSort === "rating") {
        const ratingDiff = getNumber(b.movie?.rating) - getNumber(a.movie?.rating);
        if (ratingDiff !== 0) return ratingDiff;

        const scoreDiff =
          getPopularScore(b.movie, b.index, domain) - getPopularScore(a.movie, a.index, domain);
        if (scoreDiff !== 0) return scoreDiff;

        return a.index - b.index;
      }

      const scoreDiff =
        getPopularScore(b.movie, b.index, domain) - getPopularScore(a.movie, a.index, domain);
      if (scoreDiff !== 0) return scoreDiff;

      return a.index - b.index;
    })
    .map((item) => item.movie);
}

function prepareDomainItems(items, domain, selectedSort, selectedAvailability, selectedProvider) {
  const filtered = cleanAndFilterDomainItems(
    items,
    domain,
    selectedAvailability,
    selectedProvider
  );

  return sortDomainItems(filtered, selectedSort, domain);
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

  const [allFetchedMovies, setAllFetchedMovies] = useState([]);
  const [movies, setMovies] = useState([]);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [sort, setSort] = useState("popular");
  const [language, setLanguage] = useState("");
  const [availability, setAvailability] = useState("all");
  const [provider, setProvider] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [serverTotal, setServerTotal] = useState(0);
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

  const applyLocalFiltersAndSort = (rawItems, nextPage = 1) => {
    const preparedItems = prepareDomainItems(rawItems, domain, sort, availability, provider);
    const visibleItems = preparedItems.slice(0, nextPage * PAGE_SIZE);

    setMovies(visibleItems);
    setTotal(preparedItems.length);
    setPage(nextPage);
  };

  const fetchMovies = async (searchText = query) => {
    try {
      setLoading(true);

      const params = new URLSearchParams();
      params.set("page", "1");
      params.set("limit", String(DOMAIN_FETCH_LIMIT));
      params.set("sort", sort || "popular");

      if (searchText) params.set("q", searchText);
      if (year) params.set("year", year);
      if (domain === "historical" && language) params.set("language", language);

      if (availability === "ott") params.set("has_ott", "true");

      if (availability === "free") {
        params.set("has_ott", "true");
        params.set("has_free_ott", "true");
        params.set("is_free", "true");
      }

      if (provider) params.set("provider", provider);

      const res = await fetch(`${API_BASE}${config.apiPath}?${params.toString()}`);

      if (!res.ok) {
        throw new Error(`API failed: ${res.status}`);
      }

      const data = await res.json();
      const rawItems = data.items || data.movies || data.results || [];

      setAllFetchedMovies(rawItems);
      setServerTotal(data.total || rawItems.length || 0);

      const preparedItems = prepareDomainItems(rawItems, domain, sort, availability, provider);
      setMovies(preparedItems.slice(0, PAGE_SIZE));
      setTotal(preparedItems.length);
      setPage(1);
    } catch (err) {
      console.error(`${domain} API failed:`, err);
      setAllFetchedMovies([]);
      setMovies([]);
      setTotal(0);
      setServerTotal(0);
      setPage(1);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setAllFetchedMovies([]);
    setMovies([]);
    setPage(1);
    fetchMovies(query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, year, sort, language, availability, provider]);

  const handleSearch = async (value) => {
    const clean = value.trim();
    setQuery(clean);
    setAllFetchedMovies([]);
    setMovies([]);
    setPage(1);
    await fetchMovies(clean);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !canLoadMore) return;

    setLoadingMore(true);
    const nextPage = page + 1;
    applyLocalFiltersAndSort(allFetchedMovies, nextPage);
    setLoadingMore(false);
  };

  const shownCountLabel =
    total === serverTotal || !serverTotal
      ? total
      : `${total} shown from top ${Math.min(serverTotal, DOMAIN_FETCH_LIMIT)}`;

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

          <select value={availability} onChange={(e) => setAvailability(e.target.value)}>
            {AVAILABILITY_OPTIONS.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>

          <select value={provider} onChange={(e) => setProvider(e.target.value)}>
            {PROVIDERS.map((item) => (
              <option key={item.value || "all"} value={item.value}>
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
            ? `Search Results for "${query}" (${shownCountLabel})`
            : `${config.title} (${shownCountLabel})`}
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