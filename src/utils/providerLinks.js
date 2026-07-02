// src/utils/providerLinks.js

import { getProviderClickUrl, getProviderLinkType } from "./providerDirectLinks";

function asArray(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  return [value];
}

export function providerName(provider) {
  if (!provider) return "";

  if (typeof provider === "string") {
    return provider;
  }

  return (
    provider.provider ||
    provider.provider_name ||
    provider.providerName ||
    provider.normalized_provider_name ||
    provider.name ||
    provider.title ||
    ""
  );
}

export function providerLogo(provider) {
  if (!provider || typeof provider === "string") return "";

  return (
    provider.logo_url ||
    provider.logoUrl ||
    provider.provider_logo ||
    provider.providerLogo ||
    provider.logo ||
    provider.icon ||
    ""
  );
}

export function providerUrl(provider, title = "") {
  return getProviderClickUrl(provider, title);
}

export function getProviderUrl(provider, title = "") {
  return getProviderClickUrl(provider, title);
}

export function getProviderLink(provider, title = "") {
  return getProviderClickUrl(provider, title);
}

export function resolveProviderUrl(provider, title = "") {
  return getProviderClickUrl(provider, title);
}

export function providerHref(provider, title = "") {
  return getProviderClickUrl(provider, title);
}

export function providerLinkType(provider) {
  return getProviderLinkType(provider);
}

// Backward-compatible export used by MovieDetail, DomainDetail, WebseriesDetail.
// Supports:
//   getBestProviderUrl(provider, title)
//   getBestProviderUrl(providersArray, title)
//   getBestProviderUrl(movie.ott_all, movie.title)
export function getBestProviderUrl(providerOrProviders, title = "") {
  const providers = asArray(providerOrProviders);

  for (const provider of providers) {
    const url = getProviderClickUrl(provider, title);
    if (url) return url;
  }

  return "";
}

export function normalizeProviderRows(providers, title = "") {
  return asArray(providers)
    .map((provider) => {
      const name = providerName(provider);
      const url = getProviderClickUrl(provider, title);

      if (!name && !url) return null;

      return {
        raw: provider,
        name,
        provider,
        logo: providerLogo(provider),
        url,
        href: url,
        link_type: getProviderLinkType(provider),
      };
    })
    .filter(Boolean);
}