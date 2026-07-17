const TMDB_IMAGE_BASE = "https://image.tmdb.org/t/p/w500";

function clean(value) {
  return String(value || "").trim();
}

function looksMissing(value) {
  const text = clean(value).toLowerCase();
  return !text || ["null", "none", "undefined", "unknown"].includes(text);
}

export function resolvePosterUrl(item = {}) {
  const candidates = [
    item.poster_url,
    item.poster,
    item.image_url,
    item.image,
    item.thumbnail,
    item.backdrop_url,
    item.tmdb_poster_path,
    item.poster_path,
  ];

  for (const raw of candidates) {
    if (looksMissing(raw)) continue;
    const value = clean(raw);

    if (/^https?:\/\//i.test(value)) return value;
    if (value.startsWith("//")) return `https:${value}`;
    if (value.startsWith("/assets/") || value.startsWith("/images/") || value.startsWith("/posters/")) {
      return value;
    }
    if (value.startsWith("/")) return `${TMDB_IMAGE_BASE}${value}`;
    if (/^[A-Za-z0-9_-]+\.(jpg|jpeg|png|webp|avif|gif)$/i.test(value)) return `/${value}`;
  }

  return "";
}
