import React from "react";
import { getBestProviderUrl, openProviderUrl } from "../utils/providerLinks";
import { trackProviderClick } from "../utils/analytics";

function cleanProviderName(provider) {
  return (
    provider?.provider ||
    provider?.provider_name ||
    provider?.name ||
    provider?.provider_key ||
    "Watch"
  );
}

function cleanProviderType(provider) {
  return (
    provider?.category ||
    provider?.type ||
    provider?.provider_type ||
    provider?.raw_type ||
    "available"
  );
}

export default function WatchProviders({ providers = [], ottAll = [], movieTitle = "" }) {
  const list = Array.isArray(providers) && providers.length ? providers : ottAll;

  if (!Array.isArray(list) || list.length === 0) {
    return (
      <div style={{ marginTop: "24px" }}>
        <h2>Where to Watch</h2>
        <p>OTT availability not added yet.</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "24px" }}>
      <h2>Where to Watch</h2>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {list.map((provider, index) => {
          const name = cleanProviderName(provider);
          const type = cleanProviderType(provider);
          const url = getBestProviderUrl(provider);

          return (
            <button
              key={`${name}-${type}-${index}`}
              type="button"
              onClick={() => {
                trackProviderClick(name, movieTitle);

                openProviderUrl(provider, movieTitle);
              }}
              style={{
                cursor: url ? "pointer" : "default",
                background: "#111",
                color: "#fff",
                border: "1px solid #333",
                borderRadius: "10px",
                padding: "12px 16px",
                minWidth: "140px",
                textAlign: "left",
              }}
              title={url || "No provider link available"}
            >
              <strong>{name}</strong>
              <div style={{ fontSize: "13px", opacity: 0.75 }}>{type}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
