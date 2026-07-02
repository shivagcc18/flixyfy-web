// src/components/WatchProviders.jsx

import React from "react";
import {
  normalizeProviderRows,
  providerName,
  providerLogo,
  providerUrl,
  providerLinkType,
} from "../utils/providerLinks";
import "./WatchProviders.css";

function fallbackInitial(name) {
  const clean = String(name || "").trim();
  return clean ? clean[0].toUpperCase() : "?";
}

function ProviderLogo({ provider, name }) {
  const logo = providerLogo(provider);

  if (logo) {
    return (
      <img
        className="watch-provider-logo"
        src={logo}
        alt={name}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return <span className="watch-provider-fallback-logo">{fallbackInitial(name)}</span>;
}

export default function WatchProviders({
  providers = [],
  title = "",
  contentTitle = "",
  heading = "Where to watch",
  emptyText = "No provider links available yet.",
  className = "",
}) {
  const displayTitle = contentTitle || title || "";
  const normalized = normalizeProviderRows(providers, displayTitle);

  if (!normalized.length) {
    return (
      <section className={`watch-providers ${className}`.trim()}>
        <h3>{heading}</h3>
        <p className="watch-provider-empty">{emptyText}</p>
      </section>
    );
  }

  return (
    <section className={`watch-providers ${className}`.trim()}>
      <h3>{heading}</h3>

      <div className="watch-provider-list">
        {normalized.map((item, index) => {
          const raw = item.raw || item.provider;
          const name = item.name || providerName(raw) || "Provider";
          const url = item.url || providerUrl(raw, displayTitle);
          const linkType = item.link_type || providerLinkType(raw);

          const content = (
            <>
              <ProviderLogo provider={raw} name={name} />
              <span className="watch-provider-name">{name}</span>
              {linkType === "fallback" ? (
                <span className="watch-provider-fallback-label">Fallback</span>
              ) : null}
            </>
          );

          if (!url) {
            return (
              <span
                key={`${name}-${index}`}
                className="watch-provider-chip watch-provider-disabled"
                title="No provider link available"
              >
                {content}
              </span>
            );
          }

          return (
            <a
              key={`${name}-${index}`}
              className="watch-provider-chip"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              title={url}
            >
              {content}
            </a>
          );
        })}
      </div>
    </section>
  );
}