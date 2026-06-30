function detectDevice() {
  const ua = window.navigator.userAgent || "";
  const platform = window.navigator.platform || "";
  const touch = window.navigator.maxTouchPoints || 0;
  const isAndroid = /Android/i.test(ua);
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (platform === "MacIntel" && touch > 1);
  const isTV = /TV|SmartTV|AppleTV|GoogleTV|Android TV|AFT|Roku|Tizen|Web0S|webOS/i.test(ua);

  if (isTV) return "tv";
  if (isAndroid) return "android";
  if (isIOS) return "ios";
  return "web";
}

export function getBestProviderUrl(provider = {}) {
  const device = detectDevice();

  const deviceUrl =
    device === "android"
      ? provider.android_url || provider.android_deep_link
      : device === "ios"
        ? provider.ios_url || provider.ios_deep_link
        : device === "tv"
          ? provider.tv_url || provider.tv_deep_link
          : null;

  return (
    deviceUrl ||
    provider.web_url ||
    provider.final_url ||
    provider.provider_url ||
    provider.fallback_search_url ||
    provider.provider_search_url ||
    provider.homepage_url ||
    provider.deep_link ||
    provider.provider_deep_link ||
    null
  );
}

export function openProviderUrl(provider, fallbackTitle = "") {
  const url = getBestProviderUrl(provider);
  if (!url) return false;

  const target = String(url).replace("{q}", encodeURIComponent(fallbackTitle || ""));
  window.open(target, "_blank", "noopener,noreferrer");
  return true;
}
