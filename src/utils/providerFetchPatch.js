// FLIXYFY_UI_FILTERS_FAST_RESPONSE_FIX_V1
// Provider normalizer + small GET cache/dedupe for Flixyfy API reads.
// No DOM mutation. No backend mutation. No DB mutation.

const PROVIDER_ALIASES = {
  "": "all",
  all: "all",
  "all provider": "all",
  "all providers": "all",
  "all_provider": "all",
  "all_providers": "all",
  youtube: "youtube",
  "you tube": "youtube",
  yt: "youtube",
  netflix: "netflix",
  prime: "prime_video",
  "prime video": "prime_video",
  primevideo: "prime_video",
  prime_video: "prime_video",
  amazonprime: "prime_video",
  "amazon prime": "prime_video",
  "amazon prime video": "prime_video",
  amazon_prime_video: "prime_video",
  amazon_prime_video_with_ads: "prime_video",
  jiohotstar: "jiohotstar",
  "jio hotstar": "jiohotstar",
  hotstar: "jiohotstar",
  "disney hotstar": "jiohotstar",
  zee5: "zee5",
  "zee 5": "zee5",
  sonyliv: "sonyliv",
  "sony liv": "sonyliv",
  aha: "aha",
  sunnxt: "sun_nxt",
  "sun nxt": "sun_nxt",
  sun_nxt: "sun_nxt",
  etvwin: "etv_win",
  "etv win": "etv_win",
  etv_win: "etv_win",
  mxplayer: "mx_player",
  "mx player": "mx_player",
  mx_player: "mx_player",
  amazon_mx_player: "mx_player",
  shemaroome: "shemaroome",
  "shemaroo me": "shemaroome",
  "eros now": "eros_now",
  eros_now: "eros_now",
  "apple tv": "apple_tv_store",
  appletv: "apple_tv_store",
  apple_tv: "apple_tv_store",
  "apple tv store": "apple_tv_store",
  appletvstore: "apple_tv_store",
  apple_tv_store: "apple_tv_store",
  "amazon video": "amazon_video",
  amazonvideo: "amazon_video",
  amazon_video: "amazon_video",
  "google tv": "google_tv",
  google_tv: "google_tv",
  disney: "disney_plus",
  "disney+": "disney_plus",
  disney_plus: "disney_plus",
  hulu: "hulu",
  max: "max",
  hbo_max: "max",
  plex: "plex",
  viki: "viki",
  "rakuten viki": "viki",
  kocowa: "kocowa",
  tving: "tving",
  wavve: "wavve",
  watcha: "watcha",
  coupang_play: "coupang_play",
  "coupang play": "coupang_play",
  tubi: "tubi_tv",
  "tubi tv": "tubi_tv",
  tubi_tv: "tubi_tv"
};

const PROVIDER_LABELS = {
  all: "All Providers",
  youtube: "YouTube",
  netflix: "Netflix",
  prime_video: "Prime Video",
  jiohotstar: "JioHotstar",
  zee5: "ZEE5",
  sonyliv: "SonyLIV",
  aha: "Aha",
  sun_nxt: "Sun NXT",
  etv_win: "ETV Win",
  mx_player: "MX Player",
  shemaroome: "ShemarooMe",
  eros_now: "Eros Now",
  apple_tv_store: "Apple TV",
  amazon_video: "Amazon Video",
  google_tv: "Google TV",
  disney_plus: "Disney+",
  hulu: "Hulu",
  max: "Max",
  plex: "Plex",
  viki: "Rakuten Viki",
  kocowa: "Kocowa",
  tving: "TVING",
  wavve: "Wavve",
  watcha: "Watcha",
  coupang_play: "Coupang Play",
  tubi_tv: "Tubi"
};

const GET_CACHE = new Map();
const INFLIGHT = new Map();
const DEFAULT_TTL_MS = 60000;
const DEFAULT_TIMEOUT_MS = 12000;

function normalizeText(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[+]/g, " plus ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeProviderForApi(value) {
  const lower = normalizeText(value);
  if (Object.prototype.hasOwnProperty.call(PROVIDER_ALIASES, lower)) return PROVIDER_ALIASES[lower];
  const underscored = lower.replace(/\s+/g, "_");
  if (Object.prototype.hasOwnProperty.call(PROVIDER_ALIASES, underscored)) return PROVIDER_ALIASES[underscored];
  return underscored || "all";
}

export function providerValueForState(value) {
  const key = normalizeProviderForApi(value);
  return key === "all" ? "" : key;
}

export function providerDisplayLabel(value) {
  const key = normalizeProviderForApi(value);
  return PROVIDER_LABELS[key] || String(value || "").replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export function providerFromCurrentUrl() {
  if (typeof window === "undefined") return "";
  try {
    const params = new URLSearchParams(window.location.search || "");
    return providerValueForState(params.get("provider") || params.get("provider_key") || "");
  } catch (_) {
    return "";
  }
}

export function syncProviderToUrl(value) {
  if (typeof window === "undefined") return;
  try {
    const key = providerValueForState(value);
    const url = new URL(window.location.href);
    if (key) url.searchParams.set("provider", key);
    else url.searchParams.delete("provider");
    window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
  } catch (_) {}
}

function cacheKeyFor(url) {
  try {
    const u = new URL(String(url), typeof window !== "undefined" ? window.location.origin : "https://flixyfy.com");
    u.searchParams.sort();
    return u.toString();
  } catch (_) {
    return String(url);
  }
}

export async function fetchFlixyfyJson(url, options = {}) {
  const key = cacheKeyFor(url);
  const ttlMs = Number(options.ttlMs || DEFAULT_TTL_MS);
  const timeoutMs = Number(options.timeoutMs || DEFAULT_TIMEOUT_MS);
  const now = Date.now();
  const cached = GET_CACHE.get(key);
  if (cached && cached.expiresAt > now) return cached.data;
  if (INFLIGHT.has(key)) return INFLIGHT.get(key);

  const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
  const timer = controller ? window.setTimeout(() => controller.abort(), timeoutMs) : null;

  const promise = fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json", ...(options.headers || {}) },
    signal: controller ? controller.signal : undefined,
  })
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API ${res.status}: ${String(url)} ${text.slice(0, 240)}`);
      }
      return res.json();
    })
    .then((data) => {
      GET_CACHE.set(key, { data, expiresAt: Date.now() + ttlMs });
      return data;
    })
    .finally(() => {
      if (timer) window.clearTimeout(timer);
      INFLIGHT.delete(key);
    });

  INFLIGHT.set(key, promise);
  return promise;
}

export function installProviderFetchPatch() {
  return { version: "FLIXYFY_UI_FILTERS_FAST_RESPONSE_FIX_V1", active: false };
}

export default installProviderFetchPatch;
