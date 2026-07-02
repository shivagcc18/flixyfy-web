// src/utils/providerLinks.js

import { getProviderClickUrl, getProviderLinkType } from "./providerDirectLinks";

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

export function getBestProviderUrl(provider, title = "") {
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

export function normalizeProviderRows(providers, title = "") {
  if (!Array.isArray(providers)) return [];

  return providers
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