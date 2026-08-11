import { ExternalLink, PlayCircle } from "lucide-react";
import type { AvailabilityOption, Provider } from "@/lib/api";

type ProviderButtonItem = Provider | AvailabilityOption;

const navigableKinds = new Set(["DIRECT", "SEARCH", "HOME"]);
const approvedTypes = new Set(["flatrate", "rent", "buy", "free"]);

function isApprovedNavigable(item: ProviderButtonItem) {
  return Boolean(
    item.button_url &&
      navigableKinds.has(item.navigation_kind) &&
      approvedTypes.has(item.availability_type),
  );
}

function itemKey(provider: ProviderButtonItem) {
  return "availability_id" in provider && provider.availability_id
    ? provider.availability_id
    : `${provider.provider_key}-${provider.availability_type}-${provider.button_url}`;
}

export default function ProviderButtons({
  providers,
  compact = false,
  maxItems,
}: {
  providers: ProviderButtonItem[];
  compact?: boolean;
  maxItems?: number;
}) {
  const seen = new Set<string>();
  const approved = providers
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

  if (!approved.length) {
    return <p className="provider-empty">No approved watch link is available right now.</p>;
  }

  return (
    <div className={compact ? "provider-buttons compact" : "provider-buttons"}>
      {approved.map((provider) => {
        const isYouTube = "media_kind" in provider && provider.media_kind === "youtube";
        const label = provider.button_label || `Watch on ${provider.provider_name}`;
        return (
          <a
            className={`provider-button${isYouTube ? " youtube-provider-button" : ""}`}
            href={provider.button_url ?? undefined}
            target="_blank"
            rel="noreferrer"
            key={itemKey(provider)}
            aria-label={label}
          >
            <span>{label}</span>
            {isYouTube
              ? <PlayCircle size={compact ? 13 : 16} aria-hidden="true" />
              : <ExternalLink size={compact ? 13 : 16} aria-hidden="true" />}
          </a>
        );
      })}
    </div>
  );
}
