// src/utils/providerDirectLinks.js

const PROVIDER_HOME = {
  netflix: "https://www.netflix.com",
  "amazon prime video": "https://www.primevideo.com",
  "prime video": "https://www.primevideo.com",
  "amazon prime video with ads": "https://www.primevideo.com",
  "amazon prime video free with ads": "https://www.primevideo.com",
  jiohotstar: "https://www.hotstar.com/in",
  hotstar: "https://www.hotstar.com/in",
  "disney+ hotstar": "https://www.hotstar.com/in",
  zee5: "https://www.zee5.com",
  "zee 5": "https://www.zee5.com",
  "sony liv": "https://www.sonyliv.com",
  sonyliv: "https://www.sonyliv.com",
  aha: "https://www.aha.video",
  "sun nxt": "https://www.sunnxt.com",
  sunnxt: "https://www.sunnxt.com",
  hoichoi: "https://www.hoichoi.tv",
  "mx player": "https://www.amazon.in/minitv",
  "amazon mx player": "https://www.amazon.in/minitv",
  "vi movies and tv": "https://www.myvi.in/vi-movies-and-tv",
  "lionsgate play": "https://www.lionsgateplay.com",
  "apple tv": "https://tv.apple.com",
  "apple tv store": "https://tv.apple.com",
  "amazon video": "https://www.amazon.com/video",
  "google tv": "https://play.google.com/store/movies",
  "google play": "https://play.google.com/store/movies",
  "google play movies": "https://play.google.com/store/movies",
  "fandango at home": "https://www.fandangoathome.com",
  fandango: "https://www.fandangoathome.com",
  "rakuten tv": "https://www.rakuten.tv",
  "sky store": "https://www.skystore.com",
  hulu: "https://www.hulu.com",
  "hbo max": "https://www.max.com",
  max: "https://www.max.com",
  "disney plus": "https://www.disneyplus.com",
  "disney+": "https://www.disneyplus.com",
  "rakuten viki": "https://www.viki.com",
  viki: "https://www.viki.com",
  kocowa: "https://www.kocowa.com",
  tving: "https://www.tving.com",
  wavve: "https://www.wavve.com",
  watcha: "https://watcha.com",
  "coupang play": "https://www.coupangplay.com",
  youtube: "https://www.youtube.com",
};

function cleanText(value) {
  return String(value || "").trim();
}

function normalizeProvider(value) {
  return cleanText(value)
    .toLowerCase()
    .replace(/\+/g, " plus ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isBadFallbackUrl(url) {
  const value = cleanText(url).toLowerCase();
  if (!value) return true;

  return (
    value.includes("themoviedb.org/") ||
    value.includes("justwatch.com/")
  );
}

function isUsableDirectUrl(url) {
  const value = cleanText(url);
  if (!value) return false;
  if (!/^https?:\/\//i.test(value)) return false;
  if (isBadFallbackUrl(value)) return false;
  return true;
}

function providerNameFrom(input) {
  if (!input) return "";

  if (typeof input === "string") {
    return input;
  }

  return (
    input.provider_display_name ||
    input.providerDisplayName ||
    input.provider ||
    input.provider_name ||
    input.providerName ||
    input.provider_key ||
    input.providerKey ||
    input.normalized_provider_name ||
    input.name ||
    input.title ||
    ""
  );
}

function directUrlFrom(input) {
  if (!input || typeof input === "string") return "";

  return (
    input.direct_deep_link ||
    input.deep_link ||
    input.provider_deep_link ||
    input.final_url ||
    input.finalUrl ||
    input.provider_url ||
    input.providerUrl ||
    input.watch_url ||
    input.watchUrl ||
    input.url ||
    input.link ||
    input.href ||
    ""
  );
}

function fallbackUrlFrom(input) {
  if (!input || typeof input === "string") return "";

  return (
    input.fallback_url ||
    input.fallbackUrl ||
    input.tmdb_watch_link ||
    input.tmdbWatchLink ||
    input.justwatch_url ||
    input.justWatchUrl ||
    ""
  );
}

function buildSearchUrl(providerName, title) {
  const provider = normalizeProvider(providerName);
  const q = encodeURIComponent(cleanText(title));

  if (!q) {
    return PROVIDER_HOME[provider] || "";
  }

  if (provider.includes("jiohotstar") || provider.includes("hotstar")) {
    return `https://www.hotstar.com/in/search?q=${q}`;
  }

  if (provider.includes("netflix")) {
    return `https://www.netflix.com/search?q=${q}`;
  }

  if (provider.includes("prime video") || provider.includes("amazon prime")) {
    return `https://www.primevideo.com/search?phrase=${q}`;
  }

  if (provider.includes("amazon video")) {
    return `https://www.amazon.com/s?k=${q}&i=instant-video`;
  }

  if (provider.includes("apple tv")) {
    return `https://tv.apple.com/search?term=${q}`;
  }

  if (provider.includes("google tv") || provider.includes("google play")) {
    return `https://play.google.com/store/search?q=${q}&c=movies`;
  }

  if (provider.includes("fandango")) {
    return `https://www.fandangoathome.com/search?q=${q}`;
  }

  if (provider.includes("zee5") || provider.includes("zee 5")) {
    return `https://www.zee5.com/search?q=${q}`;
  }

  if (provider.includes("sony liv") || provider.includes("sonyliv")) {
    return `https://www.sonyliv.com/search/${q}`;
  }

  if (provider === "aha" || provider.includes("aha")) {
    return `https://www.aha.video/search?q=${q}`;
  }

  if (provider.includes("youtube")) {
    return `https://www.youtube.com/results?search_query=${q}`;
  }

  if (provider.includes("viki") || provider.includes("rakuten viki")) {
    return `https://www.viki.com/search?q=${q}`;
  }

  if (provider.includes("rakuten tv")) {
    return `https://www.rakuten.tv/search?q=${q}`;
  }

  if (provider.includes("sky store")) {
    return `https://www.skystore.com/search?keyword=${q}`;
  }

  return PROVIDER_HOME[provider] || "";
}

export function getProviderClickUrl(providerInput, contentTitle = "") {
  const directUrl = directUrlFrom(providerInput);

  if (isUsableDirectUrl(directUrl)) {
    return directUrl;
  }

  const providerName = providerNameFrom(providerInput);
  const providerSearchUrl = buildSearchUrl(providerName, contentTitle);

  if (providerSearchUrl) {
    return providerSearchUrl;
  }

  const fallbackUrl = fallbackUrlFrom(providerInput);

  if (fallbackUrl && /^https?:\/\//i.test(fallbackUrl)) {
    return fallbackUrl;
  }

  return "";
}

export function getProviderLinkType(providerInput) {
  const directUrl = directUrlFrom(providerInput);

  if (isUsableDirectUrl(directUrl)) {
    return "direct";
  }

  const providerName = providerNameFrom(providerInput);
  if (buildSearchUrl(providerName, "test")) {
    return "provider_search";
  }

  const fallbackUrl = fallbackUrlFrom(providerInput);
  if (fallbackUrl) {
    return "fallback";
  }

  return "none";
}
