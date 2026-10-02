import { cache } from "react";
import {
  movieApiPath,
  normalizeBackdropUrl,
  normalizePosterUrl,
  type AvailabilityOption,
  type Movie,
  type MovieDetail,
} from "@/lib/api";

export type MovieDomain = Movie["domain"];

type BackendMovieDetail = MovieDetail & {
  youtube?: AvailabilityOption[];
  youtube_versions?: AvailabilityOption[];
};

function apiOrigin(): string {
  return (
    process.env.NEXT_PUBLIC_FLIXYFY_API_URL?.trim().replace(/\/+$/, "") ||
    "https://flixyfy-api-free.vercel.app"
  );
}

async function fetchMovie(routeKey: string, domain: MovieDomain): Promise<MovieDetail | null> {
  const response = await fetch(`${apiOrigin()}${movieApiPath(routeKey, domain)}`, {
    headers: { accept: "application/json" },
    next: { revalidate: 300 },
  });

  if (response.status === 404) return null;
  if (!response.ok) return null;

  const movie = (await response.json()) as BackendMovieDetail;
  const ott = (movie.providers ?? []).map((item) => ({ ...item, media_kind: "ott" as const }));
  const youtube = (movie.youtube ?? movie.youtube_versions ?? []).map((item) => ({ ...item, media_kind: "youtube" as const }));
  return {
    ...movie,
    poster_url: normalizePosterUrl(movie.poster_url) || null,
    backdrop_url: normalizeBackdropUrl(movie.backdrop_url) || null,
    providers: movie.providers ?? [],
    availability: [...ott, ...youtube],
    genres: movie.genres ?? [],
    languages: movie.languages ?? [],
    cast: movie.cast ?? [],
    crew: movie.crew ?? [],
  };
}

export const getServerMovie = cache(
  async (routeKey: string, requestedDomain: MovieDomain | null): Promise<MovieDetail | null> => {
    if (requestedDomain) {
      try {
        return await fetchMovie(routeKey, requestedDomain);
      } catch {
        return null;
      }
    }

    const [current, historical] = await Promise.allSettled([
      fetchMovie(routeKey, "current"),
      fetchMovie(routeKey, "historical"),
    ]);
    const currentMovie = current.status === "fulfilled" ? current.value : null;
    const historicalMovie = historical.status === "fulfilled" ? historical.value : null;

    if (currentMovie && historicalMovie) return null;
    if (currentMovie) return currentMovie;
    if (historicalMovie) return historicalMovie;
    return null;
  },
);
