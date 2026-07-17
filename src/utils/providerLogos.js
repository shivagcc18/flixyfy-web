import { getProviderLogo as resolveProviderLogo, getProviderLogoCandidates } from "./providerLogo";

export { getProviderLogoCandidates };

export function getProviderLogo(providerKey, providerName) {
  return resolveProviderLogo(providerKey, providerName);
}
