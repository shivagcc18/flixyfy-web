// FLIXYFY_UI_DOMAIN_FILTERS_FINAL_FIX_V2
const PROVIDER_ALIASES = {
  "": "all", all: "all", "all provider": "all", "all providers": "all", all_provider: "all", all_providers: "all",
  youtube: "youtube", "you tube": "youtube", yt: "youtube",
  netflix: "netflix",
  prime: "prime_video", "prime video": "prime_video", primevideo: "prime_video", prime_video: "prime_video", "amazon prime": "prime_video", "amazon prime video": "prime_video", amazon_prime_video: "prime_video", amazon_prime_video_with_ads: "prime_video",
  jiohotstar: "jiohotstar", "jio hotstar": "jiohotstar", hotstar: "jiohotstar", "disney hotstar": "jiohotstar",
  zee5: "zee5", "zee 5": "zee5",
  sonyliv: "sonyliv", "sony liv": "sonyliv",
  aha: "aha",
  sunnxt: "sun_nxt", "sun nxt": "sun_nxt", sun_nxt: "sun_nxt",
  etvwin: "etv_win", "etv win": "etv_win", etv_win: "etv_win",
  mxplayer: "mx_player", "mx player": "mx_player", mx_player: "mx_player", amazon_mx_player: "mx_player",
  shemaroome: "shemaroome", "shemaroo me": "shemaroome",
  "eros now": "eros_now", eros_now: "eros_now",
  "apple tv": "apple_tv_store", appletv: "apple_tv_store", apple_tv: "apple_tv_store", "apple tv store": "apple_tv_store", apple_tv_store: "apple_tv_store", itunes: "apple_tv_store",
  "amazon video": "amazon_video", amazon_video: "amazon_video",
  "google tv": "google_tv", google_tv: "google_tv", "google play": "google_tv",
  "disney+": "disney_plus", disney: "disney_plus", "disney plus": "disney_plus", disney_plus: "disney_plus",
  hulu: "hulu", max: "max", "hbo max": "max", hbo_max: "max", plex: "plex",
  viki: "viki", "rakuten viki": "viki", kocowa: "kocowa", tving: "tving", wavve: "wavve", watcha: "watcha", "coupang play": "coupang_play", coupang_play: "coupang_play",
  tubi: "tubi_tv", "tubi tv": "tubi_tv", tubi_tv: "tubi_tv",
};

const PROVIDER_LABELS = {
  all: "All Providers", youtube: "YouTube", netflix: "Netflix", prime_video: "Prime Video", jiohotstar: "JioHotstar", zee5: "ZEE5", sonyliv: "SonyLIV", aha: "Aha", sun_nxt: "Sun NXT", etv_win: "ETV Win", mx_player: "MX Player", shemaroome: "ShemarooMe", eros_now: "Eros Now", apple_tv_store: "Apple TV", amazon_video: "Amazon Video", google_tv: "Google TV", disney_plus: "Disney+", hulu: "Hulu", max: "Max", plex: "Plex", viki: "Rakuten Viki", kocowa: "Kocowa", tving: "TVING", wavve: "Wavve", watcha: "Watcha", coupang_play: "Coupang Play", tubi_tv: "Tubi"
};

const CACHE = new Map();
const INFLIGHT = new Map();
const DEFAULT_TTL_MS = 60000;
const DEFAULT_TIMEOUT_MS = 12000;

function clean(value) {
  return String(value || "").trim().toLowerCase().replace(/[+]/g, " plus ").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

export function normalizeProviderForApi(value) {
  const raw = clean(value);
  if (Object.prototype.hasOwnProperty.call(PROVIDER_ALIASES, raw)) return PROVIDER_ALIASES[raw];
  const underscored = raw.replace(/\s+/g, "_");
  if (Object.prototype.hasOwnProperty.call(PROVIDER_ALIASES, underscored)) return PROVIDER_ALIASES[underscored];
  return underscored || "all";
}

export function providerValueForState(value) {
  const provider = normalizeProviderForApi(value);
  return provider === "all" ? "" : provider;
}

export function providerDisplayLabel(value) {
  const provider = normalizeProviderForApi(value);
  return PROVIDER_LABELS[provider] || String(provider || "").replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export function providerFromCurrentUrl() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search || "");
  return providerValueForState(params.get("provider") || params.get("provider_key") || "");
}

export function syncProviderToUrl(value) {
  if (typeof window === "undefined") return;
  const provider = providerValueForState(value);
  const url = new URL(window.location.href);
  if (provider) url.searchParams.set("provider", provider);
  else url.searchParams.delete("provider");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

function keyFor(url) {
  const parsed = new URL(String(url), typeof window !== "undefined" ? window.location.origin : "https://flixyfy.com");
  parsed.searchParams.sort();
  return parsed.toString();
}

export async function fetchFlixyfyJson(url, options = {}) {
  const key = keyFor(url);
  const cached = CACHE.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  if (INFLIGHT.has(key)) return INFLIGHT.get(key);

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), Number(options.timeoutMs || DEFAULT_TIMEOUT_MS));
  const promise = fetch(url, { cache: "no-store", headers: { Accept: "application/json", ...(options.headers || {}) }, signal: controller.signal })
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API ${res.status}: ${String(url)} ${text.slice(0, 240)}`);
      }
      return res.json();
    })
    .then((data) => {
      CACHE.set(key, { data, expiresAt: Date.now() + Number(options.ttlMs || DEFAULT_TTL_MS) });
      return data;
    })
    .finally(() => { window.clearTimeout(timer); INFLIGHT.delete(key); });
  INFLIGHT.set(key, promise);
  return promise;
}

export function installProviderFetchPatch() {
  return { active: false, version: "FLIXYFY_UI_DOMAIN_FILTERS_FINAL_FIX_V2" };
}

export default installProviderFetchPatch;
