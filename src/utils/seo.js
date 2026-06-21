const SITE_NAME = "Flixyfy";
const SITE_URL = "https://flixyfy.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

function cleanText(value, fallback = "") {
  return String(value || fallback)
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteUrl(path = "/") {
  if (!path) return SITE_URL;
  if (String(path).startsWith("http")) return path;
  if (path === "/") return SITE_URL;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function upsertMeta(selector, attrs) {
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement("meta");
    document.head.appendChild(tag);
  }

  Object.entries(attrs).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      tag.setAttribute(key, String(value));
    }
  });
}

function setMetaName(name, content) {
  if (!content) return;
  upsertMeta(`meta[name="${name}"]`, { name, content });
}

function setMetaProperty(property, content) {
  if (!content) return;
  upsertMeta(`meta[property="${property}"]`, { property, content });
}

function setCanonical(href) {
  document.head.querySelectorAll('link[rel="canonical"]').forEach((el) => el.remove());

  const link = document.createElement("link");
  link.setAttribute("rel", "canonical");
  link.setAttribute("href", href);
  document.head.appendChild(link);
}

export function setJsonLd(id, data) {
  if (!id || !data) return;

  const existing = document.getElementById(id);
  if (existing) existing.remove();

  const script = document.createElement("script");
  script.id = id;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data, (key, value) => {
    if (value === undefined || value === null || value === "") return undefined;
    return value;
  });

  document.head.appendChild(script);
}

export function setPageSeo({
  title,
  description,
  path = "/",
  image = DEFAULT_IMAGE,
  type = "website",
} = {}) {
  const finalTitle = cleanText(title || `${SITE_NAME} - Find Where to Watch Indian Movies Online`);
  const finalDescription = cleanText(
    description ||
      "Search Indian movies and find where to watch them online across OTT platforms."
  );
  const canonical = absoluteUrl(path);
  const finalImage = image && String(image).startsWith("http") ? image : absoluteUrl(image || DEFAULT_IMAGE);

  document.title = finalTitle;

  setMetaName("description", finalDescription);
  setMetaName("robots", "index, follow");

  setCanonical(canonical);

  setMetaProperty("og:type", type);
  setMetaProperty("og:site_name", SITE_NAME);
  setMetaProperty("og:title", finalTitle);
  setMetaProperty("og:description", finalDescription);
  setMetaProperty("og:url", canonical);
  setMetaProperty("og:image", finalImage);

  setMetaName("twitter:card", "summary_large_image");
  setMetaName("twitter:title", finalTitle);
  setMetaName("twitter:description", finalDescription);
  setMetaName("twitter:image", finalImage);
}

export function applyHomeSeo() {
  setPageSeo({
    title: "Flixyfy - Find Where to Watch Indian Movies Online",
    description:
      "Search Indian movies and find where to watch them online across OTT platforms. Explore Hindi, Telugu, Tamil, Malayalam, Kannada, Bengali, Marathi, Punjabi, Gujarati, Odia, and Assamese movies.",
    path: "/",
    image: DEFAULT_IMAGE,
    type: "website",
  });

  setJsonLd("website-schema-json", {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  });
}

export function applyMovieSeo(movie, slug) {
  if (!movie) return;

  const title = cleanText(movie.title || movie.name || "Movie");
  const year = movie.release_year || movie.year || "";
  const poster = movie.poster_url
    ? String(movie.poster_url).startsWith("http")
      ? movie.poster_url
      : `https://image.tmdb.org/t/p/w500${movie.poster_url}`
    : DEFAULT_IMAGE;

  const yearText = year ? ` (${year})` : "";
  const description = movie.overview
    ? cleanText(String(movie.overview).slice(0, 155))
    : `Find where to watch ${title}${yearText} online across Indian OTT platforms.`;

  setPageSeo({
    title: `${title}${yearText} - Where to Watch Online | ${SITE_NAME}`,
    description,
    path: `/movie/${slug || movie.slug}`,
    image: poster,
    type: "video.movie",
  });

  setJsonLd("movie-schema-json", {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: title,
    description,
    image: poster,
    url: absoluteUrl(`/movie/${slug || movie.slug}`),
    datePublished: year ? String(year) : undefined,
    inLanguage: movie.primary_language || movie.original_language || movie.language || undefined,
    director:
      movie.director && movie.director !== "N/A"
        ? {
            "@type": "Person",
            name: movie.director,
          }
        : undefined,
    actor:
      movie.actors && movie.actors !== "N/A"
        ? String(movie.actors)
            .split(",")
            .slice(0, 8)
            .map((name) => ({
              "@type": "Person",
              name: name.trim(),
            }))
        : undefined,
    aggregateRating: movie.rating
      ? {
          "@type": "AggregateRating",
          ratingValue: Number(movie.rating).toFixed(1),
          bestRating: "10",
          worstRating: "1",
          ratingCount: movie.vote_count ? String(movie.vote_count) : "1",
        }
      : undefined,
  });
}