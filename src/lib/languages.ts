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
  const normalized = value.trim().toLowerCase();
  return LANGUAGE_NAMES[normalized] ?? value;
}
