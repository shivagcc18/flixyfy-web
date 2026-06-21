const SITE_URL = "https://www.flixyfy.com";

function upsertMeta(selector, createAttrs, content) {
  let tag = document.head.querySelector(selector);

  if (!tag) {
    tag = document.createElement("meta");
    Object.entries(createAttrs).forEach(([key, value]) => {
      tag.setAttribute(key, value);
    });
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", content || "");
}

function upsertLinkCanonical(href) {
  let tag = document.head.querySelector('link[rel="canonical"]');

  if (!tag) {
    tag = document.createElement("link");
    tag.setAttribute("rel", "canonical");
    document.head.appendChild(tag);
  }

  tag.setAttribute("href", href);
}

export function setPageSeo({ title, description, path, image, type = "website" }) {
  const cleanPath = path || "/";
  const url = `${SITE_URL}${cleanPath}`;
  const finalImage = image || `${SITE_URL}/og-image.png`;

  document.title = title;

  upsertMeta('meta[name="description"]', { name: "description" }, description);
  upsertMeta('meta[name="robots"]', { name: "robots" }, "index, follow");

  upsertLinkCanonical(url);

  upsertMeta('meta[property="og:type"]', { property: "og:type" }, type);
  upsertMeta('meta[property="og:site_name"]', { property: "og:site_name" }, "Flixyfy");
  upsertMeta('meta[property="og:title"]', { property: "og:title" }, title);
  upsertMeta('meta[property="og:description"]', { property: "og:description" }, description);
  upsertMeta('meta[property="og:url"]', { property: "og:url" }, url);
  upsertMeta('meta[property="og:image"]', { property: "og:image" }, finalImage);

  upsertMeta('meta[name="twitter:card"]', { name: "twitter:card" }, "summary_large_image");
  upsertMeta('meta[name="twitter:title"]', { name: "twitter:title" }, title);
  upsertMeta('meta[name="twitter:description"]', { name: "twitter:description" }, description);
  upsertMeta('meta[name="twitter:image"]', { name: "twitter:image" }, finalImage);
}

export function setJsonLd(id, data) {
  const old = document.getElementById(id);
  if (old) old.remove();

  const script = document.createElement("script");
  script.id = id;
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}