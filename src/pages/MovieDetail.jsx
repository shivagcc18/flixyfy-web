import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getMovie } from "../api/watchindiaApi";

function buildPosterUrl(path) {
  if (!path) return "/no-poster.png";
  if (path.startsWith("http")) return path;
  return `https://image.tmdb.org/t/p/w500${path}`;
}

function providerLogo(provider) {
  if (!provider) return null;

  const key = provider.toLowerCase().replace(/\s+/g, "-");

  const logoMap = {
    "prime-video": "/ott/prime-video.png",
    netflix: "/ott/netflix.png",
    jiohotstar: "/ott/jiohotstar.png",
    hotstar: "/ott/jiohotstar.png",
    zee5: "/ott/zee5.png",
    sonyliv: "/ott/sonyliv.png",
    "sun-nxt": "/ott/sun-nxt.png",
    aha: "/ott/aha.png",
    "etv-win": "/ott/etv-win.png",
    "vi-movies-and-tv": "/ott/VI_movies.png",
    "google-play-movies": "/ott/Google.png",
    "apple-tv-store": "/ott/AppleTV.png",
  };

  return logoMap[key] || null;
}

function getOttUrl(ott) {
  return (
    ott?.final_url ||
    ott?.fallback_search_url ||
    ott?.homepage_url ||
    ott?.deep_link ||
    null
  );
}

export default function MovieDetail() {
  const { slug } = useParams();
  const [movie, setMovie] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setMovie(null);
    setError("");

    getMovie(slug)
      .then((data) => setMovie(data))
      .catch((err) => setError(err.message));
  }, [slug]);

  if (error) {
    return <div style={{ color: "white", padding: 30 }}>Movie not found</div>;
  }

  if (!movie) {
    return <div style={{ color: "white", padding: 30 }}>Loading...</div>;
  }

  const poster = buildPosterUrl(movie.poster_url);

  const displayRuntime =
    movie.omdb_runtime || (movie.runtime ? `${movie.runtime} min` : null);

  const displayGenres =
    movie.omdb_genre ||
    (Array.isArray(movie.genres) && movie.genres.length > 0
      ? movie.genres.join(", ")
      : null);

  return (
    <div
      style={{
        background: "#141414",
        minHeight: "100vh",
        padding: "30px",
        color: "white",
        display: "flex",
        gap: "30px",
      }}
    >
      <img
        src={poster}
        alt={movie.title}
        style={{
          width: "280px",
          borderRadius: "12px",
          height: "420px",
          objectFit: "cover",
        }}
      />

      <div>
        <h1>{movie.title}</h1>

        <p>
          {movie.release_year} • {movie.primary_language}
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            margin: "14px 0 18px",
          }}
        >
          {movie.rating && (
            <span
              style={{
                background: "#222",
                color: "#fff",
                padding: "6px 10px",
                borderRadius: "10px",
                fontWeight: "700",
              }}
            >
              TMDB {Number(movie.rating).toFixed(1)}
            </span>
          )}

          {movie.imdb_rating && (
            <span
              style={{
                background: "#f5c518",
                color: "#111",
                padding: "6px 10px",
                borderRadius: "10px",
                fontWeight: "800",
              }}
            >
              IMDb {movie.imdb_rating}
            </span>
          )}

          {displayRuntime && (
            <span
              style={{
                background: "#222",
                color: "#fff",
                padding: "6px 10px",
                borderRadius: "10px",
                fontWeight: "700",
              }}
            >
              {displayRuntime}
            </span>
          )}

          {displayGenres && (
            <span
              style={{
                background: "#222",
                color: "#fff",
                padding: "6px 10px",
                borderRadius: "10px",
                fontWeight: "700",
              }}
            >
              {displayGenres}
            </span>
          )}
        </div>

        <h2>Watch On</h2>

        {movie.ott_all && movie.ott_all.length > 0 ? (
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "24px",
            }}
          >
            {movie.ott_all.map((ott, index) => {
              const logo = providerLogo(ott.provider);
              const url = getOttUrl(ott);

              return (
                <a
                  key={`${ott.provider_key || ott.provider}-${index}`}
                  href={url || "#"}
                  target={url ? "_blank" : undefined}
                  rel={url ? "noopener noreferrer" : undefined}
                  onClick={(e) => {
                    if (!url) e.preventDefault();
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    background: "#222",
                    padding: "10px 14px",
                    borderRadius: "18px",
                    fontWeight: "700",
                    border: "1px solid #333",
                    textDecoration: "none",
                    color: "#fff",
                    cursor: url ? "pointer" : "not-allowed",
                  }}
                >
                  {logo ? (
                    <img
                      src={logo}
                      alt={ott.provider}
                      style={{
                        width: "28px",
                        height: "28px",
                        objectFit: "contain",
                      }}
                    />
                  ) : (
                    <span
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        background: "#444",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                      }}
                    >
                      {ott.provider?.slice(0, 2) || "OT"}
                    </span>
                  )}

                  <span>{ott.provider}</span>
                </a>
              );
            })}
          </div>
        ) : (
          <p>OTT availability not found.</p>
        )}

        <h2>Overview</h2>

        <p style={{ maxWidth: "700px", lineHeight: "1.6" }}>
          {movie.overview || "Overview not available."}
        </p>

        <div
          style={{
            marginTop: "18px",
            display: "grid",
            gap: "10px",
            maxWidth: "700px",
          }}
        >
          {movie.director && movie.director !== "N/A" && (
            <div>
              <strong>Director: </strong>
              <span>{movie.director}</span>
            </div>
          )}

          {movie.actors && movie.actors !== "N/A" && (
            <div>
              <strong>Cast: </strong>
              <span>{movie.actors}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}