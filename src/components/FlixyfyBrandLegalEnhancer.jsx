"use client";

import Link from "next/link";
import { useEffect } from "react";

const BRAND_SRC = "/brand/flixyfy-primary-emblem.png";
const STYLE_ID = "flixyfy-search-provider-brand-v101";

function norm(s) {
  return String(s || "").replace(/\s+/g, " ").trim().toUpperCase();
}

function allElements() {
  return Array.from(document.querySelectorAll("body *"));
}

function leafContaining(text) {
  const needle = norm(text);
  return allElements().find(
    (el) => el.children.length === 0 && norm(el.textContent).includes(needle)
  );
}

function ensureStyle() {
  if (document.getElementById(STYLE_ID)) return;
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    input[placeholder*="Movie, actor, director, genre, language or provider"] {
      border: 0 !important;
      outline: 0 !important;
      box-shadow: none !important;
      background: transparent !important;
    }
    [data-flixyfy-recommendations="1"] {
      position: relative !important;
      z-index: 9999 !important;
      overflow: visible !important;
      border: 0 !important;
      box-shadow: none !important;
    }
    [data-flixyfy-provider-rail="1"] {
      scrollbar-width: thin;
      scrollbar-color: rgba(234,179,8,.35) transparent;
    }
    [data-flixyfy-provider-card="1"] {
      min-width: 66px !important;
      width: 66px !important;
      height: 66px !important;
      padding: 7px !important;
      border: 1px solid rgba(234,179,8,.22) !important;
      border-radius: 12px !important;
      background: rgba(255,255,255,.025) !important;
      box-shadow: none !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      flex: 0 0 66px !important;
      overflow: hidden !important;
    }
    [data-flixyfy-provider-card="1"]:hover {
      border-color: rgba(244,217,95,.72) !important;
      background: rgba(234,179,8,.07) !important;
    }
    [data-flixyfy-provider-card="1"] img {
      width: 48px !important;
      height: 48px !important;
      max-width: 48px !important;
      max-height: 48px !important;
      object-fit: contain !important;
      border-radius: 10px !important;
      margin: 0 !important;
    }
    [data-flixyfy-provider-label-hidden="1"] {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0,0,0,0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    }
    [data-flixyfy-language-chip="1"] {
      min-height: 32px !important;
      padding: 5px 11px !important;
      border-radius: 9px !important;
      border: 1px solid rgba(234,179,8,.20) !important;
      background: rgba(255,255,255,.035) !important;
      color: #f5e9a6 !important;
      box-shadow: none !important;
    }
    .flixyfy-brand-watermark-v101 {
      position: fixed;
      top: 135px;
      right: -20px;
      width: min(31vw,470px);
      aspect-ratio: 1;
      z-index: 1;
      opacity: .028;
      pointer-events: none;
      user-select: none;
      overflow: hidden;
    }
    .flixyfy-brand-watermark-v101 img {
      width: 100%;
      height: 100%;
      object-fit: contain;
      filter: invert(1) grayscale(1) contrast(1.25);
      mix-blend-mode: screen;
    }
    .flixyfy-availability-notice-v101 {
      width: min(1180px,calc(100% - 40px));
      margin: 22px auto 6px;
      position: relative;
      z-index: 5;
      border-top: 1px solid rgba(234,179,8,.20);
      color: rgba(255,255,255,.69);
      font-size: 12.5px;
      line-height: 1.65;
      padding-top: 10px;
    }
    .flixyfy-availability-notice-v101 summary {
      cursor: pointer;
      color: #f4d95f;
      font-weight: 800;
      padding: 4px 0 7px;
    }
    .flixyfy-availability-notice-v101 p { margin: 8px 0; }
    .flixyfy-availability-notice-v101 a { color:#f4d95f; text-decoration:none; margin-right:16px; }
    .flixyfy-legal-footer-v101 {
      border-top: 1px solid rgba(234,179,8,.15);
      background: rgba(5,5,5,.96);
      color: rgba(255,255,255,.55);
      text-align: center;
      padding: 18px 18px 22px;
      margin-top: 28px;
      font-size: 12px;
      position: relative;
      z-index: 8;
    }
    .flixyfy-legal-footer-v101 nav {
      display:flex;
      justify-content:center;
      flex-wrap:wrap;
      gap:10px 18px;
    }
    .flixyfy-legal-footer-v101 a { color:#f4d95f; text-decoration:none; }
    .flixyfy-legal-footer-v101 .brand {
      margin-top:10px;
      letter-spacing:.13em;
      color:rgba(244,217,95,.56);
      font-weight:800;
    }
    @media (max-width:900px) {
      .flixyfy-brand-watermark-v101 { width:45vw; right:-9vw; opacity:.018; }
    }
    @media (max-width:640px) {
      .flixyfy-brand-watermark-v101 { display:none; }
      .flixyfy-availability-notice-v101 { width:calc(100% - 24px); }
    }
  `;
  document.head.appendChild(style);
}

function fixHeaderBrand() {
  const header = document.querySelector("header");
  if (!header) return;
  const brandText = Array.from(header.querySelectorAll("a,span,strong,div")).find(
    (el) => norm(el.textContent) === "FLIXYFY"
  );
  if (!brandText) return;
  const anchor = brandText.closest("a") || brandText.parentElement;
  const img = anchor?.querySelector("img") || header.querySelector("img");
  if (img && img.dataset.flixyfyLatestLogo !== "1") {
    img.dataset.flixyfyLatestLogo = "1";
    img.src = BRAND_SRC;
    img.removeAttribute("srcset");
    img.style.width = "52px";
    img.style.height = "52px";
    img.style.objectFit = "contain";
    img.style.borderRadius = "10px";
    img.style.filter = "drop-shadow(0 0 10px rgba(234,179,8,.24))";
  }
  brandText.style.fontWeight = "900";
  brandText.style.letterSpacing = ".14em";
  brandText.style.textShadow = "0 0 18px rgba(234,179,8,.20)";
}

function fixSearchUi() {
  const input = document.querySelector(
    'input[placeholder*="Movie, actor, director, genre, language or provider"]'
  );
  if (!input) return;

  input.style.border = "0";
  input.style.outline = "0";
  input.style.boxShadow = "none";
  input.style.background = "transparent";

  let cur = input.parentElement;
  for (let i = 0; i < 5 && cur; i += 1, cur = cur.parentElement) {
    cur.style.overflow = "visible";
    if (getComputedStyle(cur).position === "static") cur.style.position = "relative";
  }

  const recent = leafContaining("RECENT SEARCHES");
  if (recent) {
    let panel = recent.parentElement;
    for (let i = 0; i < 6 && panel; i += 1) {
      const rect = panel.getBoundingClientRect();
      if (rect.width >= input.getBoundingClientRect().width * 0.7) break;
      panel = panel.parentElement;
    }
    if (panel) {
      panel.dataset.flixyfyRecommendations = "1";
      panel.style.zIndex = "9999";
      panel.style.overflow = "visible";
      panel.style.border = "0";
      panel.style.boxShadow = "none";
      panel.style.background = "rgba(7,7,7,.98)";
      let ancestor = panel.parentElement;
      for (let i = 0; i < 4 && ancestor; i += 1, ancestor = ancestor.parentElement) {
        ancestor.style.overflow = "visible";
        if (getComputedStyle(ancestor).position === "static") ancestor.style.position = "relative";
        ancestor.style.zIndex = "100";
      }
    }
  }
}

function providerSection() {
  const browse = leafContaining("PROVIDER BROWSE");
  if (!browse) return null;
  let cur = browse.parentElement;
  for (let i = 0; i < 7 && cur; i += 1, cur = cur.parentElement) {
    const text = norm(cur.textContent);
    const images = cur.querySelectorAll("img").length;
    if (text.includes("FIND WHERE TO WATCH") && images >= 3) return cur;
  }
  return browse.parentElement;
}

function fixProviderRail() {
  const section = providerSection();
  if (!section) return;
  const cards = Array.from(section.querySelectorAll("a,button")).filter((el) => el.querySelector("img"));
  if (cards.length < 2) return;

  const host = cards[0].parentElement;
  if (host) {
    host.dataset.flixyfyProviderRail = "1";
    host.style.display = "flex";
    host.style.alignItems = "center";
    host.style.gap = "10px";
    host.style.overflowX = "auto";
    host.style.overflowY = "hidden";
    host.style.padding = "8px 2px 10px";
    host.style.scrollSnapType = "x proximity";
  }

  cards.forEach((card) => {
    card.dataset.flixyfyProviderCard = "1";
    const label = String(card.textContent || "").replace(/\s+/g," ").trim();
    if (label && !card.getAttribute("aria-label")) card.setAttribute("aria-label",label);
    if (label && !card.getAttribute("title")) card.setAttribute("title",label);
    card.style.scrollSnapAlign = "start";

    Array.from(card.querySelectorAll("span,p,strong")).forEach((x) => {
      if (!x.querySelector("img") && String(x.textContent || "").trim()) {
        x.dataset.flixyfyProviderLabelHidden = "1";
      }
    });
  });
}

function fixLanguageChips() {
  const more = leafContaining("More languages");
  if (!more) return;
  const host = more.parentElement?.parentElement || more.parentElement;
  if (!host) return;
  Array.from(host.querySelectorAll("a,button")).forEach((chip) => {
    const t = norm(chip.textContent);
    if (t.includes("BENGALI") || t.includes("MARATHI") || t.includes("ALL LANGUAGES")) {
      chip.dataset.flixyfyLanguageChip = "1";
    }
  });
}

function findWatchContainer() {
  const start = leafContaining("WHERE TO WATCH IN INDIA") || leafContaining("WATCH FREE ON YOUTUBE");
  if (!start) return null;
  let cur = start.parentElement;
  for (let i = 0; i < 7 && cur; i += 1, cur = cur.parentElement) {
    const t = norm(cur.textContent);
    if (
      (t.includes("WHERE TO WATCH IN INDIA") || t.includes("WATCH FREE ON YOUTUBE")) &&
      cur.getBoundingClientRect().width > 450
    ) return cur;
  }
  return start.parentElement;
}

function fixMovieDetail() {
  if (!window.location.pathname.startsWith("/movie/")) return;

  if (!document.querySelector(".flixyfy-brand-watermark-v101")) {
    const wm = document.createElement("div");
    wm.className = "flixyfy-brand-watermark-v101";
    wm.setAttribute("aria-hidden","true");
    wm.innerHTML = `<img src="${BRAND_SRC}" alt="" />`;
    document.body.appendChild(wm);
  }

  const empty = leafContaining("No approved watch link in this snapshot.");
  if (empty) {
    let card = empty.parentElement;
    for (let i = 0; i < 6 && card; i += 1, card = card.parentElement) {
      if (norm(card.textContent).includes("WATCH FREE ON YOUTUBE")) break;
    }
    if (card && norm(card.textContent).includes("WATCH FREE ON YOUTUBE")) {
      card.style.display = "none";
      const grid = card.parentElement;
      if (grid) {
        grid.style.gridTemplateColumns = "minmax(0,1fr)";
        Array.from(grid.children).forEach((x) => {
          if (x !== card && getComputedStyle(x).display !== "none") {
            x.style.gridColumn = "1 / -1";
            x.style.width = "100%";
          }
        });
      }
    }
  }

  const watch = findWatchContainer();
  if (watch && !document.querySelector(".flixyfy-availability-notice-v101")) {
    const notice = document.createElement("section");
    notice.className = "flixyfy-availability-notice-v101";
    notice.innerHTML = `
      <details>
        <summary>Availability &amp; copyright notice</summary>
        <p>FLIXYFY is a movie-discovery service and does not host or stream movies. Watch links open third-party services. Streaming availability and externally hosted links can change, and automated matching may occasionally be inaccurate.</p>
        <p>FLIXYFY does not host, upload, store, reproduce or distribute movie video files. Third-party trademarks and content remain the property of their respective owners. Rightsholders and users may report inaccurate or problematic links for review and removal from the FLIXYFY index.</p>
        <p><a href="/copyright">Copyright &amp; takedown</a><a href="/contact">Report an issue</a></p>
      </details>`;
    watch.insertAdjacentElement("afterend",notice);
  }
}

function installSearchFetchAccelerator() {
  if (window.__flixyfySearchFetchV101) return;
  window.__flixyfySearchFetchV101 = true;

  const originalFetch = window.fetch.bind(window);
  const cache = new Map();
  let activeController = null;
  let activeUrl = "";

  function isSearchGet(url,init,input) {
    const method = String(
      init?.method || (input instanceof Request ? input.method : "GET") || "GET"
    ).toUpperCase();
    if (method !== "GET") return false;
    if (url.pathname.startsWith("/_next")) return false;

    const hostOk =
      url.hostname === window.location.hostname ||
      url.hostname.includes("flixyfy-api") ||
      url.hostname.includes("railway.app");

    return hostOk && url.pathname.toLowerCase().includes("search");
  }

  window.fetch = async function flixyfyFetch(input,init={}) {
    let url;
    try {
      url = new URL(input instanceof Request ? input.url : String(input),window.location.href);
    } catch {
      return originalFetch(input,init);
    }

    if (!isSearchGet(url,init,input)) return originalFetch(input,init);

    const key = url.toString();
    const cached = cache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      return new Response(cached.body.slice(0),{
        status:cached.status,
        statusText:cached.statusText,
        headers:cached.headers,
      });
    }

    const externalSignal = Boolean(init?.signal);
    let controller = null;

    if (!externalSignal) {
      if (activeController && activeUrl !== key) {
        try { activeController.abort("superseded FLIXYFY search request"); } catch {}
      }
      controller = new AbortController();
      activeController = controller;
      activeUrl = key;
      init = { ...init,signal:controller.signal };
    }

    try {
      const response = await originalFetch(input,init);
      const contentType = response.headers.get("content-type") || "";
      if (response.ok && contentType.includes("application/json")) {
        response.clone().arrayBuffer().then((body) => {
          if (body.byteLength <= 2_000_000) {
            cache.set(key,{
              body,
              status:response.status,
              statusText:response.statusText,
              headers:Array.from(response.headers.entries()),
              expiresAt:Date.now()+30_000,
            });
            if (cache.size > 40) cache.delete(cache.keys().next().value);
          }
        }).catch(() => {});
      }
      return response;
    } finally {
      if (controller === activeController) {
        activeController = null;
        activeUrl = "";
      }
    }
  };
}

function applyAll() {
  ensureStyle();
  fixHeaderBrand();
  fixSearchUi();
  fixProviderRail();
  fixLanguageChips();
  fixMovieDetail();
}

export default function FlixyfyBrandLegalEnhancer() {
  useEffect(() => {
    installSearchFetchAccelerator();
    applyAll();

    let scheduled = false;
    const observer = new MutationObserver(() => {
      if (scheduled) return;
      scheduled = true;
      window.requestAnimationFrame(() => {
        scheduled = false;
        applyAll();
      });
    });

    observer.observe(document.body,{childList:true,subtree:true});
    return () => observer.disconnect();
  },[]);

  return (
    <footer className="flixyfy-legal-footer-v101">
      <nav aria-label="Legal and support">
        <Link href="/terms">Terms of Service</Link>
        <Link href="/privacy">Privacy Policy</Link>
        <Link href="/copyright">Copyright &amp; Takedown</Link>
        <Link href="/contact">Contact / Report an Issue</Link>
      </nav>
      <div className="brand">FLIXYFY · FIND · WATCH · ENJOY</div>
    </footer>
  );
}
