type Movie = {
  tmdb_id: number;
  title: string;
  slug: string;
  movie_url: string;
  release_year: number;
  primary_language: string;
  language_slug: string;
  genres: string | null;
  poster_url: string | null;
  overview: string | null;
  runtime: number | null;
  rating: number | null;
  vote_count: number | null;
  ott_primary: string | null;
  ott_count: number;
  has_ott: number;
};

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000";

const LANGUAGE_LABELS: Record<string, string> = {
  hindi: "Hindi",
  tamil: "Tamil",
  malayalam: "Malayalam",
  telugu: "Telugu",
  bengali: "Bengali",
  kannada: "Kannada",
  marathi: "Marathi",
  punjabi: "Punjabi",
  gujarati: "Gujarati",
  odia: "Odia",
  assamese: "Assamese",
};

async function getLanguageMovies(language: string): Promise<Movie[]> {
  const res = await fetch(`${API_BASE}/api/language/${language}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) return [];

  const data = await res.json();
  return data.movies || [];
}

export async function generateMetadata({
  params,
}: {
  params: { language: string };
}) {
  const language = params.language;
  const label = LANGUAGE_LABELS[language] || language;

  return {
    title: `Watch ${label} Movies Online in India | WATCHINDIA`,
    description: `Discover ${label} movies available across Indian OTT platforms. Search by rating, year, genre and streaming availability.`,
    alternates: {
      canonical: `/language/${language}`,
    },
  };
}

export default async function LanguagePage({
  params,
}: {
  params: { language: string };
}) {
  const language = params.language;
  const label = LANGUAGE_LABELS[language] || language;
  const movies = await getLanguageMovies(language);

  return (
    <main className="min-h-screen bg-black text-white px-6 py-8">
      <section className="max-w-7xl mx-auto">
        <div className="mb-8">
          <p className="text-sm text-gray-400 uppercase tracking-wide">
            WATCHINDIA Language Collection
          </p>

          <h1 className="text-3xl md:text-5xl font-bold mt-2">
            Watch {label} Movies Online in India
          </h1>

          <p className="text-gray-300 mt-4 max-w-3xl">
            Explore {label} movies from 2000 to 2026 with ratings, genres,
            posters and OTT availability.
          </p>

          <p className="text-gray-400 mt-2">
            {movies.length} movies shown from WATCHINDIA MVP catalog.
          </p>
        </div>

        {movies.length === 0 ? (
          <div className="border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-semibold">No movies found</h2>
            <p className="text-gray-400 mt-2">
              This language page is active, but no movies are currently available.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
            {movies.map((movie) => (
              <a
                key={movie.tmdb_id}
                href={movie.movie_url}
                className="group block"
              >
                <div className="aspect-[2/3] bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
                  {movie.poster_url ? (
                    <img
                      src={movie.poster_url}
                      alt={movie.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-500 text-sm text-center px-2">
                      No Poster
                    </div>
                  )}
                </div>

                <h2 className="text-sm font-semibold mt-2 line-clamp-2">
                  {movie.title}
                </h2>

                <p className="text-xs text-gray-400 mt-1">
                  {movie.release_year || "Unknown"}
                  {movie.rating ? ` • ${movie.rating.toFixed(1)}` : ""}
                </p>

                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                  {movie.ott_primary
                    ? `Watch on ${movie.ott_primary}`
                    : "OTT unavailable"}
                </p>
              </a>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}