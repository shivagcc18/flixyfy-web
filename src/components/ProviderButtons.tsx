import { ExternalLink, PlayCircle } from "lucide-react";
import type { AvailabilityOption, Provider } from "@/lib/api";
import { approvedProviderActions } from "@/lib/providerActions.mjs";

type ProviderButtonItem = Provider | AvailabilityOption;

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
  const approved = approvedProviderActions(providers, maxItems);

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
