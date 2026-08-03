import { ExternalLink, PlayCircle } from "lucide-react";
import type { AvailabilityOption, Provider } from "@/lib/api";

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
  const buttonUrl = rawUrl || (mediaKind === "youtube" && videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : "");
  const availabilityType = String(item.availability_type ?? item.access_model ?? (mediaKind === "youtube" ? "free" : "")).toLowerCase();
  const navigationKind = String(item.navigation_kind ?? (buttonUrl ? "DIRECT" : "UNAVAILABLE")).toUpperCase();
  return {
    ...item,
    media_kind: mediaKind,
    button_url: buttonUrl || null,
    button_label: String(item.button_label ?? (mediaKind === "youtube" ? "Watch on YouTube" : `Watch on ${item.provider_name ?? "provider"}`)),
    availability_type: availabilityType,
    navigation_kind: navigationKind,
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

export default function ProviderButtons({
  providers,
  compact = false,
}: {
  providers: ProviderButtonItem[];
  compact?: boolean;
}) {
  const approved = providers.filter(isApprovedNavigable).map(normalize);

  if (!approved.length) {
    return <p className="provider-empty">No approved watch link in this snapshot.</p>;
  }

  return (
    <div className={compact ? "provider-buttons compact" : "provider-buttons"}>
      {approved.map((provider) => {
        const key =
          "availability_id" in provider && provider.availability_id
            ? provider.availability_id
            : `${provider.provider_key}-${provider.availability_type}-${provider.button_url}`;
        const isYouTube = "media_kind" in provider && provider.media_kind === "youtube";
        return (
          <a
            className="provider-button"
            href={provider.button_url ?? undefined}
            target="_blank"
            rel="noreferrer"
            key={key}
          >
            {provider.button_label || `Watch on ${provider.provider_name}`}
            {isYouTube ? <PlayCircle size={compact ? 13 : 16} aria-hidden="true" /> : <ExternalLink size={compact ? 13 : 16} aria-hidden="true" />}
          </a>
        );
      })}
    </div>
  );
}
