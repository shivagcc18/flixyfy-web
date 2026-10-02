const approvedTypes = new Set(["flatrate", "rent", "buy", "free", "ads"]);
const navigableKinds = new Set(["DIRECT", "SEARCH", "HOME"]);

export function normalizeAvailabilityType(value) {
  return String(value ?? "").trim().toLowerCase();
}

export function providerActionIsNavigable(item) {
  return Boolean(item.button_url && navigableKinds.has(String(item.navigation_kind ?? "").toUpperCase()));
}

function isApprovedDisplay(item) {
  return approvedTypes.has(normalizeAvailabilityType(item.availability_type));
}

export function approvedProviderActions(providers, maxItems) {
  const seen = new Set();
  return providers
    .filter(isApprovedDisplay)
    .filter((provider) => {
      const isYouTube = "media_kind" in provider && provider.media_kind === "youtube";
      const dedupeKey = isYouTube
        ? `youtube-${("video_id" in provider && provider.video_id) || provider.button_url}`
        : `ott-${provider.provider_key}`;
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);
      return true;
    })
    .slice(0, maxItems ?? providers.length);
}
