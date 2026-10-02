import type { Metadata } from "next";
import type { MovieDetail } from "@/lib/api";

const SITE_ORIGIN = "https://www.flixyfy.com";

export function movieCanonicalUrl(movie: MovieDetail, routeKey: string): string {
  const canonicalKey = movie.canonical_movie_id || routeKey;
  return `${SITE_ORIGIN}/movie/${encodeURIComponent(canonicalKey)}`;
}

function validImage(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function movieDescription(movie: MovieDetail): string {
  const title = movie.title.trim();
  return `Explore where ${title} is available to watch in India, including OTT services and approved YouTube full-movie links when tracked by FLIXYFY.`;
}

export function movieMetadata(movie: MovieDetail, routeKey: string): Metadata {
  const title = movie.release_year
    ? `${movie.title} (${movie.release_year}) – Where to Watch in India | FLIXYFY`
    : `${movie.title} – Where to Watch in India | FLIXYFY`;
  const description = movieDescription(movie);
  const canonical = movieCanonicalUrl(movie, routeKey);
  const image = validImage(movie.poster_url);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: {
      type: "video.movie",
      siteName: "FLIXYFY",
      title,
      description,
      url: canonical,
      ...(image ? { images: [{ url: image, alt: `${movie.title} poster` }] } : {}),
    },
    twitter: {
      card: image ? "summary_large_image" : "summary",
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
    robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  };
}

function validDateOnly(value: string | null | undefined): string | undefined {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return undefined;
  const date = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value
    ? value
    : undefined;
}

export function movieStructuredData(movie: MovieDetail, routeKey: string): Record<string, unknown> {
  const image = validImage(movie.poster_url);
  const imdbUrl = movie.imdb_id && /^tt\d+$/.test(movie.imdb_id)
    ? `https://www.imdb.com/title/${movie.imdb_id}/`
    : undefined;
  const language = movie.original_language && /^[a-z]{2,3}(?:-[A-Z]{2})?$/.test(movie.original_language)
    ? movie.original_language
    : undefined;
  const releaseDate = validDateOnly((movie as MovieDetail & { release_date?: string | null }).release_date);

  return {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    url: movieCanonicalUrl(movie, routeKey),
    ...(image ? { image } : {}),
    ...(releaseDate ? { datePublished: releaseDate } : {}),
    ...(language ? { inLanguage: language } : {}),
    ...(imdbUrl ? { sameAs: [imdbUrl] } : {}),
  };
}

export function jsonLdScriptValue(value: Record<string, unknown>): string {
  return JSON.stringify(value).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
