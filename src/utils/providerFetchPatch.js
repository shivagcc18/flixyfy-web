// FLIXYFY_FRONTEND_HOME_PROVIDER_FILTER_V6
// Frontend-only provider filter repair.
// Production serving remains v5. This file does not reference or create serving tables.

const PROVIDER_ALIAS = {
  "": "all",
  all: "all",
  "all providers": "all",
  "all_provider": "all",
  "all_providers": "all",

  youtube: "youtube",
  yt: "youtube",

  netflix: "netflix",

  prime: "prime_video",
  primevideo: "prime_video",
  "prime video": "prime_video",
  prime_video: "prime_video",
  amazonprime: "prime_video",
  "amazon prime": "prime_video",
  amazon_prime: "prime_video",
  amazon_prime_video: "prime_video",
  amazon_prime_video_with_ads: "prime_video",

  hotstar: "jiohotstar",
  jiohotstar: "jiohotstar",
  "jio hotstar": "jiohotstar",
  disneyhotstar: "jiohotstar",
  disney_hotstar: "jiohotstar",

  zee5: "zee5",
  sonyliv: "sonyliv",
  "sony liv": "sonyliv",
  aha: "aha",

  sunnxt: "sun_nxt",
  "sun nxt": "sun_nxt",
  sun_nxt: "sun_nxt",

  mxplayer: "mx_player",
  "mx player": "mx_player",
  mx_player: "mx_player",
  amazon_mx_player: "mx_player",

  shemaroome: "shemaroome",
  "shemaroo me": "shemaroome",

  appletv: "apple_tv_store",
  "apple tv": "apple_tv_store",
  apple_tv: "apple_tv_store",
  appletvstore: "apple_tv_store",
  apple_tv_store: "apple_tv_store",

  amazonvideo: "amazon_video",
  "amazon video": "amazon_video",
  amazon_video: "amazon_video",

  disneyplus: "disney_plus",
  "disney+": "disney_plus",
  "disney plus": "disney_plus",
  disney_plus: "disney_plus",

  hulu: "hulu",
  max: "max",
  tubi: "tubi_tv",
  tubi_tv: "tubi_tv",
  plex: "plex",
  peacock: "peacock",
  paramount: "paramount_plus",
  "paramount+": "paramount_plus",
  paramount_plus: "paramount_plus",
  rakutenviki: "rakuten_viki",
  "rakuten viki": "rakuten_viki",
  rakuten_viki: "rakuten_viki",
  kocowa: "kocowa",
  tving: "tving",
  wavve: "wavve",
  watcha: "watcha",
  "google play": "google_tv",
  googleplay: "google_tv",
  google_tv: "google_tv",
  fandango: "fandango_at_home",
  fandango_at_home: "fandango_at_home"
};

const PROVIDER_LABEL = {
  youtube: "YouTube",
  netflix: "Netflix",
  prime_video: "Prime Video",
  jiohotstar: "JioHotstar",
  zee5: "ZEE5",
  sonyliv: "SonyLIV",
  aha: "Aha",
  sun_nxt: "Sun NXT",
  mx_player: "MX Player",
  shemaroome: "ShemarooMe",
  apple_tv_store: "Apple TV",
  amazon_video: "Amazon Video",
  disney_plus: "Disney+",
  hulu: "Hulu",
  max: "Max",
  tubi_tv: "Tubi",
  plex: "Plex",
  peacock: "Peacock",
  paramount_plus: "Paramount+",
  rakuten_viki: "Rakuten Viki",
  kocowa: "Kocowa",
  tving: "TVING",
  wavve: "Wavve",
  watcha: "Watcha",
  google_tv: "Google TV",
  fandango_at_home: "Fandango"
};

export function normalizeProviderForApi(value) {
  const raw = String(value ?? "all").trim();
  const key = raw.toLowerCase().replace(/&/g, "and").replace(/[.]/g, "").replace(/\s+/g, "_");
  const spaced = raw.toLowerCase().trim().replace(/\s+/g, " ");
  return PROVIDER_ALIAS[raw] || PROVIDER_ALIAS[spaced] || PROVIDER_ALIAS[key] || key.replace(/[^a-z0-9_+]/g, "_");
}

function providerLabel(provider) {
  return PROVIDER_LABEL[provider] || String(provider || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function isProviderAll(provider) {
  const key = normalizeProviderForApi(provider);
  return !key || key === "all" || key === "all_providers";
}

function cloneHeaders(headers) {
  const out = new Headers(headers || {});
  out.set("content-type", "application/json; charset=utf-8");
  out.set("x-flixyfy-provider-home-patch", VERSION);
  return out;
}

function normalizeUrlProviderParams(url) {
  const rawProvider = url.searchParams.get("provider") || url.searchParams.get("provider_key");
  if (!rawProvider) return null;

  const provider = normalizeProviderForApi(rawProvider);
  url.searchParams.delete("provider_key");

  if (isProviderAll(provider)) {
    url.searchParams.delete("provider");
    return "all";
  }

  url.searchParams.set("provider", provider);
  return provider;
}

function providerHomePayload(provider, moviesPayload) {
  const items = Array.isArray(moviesPayload?.items) ? moviesPayload.items : [];
  const total = Number(moviesPayload?.total || items.length || 0);
  const page = Number(moviesPayload?.page || 1);
  const limit = Number(moviesPayload?.limit || items.length || 24) || 24;
  const label = providerLabel(provider);

  const section = {
    key: "provider_popular",
    slug: "provider_popular",
    title: `${label} - Popular Movies`,
    label: `${label} - Popular Movies`,
    items,
    movies: items,
    data: items,
    total
  };

  return {
    provider,
    provider_label: label,
    provider_filtered: true,
    source: moviesPayload?.source || "frontend_provider_home_bridge_v5",
    source_domain: moviesPayload?.source_domain || moviesPayload?.domain || "current",
    domain: moviesPayload?.domain || "current",
    total,
    count: total,
    page,
    limit,
    pages: Number(moviesPayload?.pages || Math.max(1, Math.ceil(total / Math.max(1, limit)))),
    items,
    movies: items,
    results: items,
    trending: items,
    popular: items,
    latest: items,
    free: items,
    hindi: items,
    telugu: items,
    tamil: items,
    sections: [section],
    provider_section: section
  };
}

function shouldBridgeHome(url, provider) {
  if (!provider || isProviderAll(provider)) return false;
  return url.pathname === "/api/v3/home" || url.pathname.endsWith("/api/v3/home");
}

function buildMoviesUrlFromHome(url, provider) {
  const next = new URL(url.href);
  next.pathname = next.pathname.replace(/\/api\/v3\/home$/, "/api/v3/movies");
  next.searchParams.set("provider", provider);
  next.searchParams.delete("provider_key");
  if (!next.searchParams.get("limit")) next.searchParams.set("limit", "24");
  if (!next.searchParams.get("page")) next.searchParams.set("page", "1");
  return next;
}

async function fetchProviderHome(originalFetch, url, init, provider) {
  const moviesUrl = buildMoviesUrlFromHome(url, provider);
  const response = await originalFetch(moviesUrl.toString(), init);

  if (!response || !response.ok) return response;

  let data;
  try {
    data = await response.clone().json();
  } catch (_err) {
    return response;
  }

  const payload = providerHomePayload(provider, data);
  return new Response(JSON.stringify(payload), {
    status: 200,
    statusText: "OK",
    headers: cloneHeaders(response.headers)
  });
}

function toUrl(input) {
  try {
    if (typeof input === "string") return new URL(input, window.location.origin);
    if (input instanceof URL) return new URL(input.href);
    if (typeof Request !== "undefined" && input instanceof Request) return new URL(input.url, window.location.origin);
  } catch (_err) {
    return null;
  }
  return null;
}

function rebuildInput(input, url) {
  if (typeof input === "string") return url.toString();
  if (input instanceof URL) return url;
  if (typeof Request !== "undefined" && input instanceof Request) {
    return new Request(url.toString(), input);
  }
  return input;
}

export function installProviderFetchPatch() {
  if (typeof window === "undefined" || typeof window.fetch !== "function") return;
  if (window.__FLIXYFY_PROVIDER_FETCH_PATCH_V6_INSTALLED__) return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async function flixyfyProviderFetch(input, init) {
    const url = toUrl(input);
    if (!url || !url.pathname.includes("/api/v3/")) {
      return originalFetch(input, init);
    }

    const provider = normalizeUrlProviderParams(url);

    if (shouldBridgeHome(url, provider)) {
      return fetchProviderHome(originalFetch, url, init, provider);
    }

    return originalFetch(rebuildInput(input, url), init);
  };

  window.__FLIXYFY_PROVIDER_FETCH_PATCH_V6_INSTALLED__ = true;
}
