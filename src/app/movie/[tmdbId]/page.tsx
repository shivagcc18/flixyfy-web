import MovieDetailClient from "@/components/MovieDetailClient";

export default async function MoviePage({ params }: { params: Promise<{ tmdbId: string }> }) {
  const { tmdbId } = await params;
  return <MovieDetailClient tmdbId={tmdbId} />;
}
