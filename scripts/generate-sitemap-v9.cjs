const fs = require("node:fs/promises");
const path = require("node:path");

const SITE_URL = "https://www.flixyfy.com";
const API_BASE = (process.env.FLIXYFY_SITEMAP_API_BASE || "https://flixyfy-api-free.vercel.app").replace(/\/+$/, "");
const PAGE_SIZE = 100;
const CONCURRENCY = 8;
const CORE_PATHS = ["/", "/providers", "/contact", "/privacy", "/terms", "/copyright"];

function xmlEscape(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}

async function fetchPage(domain, page) {
  const url = `${API_BASE}/api/v4/movies?page=${page}&limit=${PAGE_SIZE}&sort=popular&domain=${domain}`;
  let lastError;
  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(url, { headers: { accept: "application/json" }, signal: AbortSignal.timeout(25_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
      const payload = await response.json();
      if (!Array.isArray(payload.items)) throw new Error(`Missing items array for ${url}`);
      return payload;
    } catch (error) {
      lastError = error;
      if (attempt < 4) await new Promise((resolve) => setTimeout(resolve, attempt * 500));
    }
  }
  throw lastError;
}

async function mapLimit(values, limit, mapper) {
  const output = new Array(values.length);
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(limit, values.length) }, async () => {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= values.length) return;
      output[index] = await mapper(values[index], index);
    }
  });
  await Promise.all(workers);
  return output;
}

async function fetchDomain(domain) {
  process.stdout.write(`Reading ${domain} serving pages from ${API_BASE}\n`);
  const first = await fetchPage(domain, 1);
  const total = Number(first.total);
  const pageSize = Number(first.limit) || PAGE_SIZE;
  if (!Number.isInteger(total) || total < 0) throw new Error(`Invalid ${domain} serving total`);
  const pageCount = Math.ceil(total / pageSize);
  let completed = 1;
  const rest = await mapLimit(Array.from({ length: pageCount - 1 }, (_, i) => i + 2), CONCURRENCY, async (page) => {
    const value = await fetchPage(domain, page);
    completed += 1;
    if (completed % 25 === 0 || completed === pageCount) process.stdout.write(`${domain} pages=${completed}/${pageCount}\n`);
    return value;
  });
  const rows = [first, ...rest].flatMap((page) => page.items);
  if (rows.length !== total) throw new Error(`${domain} API returned ${rows.length} rows for total ${total}`);
  return { total, rows };
}

function getRouteKey(movie) {
  return movie.movie_identity?.route?.route_key || movie.canonical_movie_id || movie.movie_id || movie.id || movie.slug;
}

function sitemapEntry(movie) {
  const routeKey = getRouteKey(movie);
  if (!routeKey || movie.entity_type && movie.entity_type !== "movie") return null;
  const loc = `${SITE_URL}/movie/${encodeURIComponent(String(routeKey))}`;
  const updatedAt = movie.updated_at ? new Date(movie.updated_at) : null;
  const lastmod = updatedAt && !Number.isNaN(updatedAt.valueOf()) ? updatedAt.toISOString().slice(0, 10) : null;
  return `  <url>\n    <loc>${xmlEscape(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""}\n  </url>`;
}

function urlset(entries) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
}

function sitemapIndex(names) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${names.map((name) => `  <sitemap>\n    <loc>${SITE_URL}/sitemaps/${name}</loc>\n  </sitemap>`).join("\n")}\n</sitemapindex>\n`;
}

async function main() {
  const outputDir = path.resolve(process.argv[2] || path.join(__dirname, "..", "public"));
  const reportPath = process.argv[3] ? path.resolve(process.argv[3]) : null;
  const domains = await Promise.all([fetchDomain("current"), fetchDomain("historical")]);
  const servingTotal = domains.reduce((sum, domain) => sum + domain.total, 0);
  const movies = domains.flatMap((domain) => domain.rows);
  const byId = new Map();
  const seenUrls = new Set();
  let duplicateUrls = 0;
  let wrongHostUrls = 0;
  let previewUrls = 0;
  let railwayUrls = 0;
  let malformedUrls = 0;
  let missingRouteKeyCount = 0;
  for (const movie of movies) {
    const id = movie.canonical_movie_id || movie.movie_id || movie.id;
    const entry = sitemapEntry(movie);
    if (!entry) {
      missingRouteKeyCount += 1;
      continue;
    }
    if (id && byId.has(String(id))) throw new Error(`Duplicate serving canonical movie id: ${id}`);
    const loc = entry.match(/<loc>(.*?)<\/loc>/)?.[1];
    if (!loc || !/^https:\/\/www\.flixyfy\.com\/movie\/[^\s<>]+$/.test(loc)) malformedUrls += 1;
    if (loc && seenUrls.has(loc)) duplicateUrls += 1;
    if (loc) seenUrls.add(loc);
    if (loc && !loc.startsWith(`${SITE_URL}/`)) wrongHostUrls += 1;
    if (loc && /vercel\.app|preview/i.test(loc)) previewUrls += 1;
    if (loc && /railway/i.test(loc)) railwayUrls += 1;
    if (id) byId.set(String(id), entry);
  }
  if (missingRouteKeyCount) throw new Error(`Serving rows missing an indexable movie route: ${missingRouteKeyCount}`);
  if (duplicateUrls || wrongHostUrls || previewUrls || railwayUrls || malformedUrls) {
    throw new Error(`Generated sitemap validation failed: ${JSON.stringify({ duplicateUrls, wrongHostUrls, previewUrls, railwayUrls, malformedUrls })}`);
  }

  const movieEntries = [...byId.values()].sort((left, right) => left.localeCompare(right));
  if (movieEntries.length > 50_000) throw new Error(`Movie sitemap exceeds 50,000 URL limit: ${movieEntries.length}`);
  const coreEntries = CORE_PATHS.map((url) => `  <url>\n    <loc>${SITE_URL}${url}</loc>\n  </url>`);
  const movieMap = urlset(movieEntries);
  const index = sitemapIndex(["core.xml", "movies_1.xml"]);

  await fs.mkdir(path.join(outputDir, "sitemaps"), { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(outputDir, "sitemaps", "core.xml"), urlset(coreEntries), "utf8"),
    fs.writeFile(path.join(outputDir, "sitemaps", "movies_1.xml"), movieMap, "utf8"),
    fs.writeFile(path.join(outputDir, "sitemap.xml"), index, "utf8"),
    fs.writeFile(path.join(outputDir, "sitemap_index.xml"), index, "utf8"),
    fs.rm(path.join(outputDir, "sitemaps", "languages.xml"), { force: true }),
  ]);

  const report = {
    source: `${API_BASE}/api/v4/movies`,
    domains: { current: domains[0].total, historical: domains[1].total },
    serving_movie_count: servingTotal,
    sitemap_movie_url_count: movieEntries.length,
    missing_from_sitemap: servingTotal - movieEntries.length,
    extra_in_sitemap: movieEntries.length - servingTotal,
    duplicate_urls: duplicateUrls,
    wrong_host_urls: wrongHostUrls,
    preview_urls: previewUrls,
    railway_urls: railwayUrls,
    malformed_urls: malformedUrls,
    future_unpublished_candidate_urls: byId.has("TMDB:1441228") ? 1 : 0,
    core_url_count: coreEntries.length,
    lastmod_policy: "Only valid serving-row updated_at values are emitted; no generated or constant dates are used.",
  };
  if (reportPath) {
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");
  }
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
}

if (require.main === module) main().catch((error) => {
  process.stderr.write(`${error.stack || error}\n`);
  process.exitCode = 1;
});

module.exports = { CORE_PATHS, getRouteKey, main, sitemapEntry, urlset };
