export const LANGUAGE_NAMES: Record<string, string> = {
  as: "Assamese",
  bn: "Bengali",
  bho: "Bhojpuri",
  gu: "Gujarati",
  hi: "Hindi",
  kn: "Kannada",
  ml: "Malayalam",
  mr: "Marathi",
  or: "Odia",
  pa: "Punjabi",
  ta: "Tamil",
  te: "Telugu",
  ur: "Urdu",
};

export const LANGUAGE_ALIASES: Record<string, string> = {
  assamese: "as", bengali: "bn", bhojpuri: "bho", gujarati: "gu", hindi: "hi",
  kannada: "kn", malayalam: "ml", marathi: "mr", odia: "or", oriya: "or",
  punjabi: "pa", tamil: "ta", telugu: "te", urdu: "ur",
};

export function normalizeLanguageCode(value?: string | null) {
  const raw = String(value ?? "").trim().toLowerCase().replace(/[- ]+/g, "_");
  return LANGUAGE_NAMES[raw] ? raw : LANGUAGE_ALIASES[raw] ?? raw;
}

export const FEATURED_LANGUAGES = [
  { value: "", label: "All" },
  { value: "te", label: "Telugu" },
  { value: "hi", label: "Hindi" },
  { value: "ta", label: "Tamil" },
  { value: "ml", label: "Malayalam" },
  { value: "kn", label: "Kannada" },
  { value: "bn", label: "Bengali" },
  { value: "mr", label: "Marathi" },
] as const;

export function languageName(value?: string | null) {
  if (!value) return "Unknown language";
  const normalized = normalizeLanguageCode(value);
  return LANGUAGE_NAMES[normalized] ?? value;
}
