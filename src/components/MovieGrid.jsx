import MovieCard from "./MovieCard";
import "./MovieCard.css";

function MovieGrid({ movies }) {
    return (
        <div className="movie-grid">
            {movies.map((m, i) => (
                <MovieCard key={`${m.domain || "movie"}-${m.slug || m.tmdb_id || i}`} movie={m} />
            ))}
        </div>
    );
}

export default MovieGrid;
