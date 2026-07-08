// FLIXYFY_FRONTEND_HOME_FILTER_REAL_FIX_V10
// Provider normalization utility only.
// No DOM mutation. No fetch monkey patch. No backend mutation. No DB mutation. v5-only serving rule preserved.

const PROVIDER_ALIASES = {
  "": "all",
  "all": "all",
  "all provider": "all",
  "all providers": "all",
  "all_provider": "all",
  "all_providers": "all",

  "youtube": "youtube",
  "you tube": "youtube",

  "netflix": "netflix",

  "prime": "prime_video",
  "prime video": "prime_video",
  "prime_video": "prime_video",
  "amazon prime": "prime_video",
  "amazon prime video": "prime_video",
  "amazon_prime_video": "prime_video",
  "amazon_prime_video_with_ads": "prime_video",

  "jiohotstar": "jiohotstar",
  "jio hotstar": "jiohotstar",
  "hotstar": "jiohotstar",
  "disney hotstar": "jiohotstar",

  "zee5": "zee5",
  "zee 5": "zee5",

  "sonyliv": "sonyliv",
  "sony liv": "sonyliv",

  "aha": "aha",

  "sun nxt": "sun_nxt",
  "sunnxt": "sun_nxt",
  "sun_nxt": "sun_nxt",

  "etv win": "etv_win",
  "etvwin": "etv_win",
  "etv_win": "etv_win",

  "mx player": "mx_player",
  "mxplayer": "mx_player",
  "mx_player": "mx_player",
  "amazon_mx_player": "mx_player",

  "shemaroome": "shemaroome",
  "shemaroo me": "shemaroome",

  "eros now": "eros_now",
  "eros_now": "eros_now",

  "apple tv": "apple_tv_store",
  "apple_tv": "apple_tv_store",
  "apple tv store": "apple_tv_store",
  "apple_tv_store": "apple_tv_store",
  "appletvstore": "apple_tv_store",

  "amazon video": "amazon_video",
  "amazon_video": "amazon_video",

  "google tv": "google_tv",
  "google_tv": "google_tv",

  "google play": "google_play_movies",
  "google_play_movies": "google_play_movies",

  "hulu": "hulu",
  "max": "max",
  "plex": "plex",

  "tubi": "tubi_tv",
  "tubi tv": "tubi_tv",
  "tubi_tv": "tubi_tv"
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
  google_play_movies: "Google Play",
  hulu: "Hulu",
  max: "Max",
  plex: "Plex",
  tubi_tv: "Tubi"
};

export function normalizeProviderForApi(value) {
  const raw = String(value || "").trim();
  const lower = raw
    .toLowerCase()
    .replace(/[+]/g, " plus ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (Object.prototype.hasOwnProperty.call(PROVIDER_ALIASES, lower)) {
    return PROVIDER_ALIASES[lower];
  }

  const underscored = lower.replace(/\s+/g, "_");
  if (Object.prototype.hasOwnProperty.call(PROVIDER_ALIASES, underscored)) {
    return PROVIDER_ALIASES[underscored];
  }

  return underscored || "all";
}

export function providerDisplayLabel(value) {
  const key = normalizeProviderForApi(value);
  return PROVIDER_LABELS[key] || String(value || "").replace(/_/g, " ").replace(/\w/g, (m) => m.toUpperCase());
}

export function providerValueForState(value) {
  const key = normalizeProviderForApi(value);
  return key === "all" ? "" : key;
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

// Backward-compatible no-op. Older main.jsx imported this during temporary bridge attempts.
export function installProviderFetchPatch() {
  return {
    version: "FLIXYFY_FRONTEND_HOME_FILTER_REAL_FIX_V10",
    active: false,
    reason: "React Home.jsx now owns provider filtering directly"
  };
}
