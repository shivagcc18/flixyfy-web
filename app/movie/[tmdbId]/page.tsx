import MovieDetailClient from "@/components/MovieDetailClient";
import { getServerMovie, type MovieDomain } from "@/lib/server-movie";
import { jsonLdScriptValue, movieMetadata, movieStructuredData } from "@/lib/movie-seo";

type RouteProps = {
  params: Promise<{ tmdbId: string }>;
  searchParams: Promise<{ domain?: string | string[] }>;
};

async function routeMovie({ params, searchParams }: RouteProps) {
  const [{ tmdbId }, query] = await Promise.all([params, searchParams]);
  const domainValue = Array.isArray(query.domain) ? query.domain[0] : query.domain;
  const domain: MovieDomain | null = domainValue === "current" || domainValue === "historical" ? domainValue : null;
  const movie = await getServerMovie(tmdbId, domain);
  return { tmdbId, movie };
}

export async function generateMetadata(props: RouteProps) {
  const { tmdbId, movie } = await routeMovie(props);
  if (movie) return movieMetadata(movie, tmdbId);

  return {
    title: { absolute: "Movie unavailable | FLIXYFY" },
    alternates: { canonical: `https://www.flixyfy.com/movie/${encodeURIComponent(tmdbId)}` },
    robots: { index: false, follow: true },
  };
}

export default async function MoviePage({
  params,
  searchParams,
}: RouteProps) {
  const { tmdbId, movie } = await routeMovie({ params, searchParams });
  const schema = movie ? movieStructuredData(movie, tmdbId) : null;

  return (
    <>
      {schema ? <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScriptValue(schema) }} /> : null}
      <MovieDetailClient tmdbId={tmdbId} initialMovie={movie} />
    </>
  );
}
