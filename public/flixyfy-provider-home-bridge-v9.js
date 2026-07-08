/* FLIXYFY_FRONTEND_HOME_PROVIDER_PUBLIC_BRIDGE_V9
   Public browser bridge for Home provider filters.
   Frontend-only. No DB/backend mutation. Uses /api/v3/movies provider filters.
*/
(function () {
  "use strict";

  var VERSION = "FLIXYFY_FRONTEND_HOME_PROVIDER_PUBLIC_BRIDGE_V9";
  var API_BASE = "https://flixyfy-api-production.up.railway.app";
  var state = {
    lastKey: "",
    lastUrl: "",
    running: false,
    lastRenderAt: 0
  };

  var providerAliases = {
    "netflix": "netflix",
    "prime": "prime_video",
    "prime video": "prime_video",
    "prime_video": "prime_video",
    "amazon prime": "prime_video",
    "amazon prime video": "prime_video",
    "youtube": "youtube",
    "you tube": "youtube",
    "jiohotstar": "jiohotstar",
    "jio hotstar": "jiohotstar",
    "hotstar": "jiohotstar",
    "zee5": "zee5",
    "sony liv": "sonyliv",
    "sonyliv": "sonyliv",
    "aha": "aha",
    "sun nxt": "sun_nxt",
    "sunnxt": "sun_nxt",
    "sun_nxt": "sun_nxt",
    "all": "all",
    "all providers": "all",
    "": "all"
  };

  var providerLabels = {
    netflix: "Netflix",
    prime_video: "Prime Video",
    youtube: "YouTube",
    jiohotstar: "JioHotstar",
    zee5: "ZEE5",
    sonyliv: "SonyLIV",
    aha: "Aha",
    sun_nxt: "Sun NXT"
  };

  function norm(value) {
    var raw = String(value == null ? "" : value).trim().toLowerCase();
    if (!raw) return "all";
    raw = raw.replace(/[\u00a0]+/g, " ").replace(/[\s\-]+/g, "_");
    var spaced = raw.replace(/_/g, " ");
    return providerAliases[raw] || providerAliases[spaced] || raw;
  }

  function labelFor(key) {
    return providerLabels[key] || String(key || "").replace(/_/g, " ").replace(/\b\w/g, function (m) { return m.toUpperCase(); });
  }

  function isHomePath() {
    var p = window.location.pathname || "/";
    return p === "/" || p === "" || p === "/index.html";
  }

  function readProviderFromUrl() {
    try {
      var params = new URLSearchParams(window.location.search || "");
      var raw = params.get("provider") || params.get("provider_key") || "";
      return norm(raw);
    } catch (e) {
      return "all";
    }
  }

  function readProviderFromSelect() {
    var selects = Array.prototype.slice.call(document.querySelectorAll("select"));
    for (var i = 0; i < selects.length; i += 1) {
      var sel = selects[i];
      var opt = sel.options && sel.options[sel.selectedIndex];
      var text = opt ? String(opt.textContent || "").trim() : "";
      var value = String(sel.value || "").trim();
      var combined = (text || value).trim();
      var key = norm(combined);
      if (providerLabels[key] || key === "youtube" || key === "prime_video" || key === "netflix") {
        return key;
      }
    }
    return "all";
  }

  function readProvider() {
    var fromUrl = readProviderFromUrl();
    if (fromUrl && fromUrl !== "all") return fromUrl;
    return readProviderFromSelect();
  }

  function isIndianScopeActive() {
    // Duplicate inner scope toggle is being removed. Top nav Indian stays active for root.
    return true;
  }

  function hideDuplicateScopeToggle() {
    var candidates = Array.prototype.slice.call(document.querySelectorAll("button, a, [role='button'], .tab, .toggle, .pill"));
    var parents = [];
    for (var i = 0; i < candidates.length; i += 1) {
      var el = candidates[i];
      var text = String(el.textContent || "").trim().toLowerCase();
      if (text === "indian" || text === "global") {
        var parent = el.parentElement;
        if (parent && parents.indexOf(parent) === -1) parents.push(parent);
      }
    }
    for (var j = 0; j < parents.length; j += 1) {
      var p = parents[j];
      var t = String(p.textContent || "").replace(/\s+/g, " ").trim().toLowerCase();
      var rect = p.getBoundingClientRect ? p.getBoundingClientRect() : { top: 0 };
      var controls = Array.prototype.slice.call(p.querySelectorAll("button, a, [role='button'], .tab, .toggle, .pill"));
      var hasIndian = /\bindian\b/.test(t);
      var hasGlobal = /\bglobal\b/.test(t);
      var hasHistorical = /\bhistorical\b/.test(t);
      var isSmallScopeGroup = hasIndian && hasGlobal && !hasHistorical && controls.length <= 5;
      var belowHeader = rect.top > 105;
      if (isSmallScopeGroup && belowHeader) {
        p.setAttribute("data-flixyfy-hidden-duplicate-scope-v9", "1");
        p.style.display = "none";
      }
    }
  }

  function findMainHeading() {
    var headings = Array.prototype.slice.call(document.querySelectorAll("h1,h2,h3"));
    for (var i = 0; i < headings.length; i += 1) {
      var txt = String(headings[i].textContent || "");
      if (/Popular Movies/i.test(txt) || /Movies \(0\)/i.test(txt) || /Provider Movies/i.test(txt)) {
        return headings[i];
      }
    }
    return null;
  }

  function hideNoMoviesFound() {
    var nodes = Array.prototype.slice.call(document.querySelectorAll("p,div,span"));
    for (var i = 0; i < nodes.length; i += 1) {
      var el = nodes[i];
      var txt = String(el.textContent || "").trim().toLowerCase();
      if (txt === "no movies found." || txt === "no movies found") {
        el.setAttribute("data-flixyfy-hidden-empty-v9", "1");
        el.style.display = "none";
      }
    }
  }

  function ensureStyles() {
    if (document.getElementById("flixyfy-provider-home-bridge-v9-style")) return;
    var style = document.createElement("style");
    style.id = "flixyfy-provider-home-bridge-v9-style";
    style.textContent = "\
      #flixyfy-provider-home-results-v9 { width: 100%; box-sizing: border-box; padding: 8px 0 32px 0; }\
      #flixyfy-provider-home-results-v9 .ff-grid-v9 { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 18px; align-items: start; }\
      @media (min-width: 900px) { #flixyfy-provider-home-results-v9 .ff-grid-v9 { grid-template-columns: repeat(auto-fill, minmax(165px, 1fr)); gap: 20px; } }\
      #flixyfy-provider-home-results-v9 .ff-card-v9 { color: #fff; text-decoration: none; display: block; min-width: 0; }\
      #flixyfy-provider-home-results-v9 .ff-poster-v9 { width: 100%; aspect-ratio: 2 / 3; object-fit: cover; border-radius: 9px; background: #07111e; display: block; box-shadow: 0 0 0 1px rgba(255,255,255,0.05); }\
      #flixyfy-provider-home-results-v9 .ff-title-v9 { margin-top: 8px; font-weight: 800; font-size: 15px; line-height: 1.22; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\
      #flixyfy-provider-home-results-v9 .ff-meta-v9 { color: #aac8d8; font-size: 12px; margin-top: 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }\
    ";
    document.head.appendChild(style);
  }

  function movieHref(item) {
    if (item && item.movie_url) return item.movie_url;
    if (item && item.slug) return "/movie/" + encodeURIComponent(item.slug);
    return "#";
  }

  function posterSrc(item) {
    return (item && (item.poster_url || item.poster_path || item.image_url)) || "";
  }

  function renderProviderMovies(providerKey, payload) {
    ensureStyles();
    hideDuplicateScopeToggle();
    hideNoMoviesFound();

    var label = labelFor(providerKey);
    var items = Array.isArray(payload && payload.items) ? payload.items : [];
    var total = Number(payload && payload.total != null ? payload.total : items.length) || 0;

    var heading = findMainHeading();
    if (heading) {
      heading.textContent = label + " - Popular Movies (" + total + ")";
      heading.setAttribute("data-flixyfy-provider-heading-v9", providerKey);
    }

    var container = document.getElementById("flixyfy-provider-home-results-v9");
    if (!container) {
      container = document.createElement("div");
      container.id = "flixyfy-provider-home-results-v9";
      if (heading && heading.parentNode) {
        heading.parentNode.insertBefore(container, heading.nextSibling);
      } else {
        var footer = document.querySelector("footer");
        if (footer && footer.parentNode) footer.parentNode.insertBefore(container, footer);
        else document.body.appendChild(container);
      }
    }

    var html = '<div class="ff-grid-v9">';
    for (var i = 0; i < items.length; i += 1) {
      var item = items[i] || {};
      var title = String(item.title || item.original_title || "Untitled");
      var year = item.release_year || item.year || "";
      var lang = item.primary_language || item.language_name || item.language_slug || "";
      var provider = item.ott_primary || label;
      var img = posterSrc(item);
      html += '<a class="ff-card-v9" href="' + escapeAttr(movieHref(item)) + '">';
      if (img) html += '<img class="ff-poster-v9" loading="lazy" decoding="async" src="' + escapeAttr(img) + '" alt="' + escapeAttr(title) + ' poster">';
      else html += '<div class="ff-poster-v9"></div>';
      html += '<div class="ff-title-v9">' + escapeHtml(title) + '</div>';
      html += '<div class="ff-meta-v9">' + escapeHtml([year, lang, provider].filter(Boolean).join(' • ')) + '</div>';
      html += '</a>';
    }
    html += '</div>';
    container.innerHTML = html;
    container.setAttribute("data-provider", providerKey);
    container.setAttribute("data-total", String(total));
  }

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" }[m];
    });
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, "&#096;");
  }

  function fetchAndRender(reason) {
    if (!isHomePath()) return;
    hideDuplicateScopeToggle();

    var providerKey = readProvider();
    if (!providerKey || providerKey === "all") {
      var existing = document.getElementById("flixyfy-provider-home-results-v9");
      if (existing) existing.remove();
      return;
    }
    if (!isIndianScopeActive()) return;

    var now = Date.now();
    var apiUrl = API_BASE + "/api/v3/movies?provider=" + encodeURIComponent(providerKey) + "&limit=24&page=1&flixyfy_bridge=" + encodeURIComponent(VERSION);
    var needFetch = state.lastKey !== providerKey || state.lastUrl !== apiUrl || (now - state.lastRenderAt > 5000 && hasVisibleZeroState(providerKey));
    if (!needFetch || state.running) return;

    state.running = true;
    state.lastKey = providerKey;
    state.lastUrl = apiUrl;

    fetch(apiUrl, { method: "GET", headers: { "accept": "application/json" }, cache: "no-store" })
      .then(function (res) { return res.json(); })
      .then(function (payload) {
        state.lastRenderAt = Date.now();
        renderProviderMovies(providerKey, payload || {});
      })
      .catch(function (err) {
        console.warn(VERSION + " fetch failed", reason, err);
      })
      .finally(function () {
        state.running = false;
      });
  }

  function hasVisibleZeroState(providerKey) {
    var heading = findMainHeading();
    if (!heading) return true;
    var txt = String(heading.textContent || "");
    return /\(0\)/.test(txt) || txt.toLowerCase().indexOf(labelFor(providerKey).toLowerCase()) >= 0;
  }

  function install() {
    if (window.__FLIXYFY_PROVIDER_HOME_BRIDGE_V9_INSTALLED__) return;
    window.__FLIXYFY_PROVIDER_HOME_BRIDGE_V9_INSTALLED__ = true;
    hideDuplicateScopeToggle();
    fetchAndRender("install");
    setTimeout(function () { fetchAndRender("t250"); }, 250);
    setTimeout(function () { fetchAndRender("t1000"); }, 1000);
    setTimeout(function () { fetchAndRender("t2500"); }, 2500);
    setInterval(function () { hideDuplicateScopeToggle(); fetchAndRender("interval"); }, 2500);
    document.addEventListener("change", function (ev) {
      if (ev && ev.target && ev.target.tagName === "SELECT") {
        state.lastKey = "";
        setTimeout(function () { fetchAndRender("select-change"); }, 60);
        setTimeout(function () { fetchAndRender("select-change-late"); }, 500);
      }
    }, true);
    document.addEventListener("click", function () {
      setTimeout(function () { hideDuplicateScopeToggle(); fetchAndRender("click"); }, 120);
    }, true);
    try {
      var mo = new MutationObserver(function () {
        hideDuplicateScopeToggle();
        fetchAndRender("mutation");
      });
      mo.observe(document.documentElement, { childList: true, subtree: true });
    } catch (e) {}
    console.info(VERSION + " installed");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install);
  } else {
    install();
  }
})();
