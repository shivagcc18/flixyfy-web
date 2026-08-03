export function normalizePosterUrl(value) {
  if (typeof value !== "string") return null;
  const source = value.trim();
  if (!source || ["null", "none", "undefined", "unknown"].includes(source.toLowerCase())) return null;
  if (source.startsWith("//")) return normalizePosterUrl(`https:${source}`);
  if (source.startsWith("/assets/") || source.startsWith("/images/") || source.startsWith("/posters/")) return source;
  if (source.startsWith("/t/p/")) return `https://image.tmdb.org${source}`;
  if (source.startsWith("/")) return `https://image.tmdb.org/t/p/w500${source}`;
  if (/^[A-Za-z0-9_.-]+\.(jpg|jpeg|png|webp|avif|gif)$/i.test(source)) return `/${source}`;

  try {
    const parsed = new URL(source, typeof window === "undefined" ? "http://localhost" : window.location.origin);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    if (parsed.protocol === "http:" && !["localhost", "127.0.0.1"].includes(parsed.hostname)) parsed.protocol = "https:";
    const allowedHosts = new Set([
      "image.tmdb.org",
      "media.themoviedb.org",
      "localhost",
      "127.0.0.1",
    ]);
    if (!allowedHosts.has(parsed.hostname.toLowerCase())) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}
