"use client";

import { useState } from "react";

const KNOWN_PROVIDER_LOGOS: Record<string, string> = {
  "aha": "/ott/aha.png",
  "aha-video": "/ott/aha.png",
  "amazon-prime": "/ott/prime-video.png",
  "amazon-prime-video": "/ott/prime-video.png",
  "amazon-video": "/ott/prime-video.png",
  "amazon-video-store": "/ott/prime-video.png",
  "apple-tv": "/ott/AppleTV.png",
  "apple-tv-store": "/ott/AppleTV.png",
  "etv-win": "/ott/etv-win.png",
  "etvwin": "/ott/etv-win.png",
  "google-play": "/ott/Google.png",
  "google-play-movies": "/ott/Google.png",
  "hotstar": "/ott/jiohotstar.png",
  "jio-hotstar": "/ott/jiohotstar.png",
  "jiohotstar": "/ott/jiohotstar.png",
  "netflix": "/ott/netflix.png",
  "prime": "/ott/prime-video.png",
  "prime-video": "/ott/prime-video.png",
  "sony-liv": "/ott/sonyliv.png",
  "sonyliv": "/ott/sonyliv.png",
  "sun-nxt": "/ott/sun-nxt.png",
  "sunnxt": "/ott/sun-nxt.png",
  "vi-movies-and-tv": "/ott/VI_movies.png",
  "vi-movies-tv": "/ott/VI_movies.png",
  "youtube": "/logos/indian-providers/youtube.svg",
  "zee5": "/ott/zee5.png",
};

function slug(value?: string | null) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\+/g, " plus ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function logoFor(providerKey?: string | null, providerName?: string | null) {
  const key = slug(providerKey);
  const name = slug(providerName);
  return KNOWN_PROVIDER_LOGOS[key] ?? KNOWN_PROVIDER_LOGOS[name] ?? "";
}

export default function ProviderLogo({
  providerKey,
  providerName,
  compact = false,
}: {
  providerKey?: string | null;
  providerName?: string | null;
  compact?: boolean;
}) {
  const src = logoFor(providerKey, providerName);
  const [failedSrc, setFailedSrc] = useState("");
  const showImage = Boolean(src && failedSrc !== src);
  const name = String(providerName || providerKey || "Provider").trim();

  if (showImage) {
    return (
      <span className={compact ? "provider-logo compact" : "provider-logo"} aria-hidden="true">
        <img src={src} alt="" loading="lazy" onError={() => setFailedSrc(src)} />
      </span>
    );
  }

  return (
    <span className={compact ? "provider-logo-fallback compact" : "provider-logo-fallback"} aria-hidden="true">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}
