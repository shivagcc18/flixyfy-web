import { useEffect, useState } from "react";
import SkeletonRow from "../components/SkeletonRow";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Row from "../components/Row";
import SearchBar from "../components/SearchBar";
import MovieGrid from "../components/MovieGrid";
import API_BASE from "../config/api";

import { getHome } from "../api/flixyfyApi";
import { setPageSeo, setJsonLd } from "../utils/seo";
import { trackFilter, trackLanguageOpen, trackLoadMore } from "../utils/analytics";
import { fetchFlixyfyJson, normalizeProviderForApi, providerDisplayLabel, providerFromCurrentUrl, providerValueForState } from "../utils/providerFetchPatch";
import "./Home.css";

// FLIXYFY_HOME_DIRECT_PROVIDER_RESULTS_V14
// Home provider filters now fetch /api/v4/movies directly from Home.jsx.

// FLIXYFY_HOME_PROVIDER_FETCH_HARDEN_V15
// Home provider filters must always hit exactly /api/v4/movies.

// FLIXYFY_HOME_LATENCY_PROVIDER_SCOPE_FIX_V5
// - Fixes Indian Webseries language/provider count consistency.
// - Soft language fallback: incomplete language metadata must not show empty pages.
// - Uses one cached Indian webseries index for all providers.
// - Uses provider-specific cached Indian webseries indexes when provider is selected.
// - Uses soft language fallback so incomplete language metadata does not show empty pages.
// - Uses longer GET cache and background page batching to reduce repeated latency.

function normalizeApiRoot(value) {
  return String(value || "")
    .trim()
    .replace(/\/+$/, "")
    .replace(/\/api\/v3$/i, "")
    .replace(/\/api\/v4$/i, "")
    .replace(/\/api$/i, "");
}

const API_ROOT_CANDIDATES = Array.from(
  new Set([
    normalizeApiRoot(API_BASE),
    "https://flixyfy-api-fresh-production.up.railway.app",
  ].filter(Boolean))
);

const PAGE_SIZE = 25;
const FILTER_CACHE_TTL = 5 * 60 * 1000;
const INDEX_CACHE_TTL = 15 * 60 * 1000;
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
for (let year = 2026; year >= 2000; year--) YEARS.push(String(year));

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

const INDIAN_LANGUAGE_TOKEN_ALIASES = {
  hindi: ["hindi", "hi", "bollywood"],
  telugu: ["telugu", "te", "tollywood"],
  tamil: ["tamil", "ta", "kollywood"],
  malayalam: ["malayalam", "ml", "mollywood"],
  kannada: ["kannada", "kn", "sandalwood"],
  bengali: ["bengali", "bn"],
  marathi: ["marathi", "mr"],
  punjabi: ["punjabi", "pa"],
  gujarati: ["gujarati", "gu"],
  odia: ["odia", "oriya", "or"],
  assamese: ["assamese", "as"],
};

const INDIAN_LANGUAGE_TOKEN_SET = new Set(
  Object.values(INDIAN_LANGUAGE_TOKEN_ALIASES).flat()
);

const GLOBAL_LANGUAGE_TOKEN_SET = new Set([
  "en", "english", "ko", "korean", "ja", "japanese", "zh", "chinese",
  "es", "spanish", "fr", "french", "de", "german", "th", "thai", "tr", "turkish",
]);

const INDIAN_PROVIDER_HINTS = new Set([
  "jiohotstar", "hotstar", "disney hotstar", "zee5", "zee 5", "sonyliv", "sony liv",
  "aha", "sun nxt", "sunnxt", "etv win", "mx player", "mxplayer", "hoichoi",
  "manorama max", "shemaroo", "shemaroome",
]);

const PROVIDER_ALIASES = {
  netflix: ["netflix"],
  prime_video: ["prime video", "prime_video", "amazon prime", "amazon prime video", "amazonvideo"],
  jiohotstar: ["jiohotstar", "jio hotstar", "hotstar", "disney hotstar", "disney+ hotstar"],
  zee5: ["zee5", "zee 5"],
  sonyliv: ["sonyliv", "sony liv"],
  aha: ["aha"],
  sun_nxt: ["sun nxt", "sunnxt", "sun_nxt"],
  sunnxt: ["sun nxt", "sunnxt", "sun_nxt"],
  etv_win: ["etv win", "etv_win"],
  mx_player: ["mx player", "mxplayer", "mx_player"],
  youtube: ["youtube", "you tube", "youtu be", "youtube com"],
  apple_tv_store: ["apple tv", "apple tv store", "itunes", "apple"],
  disney_plus: ["disney plus", "disney+"],
  hulu: ["hulu"],
  max: ["max", "hbo max"],
  viki: ["viki", "rakuten viki"],
  kocowa: ["kocowa"],
  tving: ["tving"],
  wavve: ["wavve"],
  watcha: ["watcha"],
  coupang_play: ["coupang play", "coupang_play"],
};

const indianWebseriesIndexCacheByKey = new Map();

function indianWebseriesCacheKey(providerFilter = "") {
  const providerKey = normalizeProviderForApi(providerFilter || "");
  return providerKey && providerKey !== "all" ? providerKey : "all";
}

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

function normalizeScopeToken(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/[^\p{L}\p{N}\s]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function collectScopeTokens(value, out = [], depth = 0) {
  if (depth > 4 || value == null) return out;

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    const text = normalizeScopeToken(value);
    if (text) out.push(text);
    return out;
  }

  if (Array.isArray(value)) {
    value.slice(0, 80).forEach((item) => collectScopeTokens(item, out, depth + 1));
    return out;
  }

  if (typeof value === "object") {
    Object.entries(value).forEach(([key, item]) => {
      collectScopeTokens(key, out, depth + 1);
      collectScopeTokens(item, out, depth + 1);
    });
  }

  return out;
}

function getWebseriesTokens(item) {
  const fields = [
    item?.domain,
    item?.source_domain,
    item?.content_type,
    item?.country,
    item?.country_code,
    item?.origin_country,
    item?.origin_country_code,
    item?.production_country,
    item?.production_countries,
    item?.primary_language,
    item?.primary_language_slug,
    item?.language,
    item?.language_name,
    item?.language_slug,
    item?.original_language,
    item?.spoken_languages,
    item?.genres,
    item?.provider,
    item?.provider_key,
    item?.provider_name,
    item?.provider_names,
    item?.provider_keys,
    item?.ott_primary,
    item?.ott_primary_key,
    item?.ott_all,
    item?.availability,
    item?.providers,
    item?.watch_providers,
    item?.title,
    item?.original_title,
    item?.name,
    item?.original_name,
    item?.provenance_json,
  ];

  const tokens = [];
  fields.forEach((value) => collectScopeTokens(value, tokens));
  return tokens;
}

function hasIndianSignal(item) {
  const tokens = getWebseriesTokens(item);
  const joined = ` ${tokens.join(" ")} `;

  if (
    joined.includes(" india ") ||
    joined.includes(" in ") ||
    joined.includes(" indian ") ||
    joined.includes(" bollywood ") ||
    joined.includes(" tollywood ") ||
    joined.includes(" kollywood ") ||
    joined.includes(" mollywood ") ||
    joined.includes(" sandalwood ")
  ) {
    return true;
  }

  for (const token of tokens) {
    if (INDIAN_LANGUAGE_TOKEN_SET.has(token)) return true;
    if (INDIAN_PROVIDER_HINTS.has(token)) return true;
  }

  return false;
}

function hasGlobalOnlySignal(item) {
  const tokens = getWebseriesTokens(item);
  const joined = ` ${tokens.join(" ")} `;

  if (
    joined.includes(" korea ") ||
    joined.includes(" korean ") ||
    joined.includes(" japan ") ||
    joined.includes(" japanese ") ||
    joined.includes(" united states ") ||
    joined.includes(" usa ") ||
    joined.includes(" hollywood ")
  ) {
    return true;
  }

  return tokens.some((token) => GLOBAL_LANGUAGE_TOKEN_SET.has(token));
}

function filterIndianWebseriesItems(items) {
  if (!Array.isArray(items)) return [];

  return items.filter((item) => {
    if (hasIndianSignal(item)) return true;
    if (hasGlobalOnlySignal(item)) return false;
    return false;
  });
}

function matchesProvider(item, selectedProvider) {
  const clean = normalizeProviderForApi(selectedProvider || "");
  if (!clean || clean === "all") return true;

  const text = getWebseriesTokens(item).join(" ");
  const aliases = PROVIDER_ALIASES[clean] || [clean, selectedProvider].map(normalizeScopeToken);

  return aliases.some((alias) => {
    const token = normalizeScopeToken(alias);
    return token && text.includes(token);
  });
}

function matchesLanguageStrict(item, selectedLanguage) {
  const clean = normalizeScopeToken(selectedLanguage || "");
  if (!clean) return true;

  const aliases = INDIAN_LANGUAGE_TOKEN_ALIASES[clean] || [clean];
  const tokens = getWebseriesTokens(item);

  return aliases.some((alias) => {
    const token = normalizeScopeToken(alias);
    return token && (tokens.includes(token) || tokens.some((x) => x === token || x.includes(token)));
  });
}

function applySoftLanguageFilter(items, selectedLanguage) {
  const clean = normalizeScopeToken(selectedLanguage || "");
  if (!clean) return items;

  const strictMatches = items.filter((item) => matchesLanguageStrict(item, clean));

  // FLIXYFY_INDIAN_WEBSERIES_SOFT_LANGUAGE_FILTER_V4:
  // Webseries language metadata is incomplete. Do not show Hindi/Telugu/etc as 0
  // when the base Indian webseries set exists but language signal is missing.
  return strictMatches.length > 0 ? strictMatches : items;
}

function matchesYear(item, selectedYear) {
  const clean = String(selectedYear || "").trim();
  if (!clean) return true;

  const year = String(item?.release_year || item?.year || item?.first_air_year || item?.start_year || "");
  return year === clean;
}

function matchesQuery(item, query) {
  const clean = normalizeScopeToken(query || "");
  if (!clean) return true;

  const haystack = normalizeScopeToken(
    [
      item?.title,
      item?.name,
      item?.original_title,
      item?.original_name,
      item?.overview,
      item?.slug,
    ].filter(Boolean).join(" ")
  );

  return haystack.includes(clean);
}

function safeNumber(value) {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortWebseriesItems(items, selectedSort) {
  const cleanSort = String(selectedSort || "popular").trim().toLowerCase();

  return [...items].sort((a, b) => {
    if (cleanSort === "latest") {
      const yearDiff =
        safeNumber(b?.release_year || b?.year || b?.first_air_year) -
        safeNumber(a?.release_year || a?.year || a?.first_air_year);
      if (yearDiff !== 0) return yearDiff;
    }

    if (cleanSort === "rating") {
      const ratingDiff =
        safeNumber(b?.rating || b?.vote_average || b?.imdb_rating) -
        safeNumber(a?.rating || a?.vote_average || a?.imdb_rating);
      if (ratingDiff !== 0) return ratingDiff;
    }

    const popularityDiff = safeNumber(b?.popularity) - safeNumber(a?.popularity);
    if (popularityDiff !== 0) return popularityDiff;

    return String(a?.title || a?.name || "").localeCompare(String(b?.title || b?.name || ""));
  });
}

function indianWebseriesSessionCacheName(cacheKey) {
  return `FLIXYFY_INDIAN_WEBSERIES_INDEX_V5_${cacheKey || "all"}`;
}

function readCachedIndianWebseriesIndex(cacheKey = "all") {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(indianWebseriesSessionCacheName(cacheKey));
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!parsed?.createdAt || !Array.isArray(parsed?.items)) return null;
    if (Date.now() - parsed.createdAt > INDEX_CACHE_TTL) return null;

    return parsed;
  } catch (_) {
    return null;
  }
}

function writeCachedIndianWebseriesIndex(cacheKey, payload) {
  if (typeof window === "undefined") return;

  try {
    window.sessionStorage.setItem(indianWebseriesSessionCacheName(cacheKey), JSON.stringify(payload));
  } catch (_) {
    // Session cache is optional.
  }
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
          version: "FLIXYFY_HOME_LATENCY_PROVIDER_SCOPE_FIX_V5",
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

async function buildIndianWebseriesIndex(force = false, providerFilter = "") {
  const cacheKey = indianWebseriesCacheKey(providerFilter);
  const providerKey = cacheKey === "all" ? "" : cacheKey;
  const memoryCached = indianWebseriesIndexCacheByKey.get(cacheKey);
  const sessionCached = readCachedIndianWebseriesIndex(cacheKey);

  if (
    !force &&
    memoryCached?.items?.length > 0 &&
    Date.now() - memoryCached.createdAt < INDEX_CACHE_TTL
  ) {
    return memoryCached;
  }

  if (!force && sessionCached) {
    const payload = {
      createdAt: sessionCached.createdAt,
      items: sessionCached.items,
      sourceTotal: sessionCached.sourceTotal || sessionCached.items.length,
      promise: null,
    };
    indianWebseriesIndexCacheByKey.set(cacheKey, payload);
    return payload;
  }

  if (!force && memoryCached?.promise) {
    return memoryCached.promise;
  }

  const buildPromise = (async () => {
    const pageSize = 100;
    const firstParams = new URLSearchParams();
    firstParams.set("page", "1");
    firstParams.set("limit", String(pageSize));
    firstParams.set("region", "global");
    firstParams.set("scope", "global");

    // FLIXYFY_HOME_LATENCY_PROVIDER_SCOPE_FIX_V5:
    // When provider is selected, fetch provider-specific webseries pages from API first.
    // Do not rely only on card metadata provider fields, because many webseries rows
    // do not expose provider_keys/provider_names consistently yet.
    if (providerKey) firstParams.set("provider", providerKey);

    const firstData = await fetchApi(`/webseries?${firstParams.toString()}`);
    const firstItems = getItems(firstData);
    const sourceTotal = Math.max(Number(firstData?.total || 0), firstItems.length);
    const pageCount = Math.max(1, Math.ceil(sourceTotal / pageSize));
    const maxPages = Math.min(pageCount, 120);

    const all = [];
    const seen = new Set();

    function addRows(rows) {
      rows.forEach((item) => {
        const key = String(item?.slug || item?.id || item?.title || JSON.stringify(item)).trim();
        if (!key || seen.has(key)) return;
        seen.add(key);
        all.push(item);
      });
    }

    addRows(firstItems);

    const pages = [];
    for (let pageNo = 2; pageNo <= maxPages; pageNo += 1) pages.push(pageNo);

    const batchSize = 6;
    for (let i = 0; i < pages.length; i += batchSize) {
      const batch = pages.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map((pageNo) => {
          const params = new URLSearchParams();
          params.set("page", String(pageNo));
          params.set("limit", String(pageSize));
          params.set("region", "global");
          params.set("scope", "global");
          if (providerKey) params.set("provider", providerKey);
          return fetchApi(`/webseries?${params.toString()}`);
        })
      );

      results.forEach((result) => {
        if (result.status === "fulfilled") addRows(getItems(result.value));
      });
    }

    const indianItems = filterIndianWebseriesItems(all);
    const payload = {
      createdAt: Date.now(),
      items: indianItems,
      sourceTotal: sourceTotal || all.length,
      promise: null,
      providerKey: providerKey || "all",
    };

    indianWebseriesIndexCacheByKey.set(cacheKey, payload);
    writeCachedIndianWebseriesIndex(cacheKey, {
      createdAt: payload.createdAt,
      items: payload.items,
      sourceTotal: payload.sourceTotal,
      providerKey: payload.providerKey,
    });

    if (typeof window !== "undefined") {
      window.__FLIXYFY_INDIAN_WEBSERIES_SCOPE_DEBUG__ = {
        version: "FLIXYFY_HOME_LATENCY_PROVIDER_SCOPE_FIX_V5",
        providerKey: payload.providerKey,
        sourceTotal: payload.sourceTotal,
        indianTotal: payload.items.length,
        ts: new Date().toISOString(),
      };
    }

    return payload;
  })();

  indianWebseriesIndexCacheByKey.set(cacheKey, {
    createdAt: Date.now(),
    items: [],
    sourceTotal: 0,
    promise: buildPromise,
    providerKey: providerKey || "all",
  });

  try {
    return await buildPromise;
  } finally {
    const finalPayload = indianWebseriesIndexCacheByKey.get(cacheKey);
    if (finalPayload?.promise) {
      indianWebseriesIndexCacheByKey.set(cacheKey, { ...finalPayload, promise: null });
    }
  }
}
async function fetchIndianWebseriesScopedData(baseParams, selectedPage, pageSize, options = {}) {
  const selectedLanguage = options.language ?? baseParams.get("language") ?? "";
  const selectedProvider = options.provider ?? baseParams.get("provider") ?? "";
  const selectedYear = options.year ?? baseParams.get("year") ?? "";
  const selectedQuery = options.query ?? baseParams.get("q") ?? "";
  const selectedSort = options.sort ?? baseParams.get("sort") ?? "popular";
  const providerKey = normalizeProviderForApi(selectedProvider || "");

  const index = await buildIndianWebseriesIndex(false, providerKey);

  let filtered = index.items
    .filter((item) => (providerKey ? true : matchesProvider(item, selectedProvider)))
    .filter((item) => matchesYear(item, selectedYear))
    .filter((item) => matchesQuery(item, selectedQuery));

  filtered = applySoftLanguageFilter(filtered, selectedLanguage);
  filtered = sortWebseriesItems(filtered, selectedSort);

  const currentPage = Math.max(1, Number(selectedPage || 1));
  const limit = Math.max(1, Number(pageSize || PAGE_SIZE));
  const start = (currentPage - 1) * limit;
  const pageItems = filtered.slice(start, start + limit);

  return {
    items: pageItems,
    results: pageItems,
    movies: pageItems,
    total: filtered.length,
    count: filtered.length,
    filtered_total: filtered.length,
    source_total: index.sourceTotal,
    indian_index_total: index.items.length,
    scope_filter_version: "FLIXYFY_HOME_LATENCY_PROVIDER_SCOPE_FIX_V5",
  };
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
        "Search Indian movies, historical movies, and active webseries across OTT platforms and free YouTube full-movie links.",
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const showingFiltered = true;
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
      const webseriesScope = cleanScope === "global" ? "global" : "indian";
      params.set("region", webseriesScope);
      params.set("scope", webseriesScope);
      if (webseriesScope === "indian") params.set("country", "IN");
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

    const requestPath =
      cleanType === "webseries"
        ? `/webseries?${params.toString()}`
        : `/search?${params.toString()}`;

    const data =
      cleanType === "webseries" && cleanScope !== "global"
        ? await fetchIndianWebseriesScopedData(params, selectedPage, PAGE_SIZE, {
            language: requestLanguage,
            provider: requestProvider,
            year: requestYear,
            query: searchText,
            sort: selectedSort,
          })
        : await fetchApi(requestPath);

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

      if (append) setLoadingMore(true);
      else setLoading(true);

      if (selectedType === "people") {
        const params = new URLSearchParams();
        params.set("page", String(selectedPage));
        params.set("limit", String(PAGE_SIZE));
        if (searchText) params.set("q", searchText);
        if (selectedLanguage) params.set("language", selectedLanguage);
        const data = await fetchApi(`/people?${params.toString()}`);
        const rawItems = getItems(data).filter((item) => {
          const name = item.person_name || item.display_name || item.title || "";
          return name && !/^n\/?a\s+n\/?a$/i.test(String(name).trim());
        });
        applyData({ ...data, items: rawItems }, selectedPage, append);
      } else if (searchText || selectedType !== "movies") {
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
    }, searchType === "webseries" ? 80 : 120);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  useEffect(() => {
    if (searchType === "webseries" && searchScope === "indian") {
      buildIndianWebseriesIndex(false, provider).catch(() => {});
    }
  }, [searchType, searchScope, provider]);

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
    setAvailability(value);
    trackFilter("availability", value || "all");
  };

  const handleProviderChange = (value) => {
    const normalizedProvider = providerValueForState(value);
    setProvider(normalizedProvider);
    trackFilter("provider", normalizedProvider || "all");

    try {
      const url = new URL(window.location.href);
      if (normalizedProvider) url.searchParams.set("provider", normalizedProvider);
      else url.searchParams.delete("provider");
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
    : `${titleParts.join(" - ")} ${contentLabel} (${filterTotal})`;

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
          {showingResultText && <p className="home-result-count-note">{showingResultText}</p>}

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
