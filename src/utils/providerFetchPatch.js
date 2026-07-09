
// FLIXYFY_FILTER_RESTORE_WEBseries_SPEED_V5
// Runtime helpers only. Keeps real React filters; hides only duplicate All Titles/All Movies select.
// Adds cached GET reads, provider normalization, Indian heading count, Free-to-watch -> YouTube default.

const PROVIDER_ALIASES = {
  "": "all", all: "all", "all provider": "all", "all providers": "all", all_provider: "all", all_providers: "all",
  youtube: "youtube", yt: "youtube", "you tube": "youtube",
  netflix: "netflix",
  prime: "prime_video", "prime video": "prime_video", primevideo: "prime_video", prime_video: "prime_video", "amazon prime": "prime_video", "amazon prime video": "prime_video", amazon_prime_video: "prime_video", amazon_prime_video_with_ads: "prime_video",
  jiohotstar: "jiohotstar", "jio hotstar": "jiohotstar", hotstar: "jiohotstar", "disney hotstar": "jiohotstar",
  zee5: "zee5", "zee 5": "zee5",
  sonyliv: "sonyliv", "sony liv": "sonyliv",
  aha: "aha",
  sunnxt: "sun_nxt", "sun nxt": "sun_nxt", sun_nxt: "sun_nxt",
  etvwin: "etv_win", "etv win": "etv_win", etv_win: "etv_win",
  mxplayer: "mx_player", "mx player": "mx_player", mx_player: "mx_player", amazon_mx_player: "mx_player",
  shemaroome: "shemaroome", "shemaroo me": "shemaroome",
  "eros now": "eros_now", eros_now: "eros_now",
  "apple tv": "apple_tv_store", appletv: "apple_tv_store", apple_tv: "apple_tv_store", "apple tv store": "apple_tv_store", apple_tv_store: "apple_tv_store", itunes: "apple_tv_store",
  "amazon video": "amazon_video", amazon_video: "amazon_video",
  "google tv": "google_tv", google_tv: "google_tv", "google play": "google_tv",
  disney: "disney_plus", "disney+": "disney_plus", "disney plus": "disney_plus", disney_plus: "disney_plus",
  hulu: "hulu", max: "max", "hbo max": "max", hbo_max: "max", plex: "plex",
  viki: "viki", "rakuten viki": "viki", kocowa: "kocowa", tving: "tving", wavve: "wavve", watcha: "watcha",
  "coupang play": "coupang_play", coupang_play: "coupang_play",
  tubi: "tubi_tv", "tubi tv": "tubi_tv", tubi_tv: "tubi_tv",
};

const PROVIDER_LABELS = {
  all: "All Providers", youtube: "YouTube", netflix: "Netflix", prime_video: "Prime Video", jiohotstar: "JioHotstar", zee5: "ZEE5", sonyliv: "SonyLIV", aha: "Aha", sun_nxt: "Sun NXT", etv_win: "ETV Win", mx_player: "MX Player", shemaroome: "ShemarooMe", eros_now: "Eros Now", apple_tv_store: "Apple TV", amazon_video: "Amazon Video", google_tv: "Google TV", disney_plus: "Disney+", hulu: "Hulu", max: "Max", plex: "Plex", viki: "Rakuten Viki", kocowa: "Kocowa", tving: "TVING", wavve: "Wavve", watcha: "Watcha", coupang_play: "Coupang Play", tubi_tv: "Tubi",
};

const CACHE = new Map();
const INFLIGHT = new Map();
const DEFAULT_TTL_MS = 60000;
const DEFAULT_TIMEOUT_MS = 12000;
const API_BASE = (typeof import.meta !== "undefined" && import.meta.env && import.meta.env.VITE_API_BASE_URL) || "https://flixyfy-api-production.up.railway.app";

function clean(value) {
  return String(value || "").trim().toLowerCase().replace(/[+]/g, " plus ").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

export function normalizeProviderForApi(value) {
  const raw = clean(value);
  if (Object.prototype.hasOwnProperty.call(PROVIDER_ALIASES, raw)) return PROVIDER_ALIASES[raw];
  const key = raw.replace(/\s+/g, "_");
  if (Object.prototype.hasOwnProperty.call(PROVIDER_ALIASES, key)) return PROVIDER_ALIASES[key];
  return key || "all";
}

export function providerValueForState(value) {
  const provider = normalizeProviderForApi(value);
  return provider === "all" ? "" : provider;
}

export function providerDisplayLabel(value) {
  const provider = normalizeProviderForApi(value);
  return PROVIDER_LABELS[provider] || String(provider || "").replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

export function providerFromCurrentUrl() {
  if (typeof window === "undefined") return "";
  const params = new URLSearchParams(window.location.search || "");
  return providerValueForState(params.get("provider") || params.get("provider_key") || "");
}

export function syncProviderToUrl(value) {
  if (typeof window === "undefined") return;
  const provider = providerValueForState(value);
  const url = new URL(window.location.href);
  if (provider) url.searchParams.set("provider", provider);
  else url.searchParams.delete("provider");
  window.history.replaceState({}, "", `${url.pathname}${url.search}${url.hash}`);
}

function cacheKey(url) {
  const parsed = new URL(String(url), typeof window !== "undefined" ? window.location.origin : "https://flixyfy.com");
  parsed.searchParams.sort();
  return parsed.toString();
}

export async function fetchFlixyfyJson(url, options = {}) {
  const key = cacheKey(url);
  const now = Date.now();
  const cached = CACHE.get(key);
  if (cached && cached.expiresAt > now) return cached.data;
  if (INFLIGHT.has(key)) return INFLIGHT.get(key);

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), Number(options.timeoutMs || DEFAULT_TIMEOUT_MS));
  const promise = fetch(url, { cache: "no-store", headers: { Accept: "application/json", ...(options.headers || {}) }, signal: controller.signal })
    .then(async (res) => {
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`API ${res.status}: ${String(url)} ${text.slice(0, 240)}`);
      }
      return res.json();
    })
    .then((data) => {
      CACHE.set(key, { data, expiresAt: Date.now() + Number(options.ttlMs || DEFAULT_TTL_MS) });
      return data;
    })
    .finally(() => { window.clearTimeout(timer); INFLIGHT.delete(key); });
  INFLIGHT.set(key, promise);
  return promise;
}

function selectText(select) {
  return Array.from(select?.options || []).map((o) => `${o.value || ""} ${o.textContent || ""}`).join(" ").toLowerCase();
}

function selectedText(select) {
  const option = select?.selectedOptions?.[0];
  return `${option?.value || ""} ${option?.textContent || ""}`.toLowerCase();
}

function isDuplicateTitleSelect(select) {
  const text = selectText(select);
  return (text.includes("all titles") || text.includes("all movies")) && (text.includes("free") || text.includes("ott") || text.includes("streaming"));
}

function isProviderSelect(select) {
  const text = selectText(select);
  return text.includes("netflix") && (text.includes("prime") || text.includes("youtube") || text.includes("zee5"));
}

function hideDuplicateTitleFilter() {
  document.querySelectorAll("select").forEach((select) => {
    if (!isDuplicateTitleSelect(select)) return;
    const wrapper = select.closest("label, .filter, .filter-control, .filter-select, .select-wrap, .controls select") || select.parentElement || select;
    wrapper.style.display = "none";
    wrapper.setAttribute("data-flixyfy-hidden-duplicate-title-filter", "true");
  });
}

function forceYoutubeProvider() {
  const providerSelect = Array.from(document.querySelectorAll("select")).find(isProviderSelect);
  if (!providerSelect) return;
  const youtubeOption = Array.from(providerSelect.options || []).find((option) => normalizeProviderForApi(option.value || option.textContent) === "youtube");
  if (!youtubeOption || providerSelect.value === youtubeOption.value) return;
  providerSelect.value = youtubeOption.value;
  providerSelect.dispatchEvent(new Event("change", { bubbles: true }));
}

function syncFreeToWatchProvider() {
  const freeSelected = Array.from(document.querySelectorAll("select")).some((select) => {
    if (isProviderSelect(select)) return false;
    const text = selectedText(select);
    return text.includes("free") || text.includes("free to watch");
  });
  if (freeSelected) window.setTimeout(forceYoutubeProvider, 0);
}

let headingTimer = null;
function updateIndianHeadingCount() {
  window.clearTimeout(headingTimer);
  headingTimer = window.setTimeout(async () => {
    const path = window.location.pathname.replace(/\/$/, "");
    if (path && path !== "/" && path !== "/indian") return;
    const headings = Array.from(document.querySelectorAll("h1,h2,h3"));
    const heading = headings.find((h) => /^indian movies(\s*\(|$)/i.test((h.textContent || "").trim()));
    if (!heading) return;
    const activeTabText = (document.querySelector(".active, [aria-selected='true']")?.textContent || "").toLowerCase();
    if (activeTabText && !activeTabText.includes("movie") && !/^indian movies/i.test(heading.textContent || "")) return;
    const providerSelect = Array.from(document.querySelectorAll("select")).find(isProviderSelect);
    const provider = providerValueForState(providerSelect?.value || providerFromCurrentUrl());
    const url = new URL(`${API_BASE}/api/v3/movies`);
    url.searchParams.set("page", "1");
    url.searchParams.set("limit", "1");
    if (provider) url.searchParams.set("provider", provider);
    const data = await fetchFlixyfyJson(url.toString(), { ttlMs: 120000, timeoutMs: 10000 }).catch(() => null);
    const total = Number(data?.total || 0);
    if (!total) return;
    const label = provider ? `${providerDisplayLabel(provider)} - Indian Movies` : "Indian Movies";
    heading.textContent = `${label} (${total.toLocaleString("en-IN")})`;
  }, 120);
}

function runDomFixes() {
  hideDuplicateTitleFilter();
  syncFreeToWatchProvider();
  updateIndianHeadingCount();
}

export function installProviderFetchPatch() {
  if (typeof document === "undefined") return { active: false, version: "v5" };
  if (window.__FLIXYFY_PROVIDER_PATCH_V5__) return { active: false, version: "v5" };
  window.__FLIXYFY_PROVIDER_PATCH_V5__ = true;
  document.addEventListener("change", () => window.setTimeout(runDomFixes, 0), true);
  window.addEventListener("popstate", () => window.setTimeout(runDomFixes, 0));
  const observer = new MutationObserver(() => runDomFixes());
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.setTimeout(runDomFixes, 0);
  window.setTimeout(runDomFixes, 500);
  window.setTimeout(runDomFixes, 1500);
  return { active: true, version: "v5" };
}

export default installProviderFetchPatch;
