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

const HISTORICAL_CLASSIC_TITLE_BOOSTS = new Map([
  ["sholay", 10000],
  ["mughal-e-azam", 9800],
  ["mughal e azam", 9800],
  ["mother india", 9700],
  ["guide", 9600],
  ["pyaasa", 9550],
  ["kaagaz ke phool", 9500],
  ["sahib bibi aur ghulam", 9450],
  ["anand", 9400],
  ["deewaar", 9350],
  ["deewar", 9350],
  ["zanjeer", 9300],
  ["amar akbar anthony", 9250],
  ["don", 9200],
  ["trishul", 9150],
  ["kaala patthar", 9100],
  ["shakti", 9050],
  ["agneepath", 9000],
  ["silsila", 8950],
  ["kabhi kabhie", 8900],
  ["muqaddar ka sikandar", 8850],
  ["abhimaan", 8800],
  ["chupke chupke", 8750],
  ["gol maal", 8700],
  ["jaane bhi do yaaro", 8650],
  ["masoom", 8600],
  ["ardh satya", 8550],
  ["parinda", 8500],
  ["satya", 8450],
  ["nayakan", 8400],
  ["thevar magan", 8350],
  ["thalapathi", 8300],
  ["baasha", 8250],
  ["indian", 8200],
  ["bombay", 8150],
  ["roja", 8100],
  ["anjali", 8050],
  ["moondram pirai", 8000],
  ["naduvula konjam pakkatha kaanom", 0],
  ["manichitrathazhu", 7950],
  ["kireedam", 7900],
  ["bharatham", 7850],
  ["oru vadakkan veeragatha", 7800],
  ["mathilukal", 7750],
  ["sandhesam", 7700],
  ["drishyam", 0],
  ["mayabazar", 7650],
  ["daana veera soora karna", 7600],
  ["sankarabharanam", 7550],
  ["sagara sangamam", 7500],
  ["rudraveena", 7450],
  ["swathi muthyam", 7400],
  ["geethanjali", 7350],
  ["jagadeka veerudu athiloka sundari", 7300],
  ["gang leader", 7250],
  ["pathala bhairavi", 7200],
  ["bangarada manushya", 7150],
  ["kaviratna kalidasa", 7100],
  ["nagarahavu", 7050],
  ["om", 7000],
  ["aakasmika", 6950],
  ["upendra", 6900],
  ["a", 0],
  ["dilwale dulhania le jayenge", 9900],
  ["hum aapke hain koun", 9850],
  ["hum aapke hain kaun", 9850],
  ["kuch kuch hota hai", 9825],
  ["baazigar", 9725],
  ["darr", 9675],
  ["dil to pagal hai", 9625],
  ["karan arjun", 9575],
  ["sarfarosh", 9525],
  ["rangeela", 9475],
  ["andaz apna apna", 9425],
  ["lagaan", 0],
]);

function normalizeTitle(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[._:;'"!?()[\]{}]/g, " ")
    .replace(/\s+/g, " ");
}

function normalizeSlug(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

function isHistoricalNonMovieRow(movie) {
  const title = normalizeTitle(movie?.title || movie?.name || movie?.original_title);
  if (!title) return false;

  if (HISTORICAL_NON_MOVIE_TITLES.has(title)) return true;

  const slug = normalizeSlug(movie?.slug || "");
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

function getNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getClassicTitleBoost(movie) {
  const title = normalizeTitle(movie?.title || movie?.name || movie?.original_title);
  const slug = normalizeSlug(movie?.slug || "").replace(/-\d{4}.*/, "").replace(/-/g, " ");

  if (HISTORICAL_CLASSIC_TITLE_BOOSTS.has(title)) {
    return HISTORICAL_CLASSIC_TITLE_BOOSTS.get(title);
  }

  if (HISTORICAL_CLASSIC_TITLE_BOOSTS.has(slug)) {
    return HISTORICAL_CLASSIC_TITLE_BOOSTS.get(slug);
  }

  return 0;
}

function getPopularScore(movie, originalIndex = 0) {
  const classicBoost = getClassicTitleBoost(movie);
  const quality = getNumber(movie?.quality_score);
  const popularity = getNumber(movie?.popularity);
  const rating = getNumber(movie?.rating);
  const voteCount = getNumber(movie?.vote_count);
  const year = getYear(movie);

  const qualityScore = quality * 20;
  const popularityScore = popularity * 10;
  const ratingScore = rating * 100;
  const voteScore = Math.min(voteCount, 5000) / 5;

  const yearPenalty = year >= 1995 ? 0 : year >= 1980 ? 20 : year >= 1970 ? 40 : 60;

  const apiOrderScore = Math.max(0, 1000 - originalIndex);

  return (
    classicBoost +
    qualityScore +
    popularityScore +
    ratingScore +
    voteScore +
    apiOrderScore -
    yearPenalty
  );
}

function cleanDomainItems(items, domain) {
  if (!Array.isArray(items)) return [];

  if (domain !== "historical") {
    return items;
  }

  return items.filter((movie) => !isHistoricalNonMovieRow(movie));
}

function sortHistoricalItems(items, selectedSort) {
  if (!Array.isArray(items)) return [];

  return [...items]
    .map((movie, index) => ({ movie, index }))
    .sort((a, b) => {
      const aHasPoster = hasRealPoster(a.movie) ? 0 : 1;
      const bHasPoster = hasRealPoster(b.movie) ? 0 : 1;

      if (aHasPoster !== bHasPoster) {
        return aHasPoster - bHasPoster;
      }

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

function prepareDomainItems(items, domain, selectedSort) {
  const cleaned = cleanDomainItems(items, domain);

  if (domain === "historical") {
    return sortHistoricalItems(cleaned, selectedSort);
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
      const preparedItems = prepareDomainItems(rawItems, domain, sort);

      setMovies((prev) => {
        if (!append) {
          return preparedItems;
        }

        const combined = [...prev, ...preparedItems];
        return prepareDomainItems(combined, domain, sort);
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