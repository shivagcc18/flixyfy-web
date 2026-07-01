function normalizeProviderKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\+/g, " plus")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");
}

const PROVIDER_LOGOS = {
  netflix: "/provider-logos/indian/netflix.png",
  "prime-video": "/provider-logos/indian/prime-video.png",
  prime: "/provider-logos/indian/prime-video.png",
  "amazon-prime-video": "/provider-logos/indian/prime-video.png",
  "amazon-prime-video-with-ads": "/provider-logos/indian/prime-video.png",
  jiohotstar: "/provider-logos/indian/jiohotstar.png",
  hotstar: "/provider-logos/indian/jiohotstar.png",
  zee5: "/provider-logos/indian/zee5.png",
  sonyliv: "/provider-logos/indian/sonyliv.png",
  "sony-liv": "/provider-logos/indian/sonyliv.png",
  "sun-nxt": "/provider-logos/indian/sun-nxt.png",
  sunnxt: "/provider-logos/indian/sun-nxt.png",
  aha: "/provider-logos/indian/aha.png",
  "etv-win": "/provider-logos/indian/etv-win.png",
  etvwin: "/provider-logos/indian/etv-win.png",
  "vi-movies-and-tv": "/provider-logos/indian/vi-movies-and-tv.png",
  "google-play-movies": "/provider-logos/indian/google-play-movies.png",
  "apple-tv-store": "/provider-logos/indian/apple-tv-store.png",
  youtube: "/provider-logos/indian/youtube.svg",
};

export function getProviderLogo(providerKey, providerName) {
  const keys = [
    normalizeProviderKey(providerKey),
    normalizeProviderKey(providerName),
    normalizeProviderKey(String(providerName || "").replace("TV", " TV")),
  ].filter(Boolean);

  for (const key of keys) {
    if (PROVIDER_LOGOS[key]) return PROVIDER_LOGOS[key];
  }

  return null;
}

