import { languageName } from "./languages";

export type SearchIntent = {
  query: string;
  domain?: "current" | "historical";
  language?: string;
  genre?: string;
  provider?: string;
  providerName?: string;
  contentType?: "movie" | "web-series";
  yearFrom?: string;
  yearTo?: string;
  chips: { key: string; label: string; value: string }[];
};

type ProviderAuthority = { provider_key: string; provider_name: string };

const LANGUAGE_ALIASES: Record<string, string> = {
  assamese: "as", bengali: "bn", bhojpuri: "bho", gujarati: "gu", hindi: "hi",
  kannada: "kn", malayalam: "ml", marathi: "mr", odia: "or", oriya: "or",
  punjabi: "pa", tamil: "ta", telugu: "te", urdu: "ur",
};

const GENRES = ["action", "comedy", "drama", "romance", "thriller", "family", "horror", "crime"];

function escapeRegExp(value: string) {
  return value.replace(/[|\\{}()[\]^$+*?.-]/g, "\\$&");
}

export function serializeSearchParams(values: Record<string, string | undefined | null>) {
  const params = new URLSearchParams();
  const orderedKeys = ["q", "domain", "language", "genre", "provider", "content_type", "year", "year_from", "year_to"];
  for (const key of orderedKeys) {
    const value = values[key]?.trim();
    if (!value || (key === "domain" && value === "current") || (key === "content_type" && value === "movie")) continue;
    params.set(key, value);
  }
  return params.toString();
}

export function parseSearchIntent(input: string, providers: ProviderAuthority[] = []): SearchIntent {
  const source = input.trim();
  let query = source;
  const chips: SearchIntent["chips"] = [];
  let provider: ProviderAuthority | undefined;

  for (const candidate of providers) {
    const pattern = new RegExp(`\\s+(?:on|from|available\\s+on)\\s+${escapeRegExp(candidate.provider_name)}\\b`, "i");
    if (pattern.test(query)) {
      provider = candidate;
      query = query.replace(pattern, " ").replace(/\s+/g, " ").trim();
      break;
    }
  }

  const yearDecade = query.match(/\b(19|20)(\d)0s\b/i);
  let yearFrom: string | undefined;
  let yearTo: string | undefined;
  if (yearDecade) {
    yearFrom = `${yearDecade[1]}${yearDecade[2]}0`;
    yearTo = `${yearDecade[1]}${yearDecade[2]}9`;
    query = query.replace(yearDecade[0], "").replace(/\s+/g, " ").trim();
    chips.push({ key: "year", label: "Years", value: `${yearFrom}-${yearTo}` });
  }

  let language: string | undefined;
  for (const [label, code] of Object.entries(LANGUAGE_ALIASES)) {
    const match = new RegExp(`\\b${label}\\b`, "i").exec(query);
    if (match) {
      language = code;
      query = query.replace(match[0], "").replace(/\s+/g, " ").trim();
      chips.push({ key: "language", label: "Language", value: languageName(code) });
      break;
    }
  }

  let genre: string | undefined;
  for (const candidate of GENRES) {
    const match = new RegExp(`\\b${candidate}\\b`, "i").exec(query);
    if (match) {
      genre = candidate[0].toUpperCase() + candidate.slice(1);
      query = query.replace(match[0], "").replace(/\s+/g, " ").trim();
      chips.push({ key: "genre", label: "Genre", value: genre });
      break;
    }
  }

  const classic = /\b(classics?|historical)\b/i.test(query);
  if (classic) {
    query = query.replace(/\b(classics?|historical)\b/i, "").replace(/\s+/g, " ").trim();
    chips.push({ key: "domain", label: "Browse", value: "Indian classics" });
  }

  const webSeries = /\b(web\s+series|webseries|series)\b/i.test(query);
  if (webSeries) {
    query = query.replace(/\b(web\s+series|webseries|series)\b/i, "").replace(/\s+/g, " ").trim();
    chips.push({ key: "content_type", label: "Type", value: "Web series" });
  } else if (/\bmovies?\b/i.test(query)) {
    query = query.replace(/\bmovies?\b/i, "").replace(/\s+/g, " ").trim();
  }

  if (provider) chips.push({ key: "provider", label: "Provider", value: provider.provider_name });

  const domain = classic || (yearFrom && Number(yearFrom) < 2000) ? "historical" : undefined;
  return {
    query: query.replace(/\s+/g, " ").trim(),
    domain,
    language,
    genre,
    provider: provider?.provider_key,
    providerName: provider?.provider_name,
    contentType: webSeries ? "web-series" : undefined,
    yearFrom,
    yearTo,
    chips,
  };
}
