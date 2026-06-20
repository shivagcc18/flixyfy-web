export const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || "";

export function initAnalytics() {
  if (!GA_ID) return;

  const script1 = document.createElement("script");
  script1.async = true;
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script1);

  const script2 = document.createElement("script");
  script2.innerHTML = `
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', '${GA_ID}', {
      page_path: window.location.pathname + window.location.search
    });
  `;
  document.head.appendChild(script2);
}

export function trackEvent(eventName, params = {}) {
  if (!window.gtag) return;

  window.gtag("event", eventName, {
    app_name: "Flixyfy",
    ...params,
  });
}

export function trackSearch(query, language = "") {
  trackEvent("search", {
    search_term: query,
    language: language || "all",
  });
}

export function trackMovieClick(movie) {
  trackEvent("movie_click", {
    movie_title: movie?.title || "",
    movie_slug: movie?.slug || "",
    language: movie?.primary_language || "",
  });
}

export function trackProviderClick(providerName, movieTitle = "") {
  trackEvent("provider_click", {
    provider_name: providerName || "",
    movie_title: movieTitle || "",
  });
}