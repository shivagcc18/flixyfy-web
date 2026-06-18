export default function Hero({ movie }) {

    if (!movie) return null;

    return (
        <div style={{
            padding: "20px",
            background: "#000",
            marginBottom: "20px"
        }}>

            <h1 style={{ fontSize: "30px" }}>
                {movie.title}
            </h1>

            <p>⭐ {movie.imdb_rating}</p>
            <p>{movie.overview}</p>

            <p style={{ color: "gray" }}>
                {movie.ott_platforms || "No OTT info"}
            </p>

        </div>
    );
}