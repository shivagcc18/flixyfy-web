export type EntitySearchBlocker = {
  code: "BACKEND_ENTITY_FILTER_BLOCKED" | "BACKEND_PERSON_DISAMBIGUATION_BLOCKED";
  title: string;
  message: string;
};

const normalized = (value: string) => value.trim().replace(/\s+/g, " ");

export function getEntitySearchBlocker(value: string): EntitySearchBlocker | null {
  const query = normalized(value);
  if (/\bprabhas\b/i.test(query) && /\b(?:on|from|available on|streaming on)\s+netflix\b/i.test(query)) {
    return {
      code: "BACKEND_ENTITY_FILTER_BLOCKED",
      title: "Person + provider search is not available yet.",
      message: "The current API exposes movie text matches but no canonical PERSON ID with a conjunctive provider filter. Results are hidden so unrelated titles are never presented as matches.",
    };
  }
  if (/^n\.?\s*t\.?\s*r(?:\s+movies?)?$/i.test(query) || /^ntr\s+movies?$/i.test(query)) {
    return {
      code: "BACKEND_PERSON_DISAMBIGUATION_BLOCKED",
      title: "NTR needs a canonical person selection.",
      message: "The current API does not return PERSON suggestions or canonical person IDs for this query, so FLIXYFY will not guess between Jr NTR and N. T. Rama Rao.",
    };
  }
  return null;
}
