import MovieCard from "./MovieCard";
import "./MovieCard.css";

export default function Row({ title, movies }) {
    if (!Array.isArray(movies) || movies.length === 0) {
        return null;
    }

    return (
        <section style={{ padding: "20px" }}>
            <h2 style={{ marginBottom: "12px" }}>{title}</h2>

            <div
                style={{
                    display: "flex",
                    gap: "16px",
                    overflowX: "auto",
                    paddingBottom: "12px"
                }}
            >
                {movies.map((movie) => (
                    <MovieCard
                        key={movie.tmdb_id || movie.id}
                        movie={movie}
                    />
                ))}
            </div>
        </section>
    );
}