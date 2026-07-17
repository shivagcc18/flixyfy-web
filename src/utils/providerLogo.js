function normalizeProviderKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\+/g, " plus ")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const ALIASES = {
  prime: "prime-video",
  primevideo: "prime-video",
  "prime-video": "prime-video",
  "amazon-prime": "prime-video",
  "amazon-prime-video": "prime-video",
  "amazon-prime-video-with-ads": "prime-video",
  hotstar: "jiohotstar",
  "jio-hotstar": "jiohotstar",
  sonyliv: "sonyliv",
  "sony-liv": "sonyliv",
  sunnxt: "sun-nxt",
  "sun-nxt": "sun-nxt",
  etvwin: "etv-win",
  "etv-win": "etv-win",
  appletvstore: "apple-tv-store",
  "apple-tv": "apple-tv-store",
  "apple-tv-store": "apple-tv-store",
  googleplay: "google-play",
  "google-play-movies": "google-play",
};

function canonicalKey(value) {
  const key = normalizeProviderKey(value);
  return ALIASES[key] || key;
}

export function getProviderLogoCandidates(providerKey, providerName) {
  const keys = Array.from(
    new Set([canonicalKey(providerKey), canonicalKey(providerName)].filter(Boolean))
  );
  const roots = ["/provider-logos", "/providers", "/ott", "/logos", "/provider-logos/indian"];
  const exts = ["svg", "png"];
  const candidates = [];

  keys.forEach((key) => {
    roots.forEach((root) => {
      exts.forEach((ext) => candidates.push(`${root}/${key}.${ext}`));
    });
  });

  return candidates;
}

export function getProviderLogo(providerKey, providerName) {
  return getProviderLogoCandidates(providerKey, providerName)[0] || null;
}

export default getProviderLogo;
