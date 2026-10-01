const navigableKinds = new Set(["DIRECT", "SEARCH", "HOME"]);
const approvedTypes = new Set(["flatrate", "rent", "buy", "free"]);

export function normalizeAvailabilityType(value) {
  return String(value ?? "").trim().toLowerCase();
}

function isApprovedNavigable(item) {
  return Boolean(
    item.button_url &&
      navigableKinds.has(item.navigation_kind) &&
      approvedTypes.has(normalizeAvailabilityType(item.availability_type)),
  );
}

export function approvedProviderActions(providers, maxItems) {
  const seen = new Set();
  return providers
    .filter(isApprovedNavigable)
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
