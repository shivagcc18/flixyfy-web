const configuredApiBase = process.env.NEXT_PUBLIC_FLIXYFY_API_URL?.trim();

export const API_BASE =
  configuredApiBase?.replace(/\/+$/, "") ??
  (process.env.NODE_ENV === "production" ? "" : "http://127.0.0.1:8000");

export default API_BASE;
