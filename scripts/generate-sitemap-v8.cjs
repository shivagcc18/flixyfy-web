const fs = require("fs");
const path = require("path");

const SITE_URL = "https://flixyfy.com";
const API_BASE = "https://flixyfy-api-production.up.railway.app";
const LIMIT = 100;
const OUT_DIR = path.join(__dirname, "..", "public", "sitemaps");

const LANGUAGES = [
  "hindi",
  "telugu",
  "tamil",
  "malayalam",
  "kannada",
  "bengali",
  "marathi",
  "punjabi",
  "gujarati",
  "odia",
  "assamese",
];

function xmlEscape(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function urlEntry(loc, priority = "0.8", changefreq = "weekly") {
  const today = new Date().toISOString().slice(0, 10);

  return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`;
}

function wrapUrlSet(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;
}

function wrapSitemapIndex(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries
  .map(
    (loc) => `  <sitemap>
    <loc>${xmlEscape(loc)}</loc>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>
`;
}

async function fetchJson(url) {
  const res = await fetch(url);

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`HTTP ${res.status}: ${url}\n${body}`);
  }

  return res.json();
}

async function fetchAllMovies() {
  let page = 1;
  let all = [];
  let total = null;

  while (true) {
    const url = `${API_BASE}/api/v3/movies?page=${page}&limit=${LIMIT}&sort=popular`;
    console.log(`Fetching page ${page}: ${url}`);

    const data = await fetchJson(url);
    const items = data.items || data.movies || [];

    if (total === null) {
      total = data.total || 0;
      console.log(`API total: ${total}`);
    }

    if (!items.length) break;

    all.push(...items);

    if (all.length >= total) break;

    page += 1;
  }

  const seen = new Set();
  const clean = [];

  for (const movie of all) {
    if (!movie.slug) continue;
    if (seen.has(movie.slug)) continue;

    seen.add(movie.slug);
    clean.push(movie);
  }

  return clean;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const coreEntries = [
    urlEntry(`${SITE_URL}/`, "1.0", "daily"),
    urlEntry(`${SITE_URL}/about`, "0.5", "monthly"),
    urlEntry(`${SITE_URL}/contact`, "0.5", "monthly"),
  ];

  fs.writeFileSync(
    path.join(OUT_DIR, "core.xml"),
    wrapUrlSet(coreEntries),
    "utf8"
  );

  const languageEntries = LANGUAGES.map((lang) =>
    urlEntry(`${SITE_URL}/language/${lang}`, "0.9", "daily")
  );

  fs.writeFileSync(
    path.join(OUT_DIR, "languages.xml"),
    wrapUrlSet(languageEntries),
    "utf8"
  );

  const movies = await fetchAllMovies();

  console.log(`Movies collected: ${movies.length}`);

  const movieEntries = movies.map((movie) =>
    urlEntry(`${SITE_URL}/movie/${movie.slug}`, "0.8", "weekly")
  );

  fs.writeFileSync(
    path.join(OUT_DIR, "movies_1.xml"),
    wrapUrlSet(movieEntries),
    "utf8"
  );

  const sitemapIndex = wrapSitemapIndex([
    `${SITE_URL}/sitemaps/core.xml`,
    `${SITE_URL}/sitemaps/languages.xml`,
    `${SITE_URL}/sitemaps/movies_1.xml`,
  ]);

  fs.writeFileSync(
    path.join(__dirname, "..", "public", "sitemap.xml"),
    sitemapIndex,
    "utf8"
  );

  console.log("Sitemap generated:");
  console.log(`Core URLs     : ${coreEntries.length}`);
  console.log(`Language URLs : ${languageEntries.length}`);
  console.log(`Movie URLs    : ${movieEntries.length}`);
  console.log(`Total URLs    : ${coreEntries.length + languageEntries.length + movieEntries.length}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});