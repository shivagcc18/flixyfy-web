const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://flixyfy-api-production.up.railway.app";

const API_V3 = `${API_BASE_URL}/api/v3`;

async function apiGet(path) {
  const res = await fetch(`${API_V3}${path}`);

  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${path}`);
  }

  return res.json();
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
  sort = "popular",
} = {}) {
  const params = new URLSearchParams();

  params.set("page", page);
  params.set("limit", limit);
  params.set("sort", sort);

  if (language) params.set("language", language);
  if (year) params.set("year", year);
  if (hasOtt !== "") params.set("has_ott", hasOtt);
  if (isFree !== "") params.set("is_free", isFree);
  if (provider) params.set("provider", provider);

  return apiGet(`/movies?${params.toString()}`);
}

export function getMovie(slug) {
  return apiGet(`/movie/${slug}`);
}

export function searchMovies({
  q = "",
  page = 1,
  limit = 24,
  language = "",
  year = "",
  hasOtt = "",
} = {}) {
  const params = new URLSearchParams();

  params.set("q", q || "");
  params.set("page", page);
  params.set("limit", limit);

  if (language) params.set("language", language);
  if (year) params.set("year", year);
  if (hasOtt !== "") params.set("has_ott", hasOtt);

  return apiGet(`/search?${params.toString()}`);
}

export function getLanguages() {
  return apiGet("/languages");
}

export function getLanguageMovies({
  language,
  page = 1,
  limit = 24,
  sort = "popular",
  year = "",
  hasOtt = "",
}) {
  const params = new URLSearchParams();

  params.set("page", page);
  params.set("limit", limit);
  params.set("sort", sort);

  if (year) params.set("year", year);
  if (hasOtt !== "") params.set("has_ott", hasOtt);

  return apiGet(`/language/${language}?${params.toString()}`);
}

export function getOttProviders() {
  return apiGet("/ott-providers");
}

export function getStats() {
  return apiGet("/stats");
}