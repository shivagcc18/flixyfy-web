import { ExternalLink, PlayCircle } from "lucide-react";
import type { AvailabilityOption, Provider } from "@/lib/api";
import { approvedProviderActions, providerActionIsNavigable } from "@/lib/providerActions.mjs";
import { providerPresentation } from "@/lib/providerPresentation";
import ProviderLogo from "./ProviderLogo";

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
        const presentation = isYouTube
          ? providerPresentation("youtube", "YouTube")
          : providerPresentation(provider.provider_key, provider.provider_name);
        const label = `Watch on ${presentation.label}`;
        const canNavigate = providerActionIsNavigable(provider);
        const className = `provider-button${isYouTube ? " youtube-provider-button" : ""}${canNavigate ? "" : " provider-button-label-only"}`;
        const content = (
          <>
            <ProviderLogo
              providerKey={isYouTube ? "youtube" : provider.provider_key}
              providerName={isYouTube ? "YouTube" : provider.provider_name}
              compact
            />
            <span>{label}</span>
            {canNavigate ? isYouTube
              ? <PlayCircle size={compact ? 15 : 16} aria-hidden="true" />
              : <ExternalLink size={compact ? 15 : 16} aria-hidden="true" /> : null}
          </>
        );
        return canNavigate ? (
          <a className={className} href={provider.button_url ?? undefined} target="_blank" rel="noreferrer" key={itemKey(provider)} aria-label={label}>
            {content}
          </a>
        ) : (
          <span className={className} key={itemKey(provider)} aria-label={label} aria-disabled="true" title={`${label} — no approved provider route is available`}>
            {content}
          </span>
        );
      })}
    </div>
  );
}
