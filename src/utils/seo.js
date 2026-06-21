const SITE_NAME = "Flixyfy";
const SITE_URL = "https://flixyfy.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

function cleanText(value, fallback = "") {
  return String(value || fallback)
    .replace(/\s+/g, " ")
    .trim();
}

function setMeta(name, content, attr = "name") {
  if (!content) return;

  let tag = document.head.querySelector(`meta[${attr}="${name}"]`);

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, name);
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", content);
}

function setLink(rel, href) {
  if (!href) return;

  document.head.querySelectorAll(`link[rel="${rel}"]`).forEach((el) => el.remove());

  const link = document.createElement("link");
  link.setAttribute("rel", rel);
  link.setAttribute("href", href);
  document.head.appendChild(link);
}

function setJsonLd(id, data) {
  if (!data) return;

  const old = document.getElementById(id);
  if (old) old.remove();

  const script = document.createElement("script");
  script.id = id;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export function applyMovieSeo(movie) {
  if (!movie) return;

  const title = cleanText(movie.title || movie.name || "Movie");
  const year = movie.year || movie.release_year || "";
  const language = cleanText(movie.language || movie.original_language || "Indian");
  const overview = cleanText(movie.overview || movie.description);

  const slug = movie.slug || `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${year}`;
  const canonical = `${SITE_URL}/movie/${slug}`;

  const pageTitle = `${title}${year ? ` (${year})` : ""} - Where to Watch Online | ${SITE_NAME}`;
  const description =
    overview ||
    `Find where to watch ${title}${year ? ` (${year})` : ""} online on OTT platforms. Check streaming availability, cast, rating, language, and movie details on ${SITE_NAME}.`;

  const poster =
    movie.poster_url ||
    movie.poster ||
    movie.image ||
    DEFAULT_IMAGE;

  document.title = pageTitle;

  setMeta("description", description);
  setMeta("robots", "index, follow");
  setLink("canonical", canonical);

  setMeta("og:type", "video.movie", "property");
  setMeta("og:site_name", SITE_NAME, "property");
  setMeta("og:title", pageTitle, "property");
  setMeta("og:description", description, "property");
  setMeta("og:url", canonical, "property");
  setMeta("og:image", poster, "property");

  setMeta("twitter:card", "summary_large_image");
  setMeta("twitter:title", pageTitle);
  setMeta("twitter:description", description);
  setMeta("twitter:image", poster);

  setJsonLd("movie-jsonld", {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: title,
    url: canonical,
    image: poster,
    description,
    datePublished: year ? `${year}-01-01` : undefined,
    inLanguage: language,
    aggregateRating: movie.rating
      ? {
          "@type": "AggregateRating",
          ratingValue: String(movie.rating),
          bestRating: "10",
          worstRating: "1",
        }
      : undefined,
    actor: movie.actors
      ? String(movie.actors)
          .split(",")
          .slice(0, 8)
          .map((name) => ({
            "@type": "Person",
            name: cleanText(name),
          }))
      : undefined,
    director: movie.director
      ? {
          "@type": "Person",
          name: cleanText(movie.director),
        }
      : undefined,
  });
}

export function applyHomeSeo() {
  const canonical = SITE_URL;
  const title = `Flixyfy - Find Where to Watch Indian Movies Online`;
  const description =
    "Search Indian movies and find where to watch them online across OTT platforms. Explore Hindi, Telugu, Tamil, Malayalam, Kannada, Bengali, Marathi, Punjabi, Gujarati, Odia, and Assamese movies.";

  document.title = title;

  setMeta("description", description);
  setMeta("robots", "index, follow");
  setLink("canonical", canonical);

  setMeta("og:type", "website", "property");
  setMeta("og:site_name", SITE_NAME, "property");
  setMeta("og:title", title, "property");
  setMeta("og:description", description, "property");
  setMeta("og:url", canonical, "property");
  setMeta("og:image", DEFAULT_IMAGE, "property");

  setMeta("twitter:card", "summary_large_image");
  setMeta("twitter:title", title);
  setMeta("twitter:description", description);
  setMeta("twitter:image", DEFAULT_IMAGE);
}