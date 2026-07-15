// FLIXYFY_FILTER_RESTORE_V6_EXACT
// Runtime UI stabilizer + provider normalization + cached JSON reads.
// Purpose:
// - Restore only behavior, not destructive JSX changes.
// - Hide only duplicate All Titles / All Movies select.
// - Keep Language / Year / Sort / Provider filters visible.
// - Free to Watch selects YouTube provider.
// - Home heading is Indian Movies (full count).
// - Small GET cache/dedupe for faster repeat clicks.

const PROVIDER_ALIASES = {
  "": "all",
  all: "all",
  "all provider": "all",
  "all providers": "all",
  all_provider: "all",
  all_providers: "all",
  youtube: "youtube",
  "you tube": "youtube",
  yt: "youtube",
  netflix: "netflix",
  prime: "prime_video",
  "prime video": "prime_video",
  primevideo: "prime_video",
  prime_video: "prime_video",
  "amazon prime": "prime_video",
  "amazon prime video": "prime_video",
  amazon_prime_video: "prime_video",
  amazon_prime_video_with_ads: "prime_video",
  jiohotstar: "jiohotstar",
  "jio hotstar": "jiohotstar",
  hotstar: "jiohotstar",
  "disney hotstar": "jiohotstar",
  zee5: "zee5",
  "zee 5": "zee5",
  sonyliv: "sonyliv",
  "sony liv": "sonyliv",
  aha: "aha",
  sunnxt: "sun_nxt",
  "sun nxt": "sun_nxt",
  sun_nxt: "sun_nxt",
  etvwin: "etv_win",
  "etv win": "etv_win",
  etv_win: "etv_win",
  mxplayer: "mx_player",
  "mx player": "mx_player",
  mx_player: "mx_player",
  "apple tv": "apple_tv_store",
  apple_tv: "apple_tv_store",
  "apple tv store": "apple_tv_store",
  apple_tv_store: "apple_tv_store",
  itunes: "apple_tv_store",
  "amazon video": "amazon_video",
  amazon_video: "amazon_video",
  "google tv": "google_tv",
  google_tv: "google_tv",
  "google play": "google_tv",
  disney: "disney_plus",
  "disney+": "disney_plus",
  "disney plus": "disney_plus",
  disney_plus: "disney_plus",
  hulu: "hulu",
  max: "max",
  "hbo max": "max",
  hbo_max: "max",
  plex: "plex",
  viki: "viki",
  "rakuten viki": "viki",
  kocowa: "kocowa",
  tving: "tving",
  wavve: "wavve",
  watcha: "watcha",
  "coupang play": "coupang_play",
  coupang_play: "coupang_play",
  tubi: "tubi_tv",
  "tubi tv": "tubi_tv",
  tubi_tv: "tubi_tv"
};

const PROVIDER_LABELS = {
  all: "All Providers",
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
  apple_tv_store: "Apple TV",
  amazon_video: "Amazon Video",
  google_tv: "Google TV",
  disney_plus: "Disney+",
  hulu: "Hulu",
  max: "Max",
  plex: "Plex",
  viki: "Rakuten Viki",
  kocowa: "Kocowa",
  tving: "TVING",
  wavve: "Wavve",
  watcha: "Watcha",
  coupang_play: "Coupang Play",
  tubi_tv: "Tubi"
};

const CACHE = new Map();
const INFLIGHT = new Map();
const DEFAULT_TTL_MS = 60000;
const DEFAULT_TIMEOUT_MS = 12000;

function clean(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[+]/g, " plus ")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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

  const promise = fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json", ...(options.headers || {}) },
    signal: controller.signal
  })
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
    .finally(() => {
      window.clearTimeout(timer);
      INFLIGHT.delete(key);
    });

  INFLIGHT.set(key, promise);
  return promise;
}

function selectedText(select) {
  const option = select?.selectedOptions?.[0];
  return `${select?.value || ""} ${option?.value || ""} ${option?.textContent || ""}`.toLowerCase().trim();
}

function optionTexts(select) {
  return Array.from(select?.options || []).map((option) => `${option.value || ""} ${option.textContent || ""}`.toLowerCase());
}

function isDuplicateTypeSelect(select) {
  if (!select || select.tagName !== "SELECT") return false;
  const opts = optionTexts(select);
  const hasTitleOption = opts.some((x) => x.includes("all titles") || x.includes("all movies"));
  const hasProviderOption = opts.some((x) => normalizeProviderForApi(x) === "netflix" || normalizeProviderForApi(x) === "youtube");
  const hasYearOption = opts.some((x) => x.includes("all years"));
  const hasLanguageOption = opts.some((x) => x.includes("all indian languages"));
  return hasTitleOption && !hasProviderOption && !hasYearOption && !hasLanguageOption;
}

function hideDuplicateTitleFilter() {
  document.querySelectorAll("select").forEach((select) => {
    if (!isDuplicateTypeSelect(select)) return;
    select.setAttribute("data-flixyfy-hidden-duplicate-title-filter", "true");
    select.style.display = "none";
    select.style.visibility = "hidden";
    select.style.pointerEvents = "none";
    const wrapper = select.closest(".filter-control, .filter-select, .home-filter, .domain-filter, label");
    if (wrapper && wrapper !== document.body) {
      wrapper.setAttribute("data-flixyfy-hidden-duplicate-title-filter", "true");
      wrapper.style.display = "none";
      wrapper.style.visibility = "hidden";
      wrapper.style.pointerEvents = "none";
    }
  });
}

function isProviderSelect(select) {
  if (!select || select.tagName !== "SELECT") return false;
  const opts = optionTexts(select);
  return opts.some((x) => normalizeProviderForApi(x) === "youtube")
    && opts.some((x) => normalizeProviderForApi(x) === "netflix");
}

function isFreeSelect(select) {
  if (!select || select.tagName !== "SELECT") return false;
  if (isProviderSelect(select)) return false;
  const text = selectedText(select);
  return text.includes("free") || text.includes("free to watch") || text.includes("youtube only");
}

function setProviderToYouTube() {
  const providerSelect = Array.from(document.querySelectorAll("select")).find(isProviderSelect);
  if (!providerSelect) return;
  const youtubeOption = Array.from(providerSelect.options || []).find((option) => normalizeProviderForApi(option.value || option.textContent) === "youtube");
  if (!youtubeOption) return;
  if (providerSelect.value !== youtubeOption.value) {
    providerSelect.value = youtubeOption.value;
    providerSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

async function fixIndianHeadingCount() {
  const path = window.location.pathname.replace(/\/+$/, "");
  if (path !== "") return;
  const headings = Array.from(document.querySelectorAll("h1,h2,h3"));
  const target = headings.find((h) => /^(popular movies|indian movies)(\s*\(|$)/i.test((h.textContent || "").trim()));
  if (!target) return;
  if (/Indian Movies\s*\(\s*[\d,]+\s*\)/i.test(target.textContent || "")) return;

  try {
    const data = await fetchFlixyfyJson("https://flixyfy-api-fresh-production.up.railway.app/api/v4/movies?page=1&limit=1", { ttlMs: 300000, timeoutMs: 8000 });
    const total = Number(data?.total || 0);
    target.textContent = total > 0 ? `Indian Movies (${total.toLocaleString("en-IN")})` : "Indian Movies";
  } catch (_) {
    target.textContent = "Indian Movies";
  }
}

function runUiStabilizer() {
  hideDuplicateTitleFilter();
  fixIndianHeadingCount();
}

export function installProviderFetchPatch() {
  if (typeof document === "undefined") return { active: false, version: "restore-v6" };
  if (window.__FLIXYFY_FILTER_RESTORE_V6__) return { active: false, version: "restore-v6" };
  window.__FLIXYFY_FILTER_RESTORE_V6__ = true;

  runUiStabilizer();
  window.setTimeout(runUiStabilizer, 50);
  window.setTimeout(runUiStabilizer, 300);
  window.setTimeout(runUiStabilizer, 1000);

  const observer = new MutationObserver(() => runUiStabilizer());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  document.addEventListener("change", (event) => {
    const target = event.target;
    if (target && target.tagName === "SELECT" && isFreeSelect(target)) {
      window.setTimeout(setProviderToYouTube, 0);
    }
    window.setTimeout(runUiStabilizer, 0);
  }, true);

  return { active: true, version: "restore-v6" };
}

export default installProviderFetchPatch;
