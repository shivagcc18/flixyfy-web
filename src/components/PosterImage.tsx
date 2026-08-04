"use client";

import { useEffect, useState } from "react";
import { normalizePosterUrl } from "@/lib/api";

export default function PosterImage({
  src,
  alt,
  fallbackLabel,
  detail = false,
}: {
  src?: string | null;
  alt: string;
  fallbackLabel: string;
  detail?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const posterUrl = normalizePosterUrl(src);
  const fallback = fallbackLabel.trim().slice(0, 1).toUpperCase() || "F";

  useEffect(() => {
    setFailed(false);
  }, [posterUrl]);

  if (!posterUrl || failed) {
    return (
      <div className="poster-fallback" role="img" aria-label={alt + " unavailable"}>
        <strong>{fallbackLabel.trim() || "FLIXYFY"}</strong>
        <span>{fallback} � poster unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={posterUrl}
      alt={alt}
      loading={detail ? "eager" : "lazy"}
      decoding="async"
      fetchPriority={detail ? "high" : "auto"}
      onError={() => setFailed(true)}
    />
  );
}
