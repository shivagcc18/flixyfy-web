export const GA_MEASUREMENT_ID = "G-ECV07D8CMX";

export function initGA() {
  if (window.gtag) return;

  const script1 = document.createElement("script");
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script1);

  const script2 = document.createElement("script");
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', '${GA_MEASUREMENT_ID}', {
      send_page_view: false
    });
  `;
  document.head.appendChild(script2);
}

export function initAnalytics() {
  initGA();
}

export function trackPageView(path) {
  if (!window.gtag) return;

  window.gtag("event", "page_view", {
    page_path: path,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function trackEvent(eventName, params = {}) {
  if (!window.gtag) return;

  window.gtag("event", eventName, params);
}

export function trackSearch(query) {
  trackEvent("search_used", {
    search_term: query,
  });
}

export function trackMovieOpen(title) {
  trackEvent("movie_opened", {
    movie_title: title,
  });
}

export function trackMovieClick(movie) {
  if (typeof movie === "string") {
    trackMovieOpen(movie);
    return;
  }

  trackEvent("movie_opened", {
    movie_title: movie?.title || movie?.name || "unknown",
    movie_slug: movie?.slug || "",
    movie_year: movie?.release_year || movie?.year || "",
    movie_language: movie?.primary_language || movie?.language || "",
    ott_primary: movie?.ott_primary || "",
    is_free: Boolean(movie?.is_free),
  });
}

export function trackLanguageOpen(language) {
  trackEvent("language_opened", {
    language,
  });
}

export function trackProviderClick(provider, title = "") {
  trackEvent("provider_clicked", {
    provider,
    movie_title: title,
  });
}

export function trackYoutubeClick(title) {
  trackEvent("youtube_clicked", {
    movie_title: title,
  });
}

export function trackLoadMore(page) {
  trackEvent("load_more_clicked", {
    page,
  });
}

export function trackFilter(type, value) {
  trackEvent("filter_used", {
    filter_type: type,
    filter_value: value,
  });
}