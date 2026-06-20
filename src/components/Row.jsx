import MovieCard from "./MovieCard";
import "./Row.css";

export default function Row({ title, movies = [] }) {
  if (!movies.length) return null;

  return (
    <section className="movie-section">
      {title && <h2 className="section-title">{title}</h2>}

      <div className="movie-row">
        {movies.map((movie) => (
          <MovieCard key={movie.tmdb_id || movie.slug} movie={movie} />
        ))}
      </div>
    </section>
  );
}