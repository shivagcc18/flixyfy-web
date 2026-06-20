const SITE_NAME = "Flixyfy";
const SITE_URL = "https://www.flixyfy.com";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

function ensureMetaByName(name) {
  let tag = document.querySelector(`meta[name="${name}"]`);

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }

  return tag;
}

function ensureMetaByProperty(property) {
  let tag = document.querySelector(`meta[property="${property}"]`);

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }

  return tag;
}

function ensureCanonical() {
  let link = document.querySelector('link[rel="canonical"]');

  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }

  return link;
}

export function absoluteUrl(path = "/") {
  if (!path) return SITE_URL;
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function setPageSeo({
  title,
  description,
  path = "/",
  image = DEFAULT_IMAGE,
  type = "website",
}) {
  const finalTitle = title?.includes(SITE_NAME) ? title : `${title} | ${SITE_NAME}`;
  const finalUrl = absoluteUrl(path);
  const finalImage = absoluteUrl(image);

  document.title = finalTitle;

  ensureMetaByName("description").setAttribute("content", description);

  ensureCanonical().setAttribute("href", finalUrl);

  ensureMetaByProperty("og:title").setAttribute("content", finalTitle);
  ensureMetaByProperty("og:description").setAttribute("content", description);
  ensureMetaByProperty("og:type").setAttribute("content", type);
  ensureMetaByProperty("og:url").setAttribute("content", finalUrl);
  ensureMetaByProperty("og:image").setAttribute("content", finalImage);
  ensureMetaByProperty("og:site_name").setAttribute("content", SITE_NAME);

  ensureMetaByName("twitter:card").setAttribute("content", "summary_large_image");
  ensureMetaByName("twitter:title").setAttribute("content", finalTitle);
  ensureMetaByName("twitter:description").setAttribute("content", description);
  ensureMetaByName("twitter:image").setAttribute("content", finalImage);
}

export function setJsonLd(id, schema) {
  const oldScript = document.getElementById(id);
  if (oldScript) oldScript.remove();

  const script = document.createElement("script");
  script.id = id;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

export function removeJsonLd(id) {
  const oldScript = document.getElementById(id);
  if (oldScript) oldScript.remove();
}

export const SEO_SITE = {
  name: SITE_NAME,
  url: SITE_URL,
  defaultImage: DEFAULT_IMAGE,
};