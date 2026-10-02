"use client";

import { useState } from "react";
import { providerPresentation } from "@/lib/providerPresentation";

export default function ProviderLogo({
  providerKey,
  providerName,
  compact = false,
}: {
  providerKey?: string | null;
  providerName?: string | null;
  compact?: boolean;
}) {
  const { logo: src, label } = providerPresentation(providerKey, providerName);
  const logoSrc = src ?? "";
  const [failedSrc, setFailedSrc] = useState("");
  const showImage = Boolean(logoSrc && failedSrc !== logoSrc);
  const name = label;

  if (showImage) {
    return (
      <span className={compact ? "provider-logo compact" : "provider-logo"} aria-hidden="true">
        <img src={logoSrc} alt="" loading="lazy" onError={() => setFailedSrc(logoSrc)} />
      </span>
    );
  }

  return (
    <span className={compact ? "provider-logo-fallback compact" : "provider-logo-fallback"} aria-hidden="true">
      {name.slice(0, 2).toUpperCase()}
    </span>
  );
}
