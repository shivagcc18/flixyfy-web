import API_BASE_URL from "../config/api";
import { normalizeProviderForApi } from "../utils/providerFetchPatch";

const API_V3 = `${API_BASE_URL}/api/v3`;
const API_V4 = `${API_BASE_URL}/api/v4`;

const cache = new Map();
const pendingRequests = new Map();

const CACHE_TTL = 5 * 60 * 1000;

async function apiGet(path, apiBase = API_V3) {
  const now = Date.now();
  const cacheKey = `${apiBase}${path}`;
  const cached = cache.get(cacheKey);

  if (cached && now - cached.time < CACHE_TTL) {
    return cached.data;
  }

  if (pendingRequests.has(cacheKey)) {
    return pendingRequests.get(cacheKey);
  }

  const request = fetch(`${apiBase}${path}`)
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text();
        console.error("API FAILED:", res.status, path, text);
        throw new Error(`API error ${res.status}: ${path}`);
      }

      const data = await res.json();

      cache.set(cacheKey, {
        data,
        time: Date.now(),
      });

      return data;
    })
    .finally(() => {
      pendingRequests.delete(cacheKey);
    });

  pendingRequests.set(cacheKey, request);

  return request;
}

export function clearCache() {
  cache.clear();
  pendingRequests.clear();
}

export function getHome() {
  return apiGet("/home");
}

export function getMovies({
  page = 1,
  limit = 24,
  language = "",
  year = "",
  hasOtt = "",
  isFree = "",
  provider = "",
  availability = "",
  sort = "popular",
} = {}) {
  const params = new URLSearchParams();

  params.set("page", page);
  params.set("limit", limit);
  // FLIXYFY_PROVIDER_SORT_POPULAR_OMIT_V13
  // Backend default is already popular. Sending sort=popular with provider filters can return zero,
  // so only send explicit non-default sorts.
  const cleanSort = String(sort || "").trim();
  if (cleanSort && cleanSort !== "popular") params.set("sort", cleanSort);

  if (language) params.set("language", language);
  if (year) params.set("year", year);
  if (hasOtt !== "") params.set("has_ott", hasOtt);
  if (isFree !== "") params.set("is_free", isFree);
  if (provider) {
    const providerForApi = normalizeProviderForApi(provider);
    if (providerForApi && providerForApi !== "all") params.set("provider", providerForApi);
  }
  if (availability) params.set("availability", availability);

  return apiGet(`/movies?${params.toString()}`);
}

export function getMovie(slug) {
  return apiGet(`/movie/${slug}`, API_V4);
}

export function searchMovies(params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v !== "" && v !== undefined && v !== null) {
      query.set(k, v);
    }
  });

  return apiGet(`/search?${query.toString()}`);
}

export function getLanguages() {
  return apiGet("/languages");
}

export function getLanguageMovies(language, params = {}) {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([k, v]) => {
    if (v !== "" && v !== undefined && v !== null) {
      query.set(k, v);
    }
  });

  return apiGet(`/language/${language}?${query.toString()}`);
}

export function getOttProviders() {
  return apiGet("/ott-providers");
}

export function getStats() {
  return apiGet("/stats");
}

