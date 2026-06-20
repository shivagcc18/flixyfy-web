import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { getMovie } from "../api/watchindiaApi";
import { trackProviderClick } from "../utils/analytics";
function buildPosterUrl(path) {
  if (!path) return "/no-poster.png";
  if (path.startsWith("http")) return path;
  return `https://image.tmdb.org/t/p/w500${path}`;
}

function providerLogo(providerKey, providerName) {
  const raw = providerKey || providerName || "";
  const key = raw.toLowerCase().replace(/_/g, "-").replace(/\s+/g, "-");

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
    youtube: "/ott/youtube.png",
  };

  return logoMap[key] || null;
}

function getOttUrl(ott) {
  return (
    ott?.final_url ||
    ott?.provider_deep_link ||
    ott?.provider_search_url ||
    ott?.fallback_search_url ||
    ott?.homepage_url ||
    ott?.provider_homepage_url ||
    ott?.tmdb_watch_url ||
    null
  );
}

function getYoutubeUrl(yt) {
  if (yt?.video_url) return yt.video_url;
  if (yt?.youtube_url) return yt.youtube_url;
  if (yt?.url) return yt.url;
  if (yt?.video_id) return `https://www.youtube.com/watch?v=${yt.video_id}`;
  return null;
}

function formatViews(value) {
  if (!value) return null;
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  if (n >= 10000000) return `${(n / 10000000).toFixed(1)}Cr views`;
  if (n >= 100000) return `${(n / 100000).toFixed(1)}L views`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K views`;
  return `${n} views`;
}

function updateMeta(name, content) {
  document.querySelector(`meta[name="${name}"]`)?.setAttribute("content", content);
}

function updateOg(property, content) {
  let tag = document.querySelector(`meta[property="${property}"]`);

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", content);
}

function addMovieSchema(movie, poster) {
  const oldSchema = document.getElementById("movie-schema-json");
  if (oldSchema) oldSchema.remove();

  const schema = {
    "@context": "https://schema.org",
    "@type": "Movie",
    name: movie.title,
    description: movie.overview || `${movie.title} movie streaming availability on Flixyfy.`,
    image: poster,
    datePublished: movie.release_year ? String(movie.release_year) : undefined,
    inLanguage: movie.primary_language || undefined,
    director:
      movie.director && movie.director !== "N/A"
        ? {
            "@type": "Person",
            name: movie.director,
          }
        : undefined,
    aggregateRating: movie.rating
      ? {
          "@type": "AggregateRating",
          ratingValue: Number(movie.rating).toFixed(1),
          bestRating: "10",
          worstRating: "1",
          ratingCount: "1",
        }
      : undefined,
  };

  const script = document.createElement("script");
  script.id = "movie-schema-json";
  script.type = "application/ld+json";
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
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

  useEffect(() => {
    if (!movie) return;

    const poster = buildPosterUrl(movie.poster_url);
    const yearText = movie.release_year ? ` (${movie.release_year})` : "";
    const title = `${movie.title}${yearText} - Where to Watch | Flixyfy`;
    const description = movie.overview
      ? movie.overview.slice(0, 155)
      : `Find where to watch ${movie.title}${yearText} online across Indian OTT platforms.`;

    document.title = title;

    updateMeta("description", description);
    updateOg("og:title", title);
    updateOg("og:description", description);
    updateOg("og:type", "video.movie");
    updateOg("og:image", poster);
    updateOg("og:url", `https://flixyfy.com/movie/${slug}`);

    addMovieSchema(movie, poster);
  }, [movie, slug]);

  if (error) {
    return <div style={{ color: "white", padding: 30 }}>Movie not found</div>;
  }

  if (!movie) {
    return <div style={{ color: "white", padding: 30 }}>Loading...</div>;
  }

  const poster = buildPosterUrl(movie.poster_url);

  const youtubeMovies = (
    movie.youtube_full_movies ||
    movie.youtube_variants ||
    movie.youtube ||
    []
  )
    .filter((yt) => getYoutubeUrl(yt))
    .slice(0, 5);

  const displayRuntime =
    movie.omdb_runtime || (movie.runtime ? `${movie.runtime} min` : null);

  const displayGenres =
    movie.omdb_genre ||
    (Array.isArray(movie.genres) && movie.genres.length > 0
      ? movie.genres.join(", ")
      : null);

  return (
    <div style={pageStyle}>
      <img
        src={poster}
        alt={movie.title}
        style={posterStyle}
        loading="eager"
        decoding="async"
      />

      <div style={{ width: "100%" }}>
        <h1>{movie.title}</h1>

        <p>
          {movie.release_year} • {movie.primary_language}
        </p>

        <div style={badgeWrapStyle}>
          {movie.rating && (
            <span style={badgeStyle}>TMDB {Number(movie.rating).toFixed(1)}</span>
          )}

          {movie.imdb_rating && (
            <span style={imdbBadgeStyle}>IMDb {movie.imdb_rating}</span>
          )}

          {displayRuntime && <span style={badgeStyle}>{displayRuntime}</span>}

          {displayGenres && <span style={badgeStyle}>{displayGenres}</span>}
        </div>

        <h2>Watch On</h2>

        {movie.ott_all && movie.ott_all.length > 0 ? (
          <div style={buttonWrapStyle}>
            {movie.ott_all.map((ott, index) => {
              const providerName =
                ott.provider_display_name || ott.provider || ott.button_label || "OTT";
              const logo = providerLogo(ott.provider_key, providerName);
              const url = getOttUrl(ott);

              return (
                <a
                  key={`${ott.provider_key || providerName}-${index}`}
                  href={url || "#"}
                  target={url ? "_blank" : undefined}
                  onClick={() => trackProviderClick(providerName, movie.title)}
                  rel={url ? "noopener noreferrer" : undefined}
                  onClick={(e) => {
                    if (!url) e.preventDefault();
                  }}
                  style={ottButtonStyle(Boolean(url))}
                >
                  {logo ? (
                    <img
                      src={logo}
                      alt={providerName}
                      style={logoStyle}
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <span style={fallbackIconStyle}>
                      {providerName.slice(0, 2).toUpperCase()}
                    </span>
                  )}

                  <span>{providerName}</span>
                </a>
              );
            })}
          </div>
        ) : (
          <p>OTT availability not found.</p>
        )}

        {youtubeMovies.length > 0 && (
          <>
            <h2>Watch Free on YouTube</h2>

            <div style={buttonWrapStyle}>
              {youtubeMovies.map((yt, index) => {
                const views = formatViews(yt.view_count);
                const url = getYoutubeUrl(yt);

                return (
                  <a
                    key={`${yt.video_id || url}-${index}`}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={youtubeButtonStyle}
                  >
                    <span style={youtubeIconStyle}>▶</span>

                    <span>
                      Watch Free
                      {yt.youtube_language ? ` • ${yt.youtube_language}` : ""}
                      {views ? ` • ${views}` : ""}
                    </span>
                  </a>
                );
              })}
            </div>
          </>
        )}

        <h2>Overview</h2>

        <p style={overviewStyle}>{movie.overview || "Overview not available."}</p>

        <div style={infoGridStyle}>
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

const pageStyle = {
  background: "#141414",
  minHeight: "100vh",
  padding: "30px",
  color: "white",
  display: "flex",
  gap: "30px",
  alignItems: "flex-start",
};

const posterStyle = {
  width: "280px",
  borderRadius: "12px",
  height: "420px",
  objectFit: "cover",
};

const badgeWrapStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: "10px",
  margin: "14px 0 18px",
};

const badgeStyle = {
  background: "#222",
  color: "#fff",
  padding: "6px 10px",
  borderRadius: "10px",
  fontWeight: "700",
};

const imdbBadgeStyle = {
  ...badgeStyle,
  background: "#f5c518",
  color: "#111",
  fontWeight: "800",
};

const buttonWrapStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "24px",
};

const logoStyle = {
  width: "28px",
  height: "28px",
  objectFit: "contain",
};

const fallbackIconStyle = {
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  background: "#444",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "12px",
};

const youtubeIconStyle = {
  ...fallbackIconStyle,
  background: "#ff0000",
  color: "#fff",
  fontWeight: "900",
};

const youtubeButtonStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  background: "#2a1111",
  padding: "10px 14px",
  borderRadius: "18px",
  fontWeight: "800",
  border: "1px solid #ff0000",
  textDecoration: "none",
  color: "#fff",
  cursor: "pointer",
};

const overviewStyle = {
  maxWidth: "700px",
  lineHeight: "1.6",
};

const infoGridStyle = {
  marginTop: "18px",
  display: "grid",
  gap: "10px",
  maxWidth: "700px",
};

function ottButtonStyle(active) {
  return {
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
    cursor: active ? "pointer" : "not-allowed",
  };
}