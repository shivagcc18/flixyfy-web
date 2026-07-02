import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
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

const HISTORICAL_YEARS = [];
for (let year = 1999; year >= 1960; year--) HISTORICAL_YEARS.push(String(year));

const MODERN_YEARS = [];
for (let year = 2026; year >= 2000; year--) MODERN_YEARS.push(String(year));

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

const HOLLYWOOD_PROVIDERS = [
  { label: "All Providers", value: "" },
  { label: "Netflix", value: "netflix" },
  { label: "Prime Video", value: "prime_video" },
  { label: "Apple TV", value: "apple_tv" },
  { label: "Disney+", value: "disney_plus" },
  { label: "Max", value: "max" },
  { label: "Hulu", value: "hulu" },
  { label: "Paramount+", value: "paramount_plus" },
  { label: "Peacock", value: "peacock" },
  { label: "Tubi", value: "tubi" },
  { label: "Roku Channel", value: "roku" },
  { label: "Pluto TV", value: "pluto_tv" },
  { label: "Plex", value: "plex" },
  { label: "YouTube", value: "youtube" },
  { label: "Google Play", value: "google_play" },
  { label: "Fandango", value: "fandango" },
  { label: "Microsoft Store", value: "microsoft_store" },
  { label: "AMC+", value: "amc_plus" },
  { label: "Starz", value: "starz" },
  { label: "MGM+", value: "mgm_plus" },
  { label: "Showtime", value: "showtime" },
  { label: "Mubi", value: "mubi" },
  { label: "Kanopy", value: "kanopy" },
  { label: "Hoopla", value: "hoopla" },
  { label: "Crunchyroll", value: "crunchyroll" },
];

const HISTORICAL_PROVIDERS = [
  { label: "All Providers", value: "" },
  { label: "YouTube", value: "youtube" },
];

const PROVIDER_ALIASES = {
  netflix: ["netflix"],
  prime_video: ["prime_video", "prime video", "amazon prime", "amazon prime video", "prime"],
  apple_tv: ["apple tv", "apple tv+", "appletv"],
  disney_plus: ["disney+", "disney plus", "disney"],
  max: ["max", "hbo max"],
  hulu: ["hulu"],
  paramount_plus: ["paramount+", "paramount plus"],
  peacock: ["peacock"],
  tubi: ["tubi"],
  roku: ["roku", "roku channel"],
  pluto_tv: ["pluto", "pluto tv"],
  plex: ["plex"],
  youtube: ["youtube", "you tube", "youtu.be", "youtube.com"],
  google_play: ["google play", "google tv"],
  fandango: ["fandango", "vudu"],
  microsoft_store: ["microsoft"],
  amc_plus: ["amc+", "amc plus"],
  starz: ["starz"],
  mgm_plus: ["mgm+", "mgm plus", "epix"],
  showtime: ["showtime"],
  mubi: ["mubi"],
  kanopy: ["kanopy"],
  hoopla: ["hoopla"],
  crunchyroll: ["crunchyroll"],
};

const HISTORICAL_LANGUAGES = [
  { label: "All Languages", value: "" },
  { label: "Hindi", value: "hi" },
  { label: "Tamil", value: "ta" },
  { label: "Telugu", value: "te" },
  { label: "Kannada", value: "kn" },
];

const HISTORICAL_BLOCKED_SLUGS = new Set([
  "a-k-47-1999-te",
  "a-r-rahman",
  "ar-rahman",
  "a-venkatesh",
]);

const HISTORICAL_BLOCKED_TITLES = new Set([
  "a r rahman",
  "a. r. rahman",
  "a.r. rahman",
  "ar rahman",
  "a venkatesh",
  "a. venkatesh",
]);

const HISTORICAL_CLASSIC_BOOSTS = new Map([
  ["dilwale dulhania le jayenge", 10000],
  ["sholay", 9950],
  ["hum aapke hain koun", 9900],
  ["hum aapke hain kaun", 9900],
  ["mughal e azam", 9850],
  ["mughal-e-azam", 9850],
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
  ["mayabazar", 9100],
  ["lava kusa", 9075],
  ["gulebakavali katha", 9050],
  ["sankarabharanam", 9000],
  ["sagara sangamam", 8950],
  ["rudraveena", 8900],
  ["swathi muthyam", 8850],
  ["gang leader", 8750],
  ["om", 8600],
]);

function getYearsForDomain(domain) {
  return domain === "historical" ? HISTORICAL_YEARS : MODERN_YEARS;
}

function getProvidersForDomain(domain) {
  return domain === "historical" ? HISTORICAL_PROVIDERS : HOLLYWOOD_PROVIDERS;
}

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[._:;'"!?()[\]{}]/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeSlug(value) {
  return String(value || "").trim().toLowerCase();
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

  const text = String(value).trim().toLowerCase();
  if (!text) return false;

  if (text.includes("placeholder")) return false;
  if (text.includes("classic-indian")) return false;
  if (text.includes("classic indian")) return false;
  if (text.includes("no-poster")) return false;
  if (text.includes("no_poster")) return false;
  if (text.includes("default")) return false;
  if (["null", "none", "unknown"].includes(text)) return false;

  return text.startsWith("http://") || text.startsWith("https://") || text.startsWith("/");
}

function getYear(movie) {
  const value = Number(movie?.release_year || movie?.year || 0);
  return Number.isFinite(value) ? value : 0;
}

function getNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function collectProviderText(value, parts = [], depth = 0) {
  if (depth > 5 || value == null) return parts;

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    parts.push(String(value));
    return parts;
  }

  if (Array.isArray(value)) {
    value.slice(0, 100).forEach((item) => collectProviderText(item, parts, depth + 1));
    return parts;
  }

  if (typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => {
      parts.push(String(key));
      collectProviderText(item, parts, depth + 1);
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
    movie?.links,
    movie?.youtube_url,
    movie?.youtube_link,
    movie?.youtube_links,
    movie?.youtube_full_movies,
    movie?.has_youtube,
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
  if (movie?.has_youtube === true) return true;
  if (getNumber(movie?.ott_count) > 0) return true;

  const providerText = getProviderText(movie);
  return Object.values(PROVIDER_ALIASES).some((aliases) =>
    aliases.some((alias) => providerText.includes(alias))
  );
}

function matchesProvider(movie, selectedProvider) {
  if (!selectedProvider) return true;

  const aliases = PROVIDER_ALIASES[selectedProvider] || [selectedProvider];
  const providerText = getProviderText(movie);

  return aliases.some((alias) => providerText.includes(alias));
}

function matchesAvailability(movie, selectedAvailability) {
  if (selectedAvailability === "all") return true;
  if (selectedAvailability === "ott") return hasAnyProvider(movie);

  if (selectedAvailability === "free") {
    if (movie?.is_free === true || movie?.has_free_ott === true || movie?.has_youtube === true) {
      return true;
    }

    const providerText = getProviderText(movie);
    return providerText.includes("youtube") || providerText.includes("free");
  }

  return true;
}

function isBlockedHistorical(movie) {
  const slug = normalizeSlug(movie?.slug || "");
  const title = normalizeText(movie?.title || movie?.name || movie?.original_title || "");

  if (HISTORICAL_BLOCKED_SLUGS.has(slug)) return true;
  if (HISTORICAL_BLOCKED_TITLES.has(title)) return true;

  return false;
}

function getClassicBoost(movie, domain) {
  if (domain !== "historical") return 0;

  const title = normalizeText(movie?.title || movie?.name || movie?.original_title || "");
  const slugTitle = normalizeSlug(movie?.slug || "")
    .replace(/-\d{4}.*/, "")
    .replace(/-/g, " ");

  return HISTORICAL_CLASSIC_BOOSTS.get(title) || HISTORICAL_CLASSIC_BOOSTS.get(slugTitle) || 0;
}

function getPopularScore(movie, index, domain) {
  return (
    getClassicBoost(movie, domain) +
    getNumber(movie?.quality_score) * 20 +
    getNumber(movie?.popularity) * 10 +
    getNumber(movie?.rating) * 100 +
    Math.min(getNumber(movie?.vote_count), 5000) / 5 +
    Math.max(0, 1000 - index)
  );
}

function prepareItems(items, domain, sort, availability, provider) {
  if (!Array.isArray(items)) return [];

  const apiFilteredProviders = domain === "hollywood" || domain === "indian";

  return [...items]
    .filter((movie) => {
      if (domain === "historical" && isBlockedHistorical(movie)) return false;
      if (!apiFilteredProviders && !matchesAvailability(movie, availability)) return false;
      if (!apiFilteredProviders && !matchesProvider(movie, provider)) return false;
      return true;
    })
    .map((movie, index) => ({ movie, index }))
    .sort((a, b) => {
      const posterDiff = (hasRealPoster(a.movie) ? 0 : 1) - (hasRealPoster(b.movie) ? 0 : 1);
      if (posterDiff !== 0) return posterDiff;

      const providerDiff = (hasAnyProvider(a.movie) ? 0 : 1) - (hasAnyProvider(b.movie) ? 0 : 1);
      if (providerDiff !== 0) return providerDiff;

      if (sort === "title") {
        return String(a.movie?.title || "").localeCompare(String(b.movie?.title || ""));
      }

      if (sort === "latest") {
        const yearDiff = getYear(b.movie) - getYear(a.movie);
        if (yearDiff !== 0) return yearDiff;
      }

      if (sort === "rating") {
        const ratingDiff = getNumber(b.movie?.rating) - getNumber(a.movie?.rating);
        if (ratingDiff !== 0) return ratingDiff;
      }

      const scoreDiff =
        getPopularScore(b.movie, b.index, domain) - getPopularScore(a.movie, a.index, domain);
      if (scoreDiff !== 0) return scoreDiff;

      return a.index - b.index;
    })
    .map((item) => item.movie);
}

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

  const fetchMovies = async (searchText = query, selectedPage = 1, append = false) => {
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

      if (availability && availability !== "all") params.set("availability", availability);
      if (provider) params.set("provider", provider);

      const res = await fetch(`${API_BASE}${config.apiPath}?${params.toString()}`);

      if (!res.ok) throw new Error(`API failed: ${res.status}`);

      const data = await res.json();
      const rawItems = data.items || data.movies || data.results || [];
      setServerTotal(data.total || rawItems.length || 0);

      const prepared = prepareItems(rawItems, domain, sort, availability, provider);
      setMovies((prev) => (append ? [...prev, ...prepared] : prepared));
      setTotal(data.total || prepared.length || 0);
      setPage(selectedPage);
    } catch (err) {
      console.error(`${domain} API failed:`, err);
      if (!append) {
        setMovies([]);
        setTotal(0);
        setServerTotal(0);
        setPage(1);
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    setMovies([]);
    setPage(1);
    fetchMovies(query, 1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [domain, year, sort, language, availability, provider]);

  const handleSearch = async (value) => {
    const clean = value.trim();
    setQuery(clean);
    setMovies([]);
    setPage(1);
    await fetchMovies(clean, 1, false);
  };

  const handleLoadMore = async () => {
    if (loadingMore || !canLoadMore) return;

    await fetchMovies(query, page + 1, true);
  };

  const countLabel =
    total === serverTotal || !serverTotal
      ? total
      : `${movies.length} shown`;

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
        {domain === "historical" && (
          <div className="domain-link-row">
            <Link to="/historical/people">People</Link>
            <Link to="/historical/combinations">Combinations</Link>
          </div>
        )}

        <SearchBar
          onSearch={handleSearch}
          large
          suggestionType="movies"
          suggestionDomain={domain === "indian" ? "indian" : domain}
          language={domain === "historical" ? language : ""}
          placeholder={`Search ${config.title.toLowerCase()}...`}
        />

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
            {getYearsForDomain(domain).map((item) => (
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
            {getProvidersForDomain(domain).map((item) => (
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
            ? `Search Results for "${query}" (${countLabel})`
            : `${config.title} (${countLabel})`}
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
