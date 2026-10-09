export type SearchCardSummarySource = {
  providers?: string | { provider_name: string }[];
  provider_names?: string;
  provider_keys?: string;
  youtube_video_count?: number;
  youtube_languages?: string;
};

function splitSummary(value: string | undefined): string[] {
  return (value ?? "").split(",").map((part) => part.trim()).filter(Boolean);
}

export function projectSearchCardSummary(source: SearchCardSummarySource) {
  const providerNames = Array.isArray(source.providers) && source.providers.length > 0
    ? source.providers.map((provider) => provider.provider_name)
    : splitSummary(source.provider_names ?? (typeof source.providers === "string" ? source.providers : undefined));
  const providerKeys = splitSummary(source.provider_keys);
  const providers = providerNames.filter((name, index) => {
    const key = providerKeys[index]?.toLowerCase();
    return key !== "youtube" && name.toLowerCase() !== "youtube";
  });
  const count = Number.isInteger(source.youtube_video_count) && Number(source.youtube_video_count) >= 0
    ? Number(source.youtube_video_count)
    : null;
  const languages = count !== null && count > 0 ? splitSummary(source.youtube_languages) : [];

  return {
    providers,
    youtubeVideoCount: count,
    youtubeAvailable: count !== null ? count > 0 : null,
    youtubeLanguages: languages,
  };
}
