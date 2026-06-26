export const LANGUAGE_LABELS = {
  hi: "Hindi",
  te: "Telugu",
  ta: "Tamil",
  ml: "Malayalam",
  kn: "Kannada",
  bn: "Bengali",
  mr: "Marathi",
  pa: "Punjabi",
  gu: "Gujarati",
  or: "Odia",
  as: "Assamese",
  en: "English",
};

export function formatViews(viewCount) {
  const n = Number(viewCount || 0);

  if (!Number.isFinite(n) || n <= 0) return "";

  if (n >= 10000000) return `${(n / 10000000).toFixed(n >= 100000000 ? 0 : 1)}Cr views`;
  if (n >= 100000) return `${(n / 100000).toFixed(n >= 1000000 ? 0 : 1)}L views`;
  if (n >= 1000) return `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K views`;

  return `${Math.round(n)} views`;
}

export function formatDuration(seconds) {
  const total = Number(seconds || 0);

  if (!Number.isFinite(total) || total <= 0) return "";

  const minutes = Math.floor(total / 60);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (hours && mins) return `${hours}h ${mins}m`;
  if (hours) return `${hours}h`;
  return `${mins}m`;
}

export function languageLabel(code) {
  if (!code) return "";
  const normalized = String(code).toLowerCase();
  return LANGUAGE_LABELS[normalized] || normalized.toUpperCase();
}

export function youtubeLinkLabel(link) {
  const audio = languageLabel(link?.audio_language || link?.youtube_language);
  const isDubbed = Boolean(link?.is_dubbed);

  if (audio && isDubbed) return `${audio} dubbed full movie`;
  if (audio) return `${audio} full movie`;

  return "Full movie";
}

export function normalizeYouTubeLinks(movie) {
  const links = Array.isArray(movie?.youtube_links)
    ? movie.youtube_links
    : movie?.best_youtube_link
      ? [movie.best_youtube_link]
      : [];

  const seen = new Set();

  return links
    .filter((link) => link && (link.url || link.youtube_url) && (link.video_id || link.youtube_video_id))
    .map((link) => ({
      video_id: link.video_id || link.youtube_video_id,
      url: link.url || link.youtube_url,
      title: link.title || link.youtube_title || "Watch full movie on YouTube",
      channel: link.channel || link.youtube_channel || "",
      duration_seconds: link.duration_seconds,
      duration_label: link.duration_label || formatDuration(link.duration_seconds),
      view_count: link.view_count,
      view_label: formatViews(link.view_count),
      audio_language: link.audio_language || link.youtube_language || "",
      audio_language_label: languageLabel(link.audio_language || link.youtube_language),
      is_dubbed: Boolean(link.is_dubbed),
      label: link.label || youtubeLinkLabel(link),
      match_score: link.match_score,
      match_type: link.match_type,
      source: link.source || "youtube",
    }))
    .filter((link) => {
      if (seen.has(link.video_id)) return false;
      seen.add(link.video_id);
      return true;
    });
}
