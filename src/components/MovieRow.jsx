import MovieCard from "./MovieCard";
import "./MovieCard.css";

export default function MovieRow({ title, movies }) {
    return (
        <div style={{ marginBottom: "30px" }}>
            <h2>{title}</h2>

            <div className="movie-row">
                {movies.map((m, i) => (
                    <MovieCard key={m.tmdb_id || i} movie={m} />
                ))}
            </div>
        </div>
    );
}