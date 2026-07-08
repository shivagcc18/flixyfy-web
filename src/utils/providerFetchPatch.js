// FLIXYFY_PROVIDER_FILTER_V5_FINAL
// Frontend-only provider query normalization.
// Production serving remains v5. This file does not reference or create serving tables.

export const FLIXYFY_PROVIDER_FILTER_V5_FINAL = true;

export function normalizeProviderForApi(value) {
  const raw = String(value || "all").trim().toLowerCase();
  const compact = raw.replace(/[\s\-]+/g, "_").replace(/__+/g, "_");

  const map = {
    "": "all",
    all: "all",
    any: "all",
    provider: "all",
    providers: "all",
    "all providers": "all",
    all_providers: "all",

    youtube: "youtube",
    yt: "youtube",
    "you tube": "youtube",
    youtube_movies: "youtube",
    youtube_free: "youtube",

    netflix: "netflix",
    "prime video": "prime_video",
    prime_video: "prime_video",
    prime: "prime_video",
    amazon_prime: "prime_video",
    amazon_prime_video: "prime_video",

    jiohotstar: "jiohotstar",
    "jio hotstar": "jiohotstar",
    hotstar: "jiohotstar",
    disney_hotstar: "jiohotstar",
    disney_plus_hotstar: "jiohotstar",

    zee5: "zee5",
    "zee 5": "zee5",
    sonyliv: "sonyliv",
    "sony liv": "sonyliv",
    aha: "aha",

    sunnxt: "sun_nxt",
    sun_nxt: "sun_nxt",
    "sun nxt": "sun_nxt",

    shemaroome: "shemaroome",
    shemaroo: "shemaroome",
    "shemaroo me": "shemaroome",

    mxplayer: "mxplayer",
    mx_player: "mxplayer",
    "mx player": "mxplayer",
    amazon_mx_player: "amazon_mx_player",
    "amazon mx player": "amazon_mx_player",

    googleplay: "googleplay",
    google_play: "googleplay",
    "google play": "googleplay",
    google_play_movies: "google_play_movies",
    "google play movies": "google_play_movies",
    google_tv: "google_tv",
    "google tv": "google_tv",

    appletvstore: "appletvstore",
    apple_tv_store: "apple_tv_store",
    "apple tv store": "apple_tv_store",
    apple_tv: "apple_tv_store",
    "apple tv": "apple_tv_store",

    amazonvideo: "amazonvideo",
    amazon_video: "amazon_video",
    "amazon video": "amazon_video",

    vi_movies_and_tv: "vi_movies_and_tv",
    "vi movies and tv": "vi_movies_and_tv",
    "vi movies & tv": "vi_movies_and_tv",

    eros_now_select_apple_tv_channel: "eros_now_select_apple_tv_channel",
    "eros now select apple tv channel": "eros_now_select_apple_tv_channel",
    eros_now: "eros_now_select_apple_tv_channel",
    "eros now": "eros_now_select_apple_tv_channel",

    hoichoi: "hoichoi",
    manoramamax: "manoramamax",
    "manorama max": "manoramamax",

    tubi_tv: "tubi_tv",
    "tubi tv": "tubi_tv",
    tubi: "tubi_tv",
    plex: "plex",
    hoopla: "hoopla",
    kanopy: "kanopy",
    rakuten_tv: "rakuten_tv",
    "rakuten tv": "rakuten_tv",
    sky_store: "sky_store",
    "sky store": "sky_store",
    fandango_at_home: "fandango_at_home",
    "fandango at home": "fandango_at_home",
    the_roku_channel: "the_roku_channel",
    "the roku channel": "the_roku_channel",
    roku: "the_roku_channel",
  };

  return map[raw] || map[compact] || compact;
}

function normalizeProviderUrl(input) {
  const url = new URL(input, window.location.origin);
  const rawProvider = url.searchParams.get("provider") || url.searchParams.get("provider_key");

  if (!rawProvider) return url;

  const provider = normalizeProviderForApi(rawProvider);

  url.searchParams.delete("provider_key");
  url.searchParams.delete("has_youtube");

  if (!provider || provider === "all") {
    url.searchParams.delete("provider");
    return url;
  }

  url.searchParams.set("provider", provider);

  if (provider === "youtube") {
    url.searchParams.set("has_youtube", "1");
  }

  return url;
}

export function installProviderFetchPatch() {
  if (typeof window === "undefined") return;
  if (window.__FLIXYFY_PROVIDER_FILTER_V5_FINAL_INSTALLED__) return;
  if (typeof window.fetch !== "function") return;

  const originalFetch = window.fetch.bind(window);

  window.fetch = function flixyfyProviderFilterFetch(input, init) {
    try {
      if (typeof input === "string" || input instanceof URL) {
        const url = normalizeProviderUrl(String(input));
        return originalFetch(url.toString(), init);
      }

      if (typeof Request !== "undefined" && input instanceof Request) {
        const url = normalizeProviderUrl(input.url);
        const request = new Request(url.toString(), input);
        return originalFetch(request, init);
      }
    } catch (err) {
      return originalFetch(input, init);
    }

    return originalFetch(input, init);
  };

  window.__FLIXYFY_PROVIDER_FILTER_V5_FINAL_INSTALLED__ = true;
}
