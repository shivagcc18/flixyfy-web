import { ExternalLink, PlayCircle } from "lucide-react";
import type { AvailabilityOption, Provider } from "@/lib/api";
import ProviderLogo from "./ProviderLogo";

type ProviderButtonItem = (Provider | AvailabilityOption) & Record<string, unknown>;

const navigableKinds = new Set(["DIRECT", "SEARCH", "HOME"]);
const approvedTypes = new Set([
  "flatrate",
  "paid_ott",
  "subscription",
  "paid",
  "rent",
  "buy",
  "free",
]);

function normalize(item: ProviderButtonItem) {
  const mediaKind = item.media_kind === "youtube" ? "youtube" : "ott";
  const videoId = String(item.video_id ?? item.youtube_video_id ?? "").trim();
  const rawUrl = String(item.button_url ?? item.watch_url ?? item.link_url ?? item.url ?? "").trim();
  const buttonUrl =
    rawUrl ||
    (mediaKind === "youtube" && videoId
      ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}`
      : "");
  const availabilityType = String(
    item.availability_type ?? item.access_model ?? (mediaKind === "youtube" ? "free" : ""),
  ).toLowerCase();
  const navigationKind = String(
    item.navigation_kind ?? (buttonUrl ? "DIRECT" : "UNAVAILABLE"),
  ).toUpperCase();
  const providerName = String(item.provider_name ?? (mediaKind === "youtube" ? "YouTube" : "Provider"));
  const providerKey = String(item.provider_key ?? (mediaKind === "youtube" ? "youtube" : providerName));

  return {
    ...item,
    provider_key: providerKey,
    provider_name: providerName,
    media_kind: mediaKind,
    button_url: buttonUrl || null,
    button_label: String(
      item.button_label ??
        (mediaKind === "youtube" ? "Watch on YouTube" : `Watch on ${providerName}`),
    ),
    availability_type: availabilityType,
    navigation_kind: navigationKind,
    video_id: videoId,
  };
}

function isApprovedNavigable(item: ProviderButtonItem) {
  const normalized = normalize(item);
  return Boolean(
    normalized.button_url &&
      navigableKinds.has(normalized.navigation_kind) &&
      approvedTypes.has(normalized.availability_type),
  );
}

function uniqueKey(item: ReturnType<typeof normalize>) {
  if (item.media_kind === "youtube") {
    return `youtube:${item.video_id || item.button_url}`;
  }
  return `ott:${item.provider_key.toLowerCase()}`;
}

export default function ProviderButtons({
  providers,
  compact = false,
  limit,
}: {
  providers: ProviderButtonItem[];
  compact?: boolean;
  limit?: number;
}) {
  const seen = new Set<string>();
  const approved = providers
    .filter(isApprovedNavigable)
    .map(normalize)
    .filter((item) => {
      const key = uniqueKey(item);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, limit ?? Number.POSITIVE_INFINITY);

  if (!approved.length) {
    return <p className="provider-empty">No approved watch link in this snapshot.</p>;
  }

  return (
    <div className={compact ? "provider-buttons compact" : "provider-buttons"}>
      {approved.map((provider) => {
        const key =
          "availability_id" in provider && provider.availability_id
            ? String(provider.availability_id)
            : uniqueKey(provider);
        const isYouTube = provider.media_kind === "youtube";

        return (
          <a
            className={isYouTube ? "provider-button youtube-button" : "provider-button"}
            href={provider.button_url ?? undefined}
            target="_blank"
            rel="noreferrer"
            key={key}
            aria-label={provider.button_label || `Watch on ${provider.provider_name}`}
          >
            <ProviderLogo
              providerKey={isYouTube ? "youtube" : provider.provider_key}
              providerName={provider.provider_name}
              compact
            />
            <span>{provider.button_label || `Watch on ${provider.provider_name}`}</span>
            {isYouTube ? (
              <PlayCircle size={compact ? 13 : 16} aria-hidden="true" />
            ) : (
              <ExternalLink size={compact ? 13 : 16} aria-hidden="true" />
            )}
          </a>
        );
      })}
    </div>
  );
}
