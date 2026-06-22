export const SITE_NAME = "Flixyfy";
export const SITE_URL = "https://www.flixyfy.com";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;

export function absoluteUrl(path = "/") {
  if (!path) return SITE_URL;
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function upsertMeta(attr, key, content) {
  if (!content) return;

  let tag = document.querySelector(`meta[${attr}="${key}"]`);

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", content);
}

function upsertLink(rel, href) {
  if (!href) return;

  let tag = document.querySelector(`link[rel="${rel}"]`);

  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", rel);
    document.head.appendChild(tag);
  }

  tag.setAttribute("href", href);
}

export function removeJsonLd(id) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();
}

export function injectJsonLd(id, data) {
  if (!data) return;

  removeJsonLd(id);

  const script = document.createElement("script");
  script.id = id;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export function setSeo({
  title,
  description,
  url = SITE_URL,
  image = DEFAULT_OG_IMAGE,
  type = "website",
}) {
  const cleanTitle = title || `${SITE_NAME} - Find Where to Watch Movies Online`;
  const cleanDescription =
    description ||
    "Find where to watch Indian movies online across OTT platforms with Flixyfy.";
  const cleanUrl = absoluteUrl(url);
  const cleanImage = absoluteUrl(image);

  document.title = cleanTitle;

  upsertMeta("name", "description", cleanDescription);

  upsertLink("canonical", cleanUrl);

  upsertMeta("property", "og:site_name", SITE_NAME);
  upsertMeta("property", "og:type", type);
  upsertMeta("property", "og:title", cleanTitle);
  upsertMeta("property", "og:description", cleanDescription);
  upsertMeta("property", "og:url", cleanUrl);
  upsertMeta("property", "og:image", cleanImage);

  upsertMeta("name", "twitter:card", "summary_large_image");
  upsertMeta("name", "twitter:title", cleanTitle);
  upsertMeta("name", "twitter:description", cleanDescription);
  upsertMeta("name", "twitter:image", cleanImage);
}

export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
  };
}

export function buildBreadcrumbSchema(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.url),
    })),
  };
}

export function buildMovieSchema(movie) {
  if (!movie) return null;

  const title = movie.title || movie.name || "Movie";
  const year = movie.release_year || movie.year || movie.release_date?.slice(0, 4);
  const poster = movie.poster_url || movie.poster || movie.image || DEFAULT_OG_IMAGE;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: title,
    url: absoluteUrl(movie.slug ? `/movie/${movie.slug}` : window.location.pathname),
    image: absoluteUrl(poster),
    description:
      movie.overview ||
      movie.description ||
      `Find where to watch ${title}${year ? ` (${year})` : ""} online on Flixyfy.`,
  };

  if (year) schema.datePublished = `${year}-01-01`;
  if (movie.runtime || movie.omdb_runtime) schema.duration = movie.runtime || movie.omdb_runtime;
  if (movie.director) schema.director = { "@type": "Person", name: movie.director };

  if (movie.imdb_rating || movie.vote_average) {
    schema.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: String(movie.imdb_rating || movie.vote_average),
      bestRating: "10",
      worstRating: "1",
      ratingCount: String(movie.vote_count || 1),
    };
  }

  if (movie.actors) {
    const actors = Array.isArray(movie.actors)
      ? movie.actors
      : String(movie.actors)
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean);

    if (actors.length) {
      schema.actor = actors.slice(0, 8).map((name) => ({
        "@type": "Person",
        name,
      }));
    }
  }

  return schema;
}

export function applyHomeSeo() {
  setSeo({
    title: "Flixyfy - Find Where to Watch Indian Movies Online",
    description:
      "Search Indian movies and find where to watch them online across OTT platforms.",
    url: "/",
    type: "website",
  });

  injectJsonLd("website-schema", buildWebSiteSchema());
  injectJsonLd("organization-schema", buildOrganizationSchema());
}

export function applyMovieSeo(movie) {
  if (!movie) return;

  const title = movie.title || movie.name || "Movie";
  const year = movie.release_year || movie.year || movie.release_date?.slice(0, 4);
  const slug = movie.slug || "";
  const description =
    movie.overview ||
    `Find where to watch ${title}${year ? ` (${year})` : ""} online across OTT platforms.`;

  setSeo({
    title: `${title}${year ? ` (${year})` : ""} - Where to Watch Online | Flixyfy`,
    description,
    url: slug ? `/movie/${slug}` : window.location.pathname,
    image: movie.poster_url || movie.poster || DEFAULT_OG_IMAGE,
    type: "video.movie",
  });

  injectJsonLd("movie-schema", buildMovieSchema(movie));
  injectJsonLd(
    "breadcrumb-schema",
    buildBreadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Movies", url: "/" },
      { name: title, url: slug ? `/movie/${slug}` : window.location.pathname },
    ])
  );
}

/* Backward-compatible export aliases */
export const setPageSeo = setSeo;
export const setDynamicSeo = setSeo;
export const setSeoTags = setSeo;
export const updateSeo = setSeo;
export const buildWebsiteSchema = buildWebSiteSchema;
export function setJsonLd(data) {
  let el = document.getElementById("flixyfy-jsonld");

  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = "flixyfy-jsonld";
    document.head.appendChild(el);
  }

  el.textContent = JSON.stringify(data);
}