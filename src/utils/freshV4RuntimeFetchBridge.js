// FLIXYFY_PROVIDER_FILTERS_CORS_AND_V4_GLOBAL_SEARCH_FIX_V1
// Retained as a compatibility module only. Runtime URL rewriting is disabled;
// callers must use the canonical fresh /api/v4 endpoints directly.

export function installFreshV4RuntimeFetchBridge() {
  return { active: false, version: "disabled-v1" };
}

export default installFreshV4RuntimeFetchBridge;