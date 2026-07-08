// FLIXYFY_HOME_PROVIDER_FILTER_BRIDGE_V7
// Frontend-only bridge. No DB write. No DDL. v5 serving rule remains backend-side.

const PROVIDER_ALIAS_MAP = {
  "": "all",
  all: "all",
  "all providers": "all",
  provider: "all",
  youtube: "youtube",
  yt: "youtube",
  netflix: "netflix",
  prime: "prime_video",
  "prime video": "prime_video",
  primevideo: "prime_video",
  amazonprime: "prime_video",
  "amazon prime": "prime_video",
  "amazon prime video": "prime_video",
  amazon_prime_video: "prime_video",
  amazon_prime_video_with_ads: "prime_video",
  jiohotstar: "jiohotstar",
  hotstar: "jiohotstar",
  "jio hotstar": "jiohotstar",
  disney: "jiohotstar",
  "disney+": "jiohotstar",
  zee5: "zee5",
  sonyliv: "sonyliv",
  "sony liv": "sonyliv",
  aha: "aha",
  "sun nxt": "sun_nxt",
  sunnxt: "sun_nxt",
  sun_nxt: "sun_nxt",
  shemaroome: "shemaroome",
  "shemaroo me": "shemaroome",
  "mx player": "mx_player",
  mxplayer: "mx_player",
  mx_player: "mx_player",
  "eros now": "eros_now",
  eros_now: "eros_now",
  "apple tv": "apple_tv_store",
  appletv: "apple_tv_store",
  appletvstore: "apple_tv_store",
  apple_tv: "apple_tv_store",
  apple_tv_store: "apple_tv_store",
  "amazon video": "amazon_video",
  amazonvideo: "amazon_video",
  amazon_video: "amazon_video",
  "google tv": "google_tv",
  googletv: "google_tv",
  google_tv: "google_tv",
  "google play": "google_play_movies",
  googleplay: "google_play_movies",
  google_play: "google_play_movies",
  google_play_movies: "google_play_movies",
  hulu: "hulu",
  max: "max",
  tubi: "tubi_tv",
  "tubi tv": "tubi_tv",
  tubi_tv: "tubi_tv",
  plex: "plex",
  peacock: "peacock",
  "paramount+": "paramount_plus",
  paramount: "paramount_plus",
  paramount_plus: "paramount_plus"
};

const PROVIDER_DISPLAY = {
  youtube: "YouTube",
  netflix: "Netflix",
  prime_video: "Prime Video",
  jiohotstar: "JioHotstar",
  zee5: "ZEE5",
  sonyliv: "SonyLIV",
  aha: "Aha",
  sun_nxt: "Sun NXT",
  shemaroome: "ShemarooMe",
  mx_player: "MX Player",
  eros_now: "Eros Now",
  apple_tv_store: "Apple TV",
  amazon_video: "Amazon Video",
  google_tv: "Google TV",
  google_play_movies: "Google Play",
  hulu: "Hulu",
  max: "Max",
  tubi_tv: "Tubi",
  plex: "Plex",
  peacock: "Peacock",
  paramount_plus: "Paramount+"
};

export function normalizeProviderForApi(value) {
  const raw = String(value || "all")
    .trim()
    .toLowerCase()
    .replace(/%20/g, " ")
    .replace(/[+]+/g, " ")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ");

  if (Object.prototype.hasOwnProperty.call(PROVIDER_ALIAS_MAP, raw)) {
    return PROVIDER_ALIAS_MAP[raw];
  }

  const compact = raw.replace(/[\s\-]+/g, "_");
  if (Object.prototype.hasOwnProperty.call(PROVIDER_ALIAS_MAP, compact)) {
    return PROVIDER_ALIAS_MAP[compact];
  }

  return compact || "all";
}

function providerDisplayName(provider) {
  const key = normalizeProviderForApi(provider);
  return PROVIDER_DISPLAY[key] || String(provider || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function providerFromLocation() {
  if (typeof window === "undefined") return "all";
  try {
    const params = new URLSearchParams(window.location.search || "");
    return normalizeProviderForApi(params.get("provider") || params.get("provider_key") || "all");
  } catch (_err) {
    return "all";
  }
}

function urlFromFetchInput(input) {
  if (typeof window === "undefined") return null;
  try {
    if (typeof input === "string") return new URL(input, window.location.origin);
    if (input && typeof input.url === "string") return new URL(input.url, window.location.origin);
  } catch (_err) {
    return null;
  }
  return null;
}

function rebuildFetchInput(input, url) {
  if (typeof input === "string") return url.toString();
  if (input && typeof Request !== "undefined" && input instanceof Request) {
    return new Request(url.toString(), input);
  }
  return url.toString();
}

function isFlixyfyApiPath(url) {
  return /\/api\/v3\//.test(url.pathname || "");
}

function getRequestProvider(url) {
  const direct = normalizeProviderForApi(url.searchParams.get("provider") || url.searchParams.get("provider_key") || "all");
  if (direct && direct !== "all") return direct;
  const fromLocation = providerFromLocation();
  return fromLocation && fromLocation !== "all" ? fromLocation : "all";
}

function carryCommonParams(sourceUrl, targetUrl) {
  const keys = ["language", "language_slug", "year", "sort", "availability", "type", "page", "limit", "q"];
  for (const key of keys) {
    const value = sourceUrl.searchParams.get(key);
    if (value !== null && value !== "") targetUrl.searchParams.set(key, value);
  }
}

function buildMoviesProviderUrl(sourceUrl, provider) {
  const url = new URL(sourceUrl.toString());
  url.pathname = "/api/v3/movies";
  url.search = "";
  carryCommonParams(sourceUrl, url);
  url.searchParams.set("provider", provider);
  url.searchParams.set("provider_key", provider);
  if (!url.searchParams.get("limit")) url.searchParams.set("limit", "24");
  if (!url.searchParams.get("page")) url.searchParams.set("page", "1");
  return url;
}

function buildHomePayloadFromMovies(provider, moviesJson) {
  const items = Array.isArray(moviesJson?.items) ? moviesJson.items : [];
  const total = Number(moviesJson?.total || items.length || 0);
  const label = providerDisplayName(provider);

  const sectionObject = {
    popular: items,
    trending: items,
    latest: items,
    free: items,
    hindi: items,
    telugu: items,
    tamil: items,
    movies: items,
    provider: items
  };

  const sectionArray = [
    { key: "popular", slug: "popular", title: `${label} - Popular Movies`, items },
    { key: "provider", slug: "provider", title: `${label} Movies`, items },
    { key: "trending", slug: "trending", title: `${label} Trending`, items }
  ];

  return {
    provider_filtered: true,
    provider,
    provider_key: provider,
    provider_label: label,
    total,
    count: items.length,
    page: moviesJson?.page || 1,
    pages: moviesJson?.pages || 1,
    limit: moviesJson?.limit || items.length || 24,
    items,
    movies: items,
    results: items,
    popular: items,
    trending: items,
    latest: items,
    free: items,
    hindi: items,
    telugu: items,
    tamil: items,
    sections: sectionObject,
    section_list: sectionArray,
    rows: sectionArray,
    data: {
      items,
      movies: items,
      popular: items,
      trending: items,
      sections: sectionObject,
      total
    },
    source: "home_provider_bridge_v7_movies_endpoint"
  };
}

function jsonResponse(payload, baseResponse) {
  const headers = new Headers(baseResponse?.headers || {});
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("x-flixyfy-home-provider-bridge", "v7");
  return new Response(JSON.stringify(payload), {
    status: baseResponse?.status || 200,
    statusText: baseResponse?.statusText || "OK",
    headers
  });
}

async function fetchHomeProviderPayload(originalFetch, input, init, url, provider) {
  const moviesUrl = buildMoviesProviderUrl(url, provider);
  const response = await originalFetch(rebuildFetchInput(input, moviesUrl), init);
  const clone = response.clone();
  let payload;
  try {
    const moviesJson = await clone.json();
    payload = buildHomePayloadFromMovies(provider, moviesJson);
  } catch (_err) {
    return response;
  }
  return jsonResponse(payload, response);
}

function maybeInjectProviderIntoUrl(input, url) {
  const provider = getRequestProvider(url);
  if (!provider || provider === "all") return null;

  if (!isFlixyfyApiPath(url)) return null;
  const path = url.pathname || "";
  const eligible = path.endsWith("/api/v3/home") || path.endsWith("/api/v3/movies") || path.endsWith("/api/v3/search");
  if (!eligible) return null;

  if (url.searchParams.get("provider") || url.searchParams.get("provider_key")) return null;

  const next = new URL(url.toString());
  next.searchParams.set("provider", provider);
  next.searchParams.set("provider_key", provider);
  return rebuildFetchInput(input, next);
}

function optionProviderKey(option) {
  return normalizeProviderForApi(option?.value || option?.textContent || option?.label || "all");
}

function syncProviderSelectFromUrlOnce() {
  if (typeof window === "undefined" || typeof document === "undefined") return;
  const provider = providerFromLocation();
  if (!provider || provider === "all") return;

  const selects = Array.from(document.querySelectorAll("select"));
  for (const select of selects) {
    const options = Array.from(select.options || []);
    const hasProviderOptions = options.some((option) => optionProviderKey(option) === provider) &&
      options.some((option) => optionProviderKey(option) === "all");

    if (!hasProviderOptions) continue;

    const match = options.find((option) => optionProviderKey(option) === provider);
    if (!match) continue;

    if (select.value !== match.value) {
      select.value = match.value;
      select.dispatchEvent(new Event("input", { bubbles: true }));
      select.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
}

function scheduleProviderUrlSync() {
  if (typeof window === "undefined") return;
  const delays = [0, 100, 350, 900, 1800];
  for (const delay of delays) {
    window.setTimeout(syncProviderSelectFromUrlOnce, delay);
  }
}

export function installProviderFetchPatch() {
  if (typeof window === "undefined" || typeof window.fetch !== "function") return;
  if (window.__FLIXYFY_HOME_PROVIDER_FILTER_BRIDGE_V7_INSTALLED__) {
    scheduleProviderUrlSync();
    return;
  }

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function flixyfyProviderFetch(input, init) {
    const url = urlFromFetchInput(input);
    if (!url) return originalFetch(input, init);

    const path = url.pathname || "";
    const provider = getRequestProvider(url);

    if (path.endsWith("/api/v3/home") && provider && provider !== "all") {
      return fetchHomeProviderPayload(originalFetch, input, init, url, provider);
    }

    const injectedInput = maybeInjectProviderIntoUrl(input, url);
    if (injectedInput) return originalFetch(injectedInput, init);

    return originalFetch(input, init);
  };

  window.__FLIXYFY_HOME_PROVIDER_FILTER_BRIDGE_V7_INSTALLED__ = true;
  scheduleProviderUrlSync();
}

export default installProviderFetchPatch;
