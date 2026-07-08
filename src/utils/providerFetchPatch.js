// FLIXYFY_FRONTEND_HOME_PROVIDER_DOM_BRIDGE_V8
// Frontend-only browser bridge for Home provider filters.
// No backend mutation. No DB mutation. No DDL. Production serving remains v5-only.

const FLIXYFY_PROVIDER_PATCH_VERSION = "FLIXYFY_FRONTEND_HOME_PROVIDER_DOM_BRIDGE_V8";

const PROVIDER_ALIASES = {
  "": "all",
  "all": "all",
  "all providers": "all",
  "all_provider": "all",
  "all_providers": "all",
  "youtube": "youtube",
  "you tube": "youtube",
  "netflix": "netflix",
  "prime": "prime_video",
  "prime video": "prime_video",
  "prime_video": "prime_video",
  "amazon prime": "prime_video",
  "amazon prime video": "prime_video",
  "jiohotstar": "jiohotstar",
  "jio hotstar": "jiohotstar",
  "hotstar": "jiohotstar",
  "disney hotstar": "jiohotstar",
  "zee5": "zee5",
  "zee 5": "zee5",
  "sonyliv": "sonyliv",
  "sony liv": "sonyliv",
  "aha": "aha",
  "sun nxt": "sun_nxt",
  "sunnxt": "sun_nxt",
  "sun_nxt": "sun_nxt",
  "etv win": "etv_win",
  "etv_win": "etv_win",
  "mx player": "mx_player",
  "mxplayer": "mx_player",
  "mx_player": "mx_player",
  "shemaroome": "shemaroome",
  "shemaroo me": "shemaroome",
  "eros now": "eros_now",
  "eros_now": "eros_now",
  "apple tv": "apple_tv_store",
  "apple_tv": "apple_tv_store",
  "apple tv store": "apple_tv_store",
  "apple_tv_store": "apple_tv_store",
  "amazon video": "amazon_video",
  "amazon_video": "amazon_video",
  "google tv": "google_tv",
  "google_tv": "google_tv",
  "google play": "google_play_movies",
  "google_play_movies": "google_play_movies",
  "hulu": "hulu",
  "max": "max",
  "plex": "plex",
  "tubi": "tubi_tv",
  "tubi tv": "tubi_tv",
  "tubi_tv": "tubi_tv"
};

const PROVIDER_LABELS = {
  youtube: "YouTube",
  netflix: "Netflix",
  prime_video: "Prime Video",
  jiohotstar: "JioHotstar",
  zee5: "ZEE5",
  sonyliv: "SonyLIV",
  aha: "Aha",
  sun_nxt: "Sun NXT",
  etv_win: "ETV Win",
  mx_player: "MX Player",
  shemaroome: "ShemarooMe",
  eros_now: "Eros Now",
  apple_tv_store: "Apple TV",
  amazon_video: "Amazon Video",
  google_tv: "Google TV",
  google_play_movies: "Google Play",
  hulu: "Hulu",
  max: "Max",
  plex: "Plex",
  tubi_tv: "Tubi"
};

export function normalizeProviderForApi(value) {
  const raw = String(value || "").trim();
  const lower = raw.toLowerCase().replace(/[+]/g, " plus ").replace(/[\s-]+/g, " ").trim();
  if (Object.prototype.hasOwnProperty.call(PROVIDER_ALIASES, lower)) return PROVIDER_ALIASES[lower];
  const compact = lower.replace(/\s+/g, "_");
  if (Object.prototype.hasOwnProperty.call(PROVIDER_ALIASES, compact)) return PROVIDER_ALIASES[compact];
  return compact || "all";
}

function providerLabel(provider) {
  const key = normalizeProviderForApi(provider);
  return PROVIDER_LABELS[key] || String(provider || "").replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function apiBase() {
  const envBase = typeof import.meta !== "undefined" && import.meta.env ? import.meta.env.VITE_API_BASE_URL : "";
  return (envBase || "https://flixyfy-api-production.up.railway.app").replace(/\/$/, "");
}

function isProviderKey(value) {
  const key = normalizeProviderForApi(value);
  return key && key !== "all" && key !== "popular" && key !== "latest" && key !== "movies" && key !== "all_titles";
}

function readProviderFromUrl() {
  try {
    const u = new URL(window.location.href);
    return normalizeProviderForApi(u.searchParams.get("provider") || u.searchParams.get("provider_key") || "all");
  } catch (_) {
    return "all";
  }
}

function readProviderFromSelects() {
  const selects = Array.from(document.querySelectorAll("select"));
  for (const select of selects) {
    const option = select.options && select.selectedIndex >= 0 ? select.options[select.selectedIndex] : null;
    const text = (option ? option.textContent : select.value || "").trim();
    const value = (select.value || text || "").trim();
    const joined = `${value} ${text}`.toLowerCase();
    const looksProvider = /provider|youtube|netflix|prime|hotstar|zee5|sonyliv|aha|sun|mx|shemaroo|eros|apple|amazon|google|hulu|plex|tubi/.test(joined);
    if (looksProvider) {
      const key = normalizeProviderForApi(value || text);
      if (isProviderKey(key)) return key;
    }
  }
  return "all";
}

function currentProvider() {
  const fromUrl = readProviderFromUrl();
  if (isProviderKey(fromUrl)) return fromUrl;
  const fromSelect = readProviderFromSelects();
  if (isProviderKey(fromSelect)) return fromSelect;
  return "all";
}

function isHomePath() {
  return window.location.pathname === "/" || window.location.pathname === "";
}

function normalizeMovie(item, provider) {
  const label = providerLabel(provider);
  return {
    ...item,
    domain: item.domain || item.source_domain || "current",
    source_domain: item.source_domain || item.domain || "current",
    movie_url: item.movie_url || (item.slug ? `/movie/${item.slug}` : "#"),
    ott_primary: item.ott_primary || label,
    ott_primary_key: item.ott_primary_key || provider,
    watch_providers: item.watch_providers || item.availability || [
      { provider_key: provider, provider_display_name: label, provider_name: label }
    ],
    availability: item.availability || item.watch_providers || [
      { provider_key: provider, provider_display_name: label, provider_name: label }
    ]
  };
}

function homePayloadFromMovies(data, provider) {
  const items = Array.isArray(data?.items) ? data.items.map((x) => normalizeMovie(x, provider)) : [];
  const label = providerLabel(provider);
  const total = Number(data?.total || items.length || 0);
  const section = {
    key: `provider_${provider}`,
    id: `provider_${provider}`,
    title: `${label} - Popular Movies`,
    heading: `${label} - Popular Movies`,
    items,
    movies: items,
    total
  };
  return {
    ...data,
    source: "home_provider_bridge_v8",
    provider,
    total,
    count: items.length,
    items,
    movies: items,
    results: items,
    sections: [section],
    trending: items,
    popular: items,
    latest: items,
    free: items,
    hindi: items,
    telugu: items,
    tamil: items,
    provider_section: section
  };
}

function normalizeUrlProvider(url) {
  try {
    const parsed = new URL(url, window.location.origin);
    const raw = parsed.searchParams.get("provider") || parsed.searchParams.get("provider_key");
    const provider = normalizeProviderForApi(raw);
    parsed.searchParams.delete("provider_key");
    if (provider && provider !== "all") parsed.searchParams.set("provider", provider);
    else parsed.searchParams.delete("provider");
    return parsed;
  } catch (_) {
    return null;
  }
}

function makeJsonResponse(payload, originalResponse) {
  const headers = new Headers(originalResponse?.headers || {});
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("x-flixyfy-provider-bridge", FLIXYFY_PROVIDER_PATCH_VERSION);
  return new Response(JSON.stringify(payload), {
    status: 200,
    statusText: "OK",
    headers
  });
}

function shouldBridgeHomeRequest(parsed) {
  if (!parsed) return false;
  const provider = normalizeProviderForApi(parsed.searchParams.get("provider") || parsed.searchParams.get("provider_key"));
  return parsed.pathname.endsWith("/api/v3/home") && isProviderKey(provider);
}

function installFetchBridge() {
  if (window.__FLIXYFY_PROVIDER_FETCH_PATCH_V8_INSTALLED__) return;
  window.__FLIXYFY_PROVIDER_FETCH_PATCH_V8_INSTALLED__ = true;
  const originalFetch = window.fetch.bind(window);

  window.fetch = async function flixyfyProviderFetch(input, init) {
    const rawUrl = typeof input === "string" ? input : (input && input.url ? input.url : String(input));
    const parsed = normalizeUrlProvider(rawUrl);

    if (shouldBridgeHomeRequest(parsed)) {
      const provider = normalizeProviderForApi(parsed.searchParams.get("provider") || parsed.searchParams.get("provider_key"));
      const limit = parsed.searchParams.get("limit") || "36";
      const page = parsed.searchParams.get("page") || "1";
      const moviesUrl = `${apiBase()}/api/v3/movies?provider=${encodeURIComponent(provider)}&limit=${encodeURIComponent(limit)}&page=${encodeURIComponent(page)}`;
      const resp = await originalFetch(moviesUrl, init);
      const data = await resp.clone().json();
      return makeJsonResponse(homePayloadFromMovies(data, provider), resp);
    }

    if (parsed && (parsed.pathname.includes("/api/v3/") || parsed.href.includes("flixyfy-api"))) {
      const provider = normalizeProviderForApi(parsed.searchParams.get("provider") || parsed.searchParams.get("provider_key"));
      if (isProviderKey(provider)) {
        parsed.searchParams.delete("provider_key");
        parsed.searchParams.set("provider", provider);
        if (typeof input === "string") return originalFetch(parsed.href, init);
        try {
          return originalFetch(new Request(parsed.href, input), init);
        } catch (_) {
          return originalFetch(parsed.href, init);
        }
      }
    }

    return originalFetch(input, init);
  };
}

function cardHtml(item, provider) {
  const title = escapeHtml(item.title || item.original_title || "Untitled");
  const year = item.release_year || item.year || "";
  const img = item.poster_url || item.poster || item.poster_path || "";
  const href = item.movie_url || (item.slug ? `/movie/${item.slug}` : "#");
  const pLabel = providerLabel(provider);
  const poster = img
    ? `<img src="${escapeAttr(img)}" alt="${escapeAttr(title)}" loading="lazy" decoding="async" />`
    : `<div class="flixyfy-provider-bridge-v8-poster-fallback">${title.slice(0, 1)}</div>`;
  return `<a class="flixyfy-provider-bridge-v8-card" href="${escapeAttr(href)}">
    <div class="flixyfy-provider-bridge-v8-poster">${poster}</div>
    <div class="flixyfy-provider-bridge-v8-title">${title}</div>
    <div class="flixyfy-provider-bridge-v8-meta">${escapeHtml(String(year || ""))}${year ? " · " : ""}${escapeHtml(pLabel)}</div>
  </a>`;
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function ensureStyle() {
  if (document.getElementById("flixyfy-provider-bridge-v8-style")) return;
  const style = document.createElement("style");
  style.id = "flixyfy-provider-bridge-v8-style";
  style.textContent = `
    #flixyfy-provider-bridge-v8 { margin: 28px auto 48px; width: min(1180px, calc(100vw - 28px)); }
    #flixyfy-provider-bridge-v8 h2 { color: #fff; font-size: 28px; line-height: 1.2; margin: 0 0 18px; font-weight: 900; }
    .flixyfy-provider-bridge-v8-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(155px, 1fr)); gap: 20px 18px; align-items: start; }
    .flixyfy-provider-bridge-v8-card { color: #fff; text-decoration: none; display: block; min-width: 0; }
    .flixyfy-provider-bridge-v8-card:hover { transform: translateY(-2px); }
    .flixyfy-provider-bridge-v8-poster { width: 100%; aspect-ratio: 2 / 3; border-radius: 10px; overflow: hidden; background: #05070b; box-shadow: 0 10px 24px rgba(0,0,0,.35); }
    .flixyfy-provider-bridge-v8-poster img { width: 100%; height: 100%; object-fit: cover; display: block; }
    .flixyfy-provider-bridge-v8-poster-fallback { width: 100%; height: 100%; display: grid; place-items: center; font-size: 52px; background: #101827; }
    .flixyfy-provider-bridge-v8-title { margin-top: 9px; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .flixyfy-provider-bridge-v8-meta { margin-top: 3px; color: #a9c8d8; font-size: 13px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    @media (max-width: 600px) {
      #flixyfy-provider-bridge-v8 { width: calc(100vw - 20px); }
      .flixyfy-provider-bridge-v8-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px 12px; }
      #flixyfy-provider-bridge-v8 h2 { font-size: 24px; }
    }
  `;
  document.head.appendChild(style);
}

function findInsertPoint() {
  const existing = document.getElementById("flixyfy-provider-bridge-v8");
  if (existing) return existing;
  const footer = document.querySelector("footer");
  if (footer && footer.parentNode) return footer;
  const headings = Array.from(document.querySelectorAll("h1,h2,h3"));
  const popular = headings.find((h) => /popular movies|netflix|prime video|youtube/i.test(h.textContent || ""));
  if (popular && popular.parentNode) return popular.nextSibling || popular;
  return document.body.lastChild;
}

function hideStaleEmptyProviderBlock(provider, total) {
  if (!isProviderKey(provider) || total <= 0) return;
  const label = providerLabel(provider).toLowerCase();
  Array.from(document.querySelectorAll("h1,h2,h3")).forEach((node) => {
    const t = (node.textContent || "").toLowerCase();
    if (t.includes(label) && t.includes("popular movies")) {
      node.style.display = "none";
      node.setAttribute("data-flixyfy-provider-bridge-hidden", "1");
    }
  });
  Array.from(document.querySelectorAll("p,div,span")).forEach((node) => {
    const t = (node.textContent || "").trim().toLowerCase();
    if (t === "no movies found." || t === "no movies found") {
      node.style.display = "none";
      node.setAttribute("data-flixyfy-provider-bridge-hidden", "1");
    }
  });
}

async function renderHomeProviderResults() {
  if (!isHomePath()) return;
  const provider = currentProvider();
  const old = document.getElementById("flixyfy-provider-bridge-v8");
  if (!isProviderKey(provider)) {
    if (old) old.remove();
    return;
  }

  try {
    const url = `${apiBase()}/api/v3/movies?provider=${encodeURIComponent(provider)}&limit=36&page=1&flixyfy_bridge_v8=1`;
    const resp = await fetch(url, { cache: "no-store" });
    if (!resp.ok) return;
    const data = await resp.json();
    const items = Array.isArray(data?.items) ? data.items : [];
    const total = Number(data?.total || items.length || 0);
    if (!items.length) return;

    ensureStyle();
    hideStaleEmptyProviderBlock(provider, total);

    let section = old;
    if (!section) {
      section = document.createElement("section");
      section.id = "flixyfy-provider-bridge-v8";
      const insertPoint = findInsertPoint();
      if (insertPoint && insertPoint.parentNode) insertPoint.parentNode.insertBefore(section, insertPoint);
      else document.body.appendChild(section);
    }

    section.innerHTML = `<h2>${escapeHtml(providerLabel(provider))} - Popular Movies (${total})</h2><div class="flixyfy-provider-bridge-v8-grid">${items.map((x) => cardHtml(x, provider)).join("")}</div>`;
  } catch (err) {
    console.warn("FLIXYFY home provider bridge v8 failed", err);
  }
}

function scheduleRender() {
  window.clearTimeout(window.__FLIXYFY_PROVIDER_BRIDGE_V8_TIMER__);
  window.__FLIXYFY_PROVIDER_BRIDGE_V8_TIMER__ = window.setTimeout(renderHomeProviderResults, 80);
}

function installDomBridge() {
  if (window.__FLIXYFY_PROVIDER_DOM_BRIDGE_V8_INSTALLED__) return;
  window.__FLIXYFY_PROVIDER_DOM_BRIDGE_V8_INSTALLED__ = true;
  window.addEventListener("load", scheduleRender);
  window.addEventListener("popstate", scheduleRender);
  window.addEventListener("hashchange", scheduleRender);
  document.addEventListener("change", (event) => {
    if (event.target && event.target.tagName === "SELECT") scheduleRender();
  }, true);
  document.addEventListener("click", () => scheduleRender(), true);
  const observer = new MutationObserver(() => scheduleRender());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  scheduleRender();
}

export function installProviderFetchPatch() {
  installFetchBridge();
  installDomBridge();
  window.FLIXYFY_PROVIDER_FETCH_PATCH_VERSION = FLIXYFY_PROVIDER_PATCH_VERSION;
}

export const installHomeProviderBridgeV8 = installProviderFetchPatch;

if (typeof window !== "undefined") {
  window.FLIXYFY_PROVIDER_FETCH_PATCH_VERSION = FLIXYFY_PROVIDER_PATCH_VERSION;
}
