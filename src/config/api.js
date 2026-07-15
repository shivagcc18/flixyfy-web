const FRESH_API_BASE = "https://flixyfy-api-fresh-production.up.railway.app";

function normalizeApiBase(value) {
  const clean = String(value || "").trim().replace(/\/+$/, "");

  if (!clean || clean.includes("flixyfy-api-production.up.railway.app")) {
    return FRESH_API_BASE;
  }

  return clean.replace(/\/api\/v[34]$/i, "");
}

export const API_BASE = normalizeApiBase(
  import.meta.env.VITE_API_BASE ||
    import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_API_URL ||
    FRESH_API_BASE
);

export default API_BASE;
