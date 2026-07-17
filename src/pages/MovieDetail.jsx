import YouTubeLinksSection from "../components/YouTubeLinksSection";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { getMovie } from "../api/flixyfyApi";
import { trackProviderClick } from "../utils/analytics";
import { getBestProviderUrl } from "../utils/providerLinks";
import { getProviderLogo } from "../utils/providerLogos";
import { resolvePosterUrl } from "../utils/posterImages";
import { setPageSeo, setJsonLd } from "../utils/seo";
import Footer from "../components/Footer";

function buildPosterUrl(path) {
  return resolvePosterUrl({ poster_url: path }) || "";
}

function getYoutubeUrl(yt) {
  if (yt?.url) return yt.url;
  if (yt?.youtube_url) return yt.youtube_url;
  if (yt?.video_url) return yt.video_url;
  if (yt?.youtube_video_id) {
    return `https://www.youtube.com/watch?v=${yt.youtube_video_id}`;
  }
  if (yt?.video_id) {
    return `https://www.youtube.com/watch?v=${yt.video_id}`;
  }
  return null;
}

function getYoutubeVideoId(yt) {
  if (yt?.video_id) return yt.video_id;
  if (yt?.youtube_video_id) return yt.youtube_video_id;

  const url = getYoutubeUrl(yt);
  if (!url) return null;

  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("v");
  } catch {
    return null;
  }
}

function isDubbedYoutubeTitle(yt) {
  if (yt?.is_dubbed === true || yt?.is_dubbed === 1 || yt?.is_dubbed === "1") {
    return true;
  }

  const title = String(yt?.title || yt?.youtube_title || "").toLowerCase();

  return (
    title.includes("dubbed") ||
    title.includes("hindi dubbed") ||
    title.includes("in hindi")
  );
}

function normalizeYoutubeLink(yt) {
  const url = getYoutubeUrl(yt);
  const videoId = getYoutubeVideoId(yt);

  if (!url || !videoId) return null;

  return {
    video_id: videoId,
    youtube_video_id: videoId,
    url,
    youtube_url: url,
    title:
      yt?.title ||
      yt?.youtube_title ||
      yt?.video_title ||
      "Watch full movie on YouTube",
    youtube_title:
      yt?.youtube_title ||
      yt?.title ||
      yt?.video_title ||
      "Watch full movie on YouTube",
    channel:
      yt?.channel ||
      yt?.youtube_channel ||
      yt?.channel_name ||
      yt?.video_channel_title ||
      yt?.channel_title ||
      "",
    youtube_channel:
      yt?.youtube_channel ||
      yt?.channel ||
      yt?.channel_name ||
      yt?.video_channel_title ||
      yt?.channel_title ||
      "",
    duration_seconds: yt?.duration_seconds || yt?.duration || null,
    view_count: yt?.view_count || yt?.views || null,
    audio_language:
      yt?.audio_language ||
      yt?.youtube_language ||
      yt?.language ||
      yt?.language_slug ||
      "",
    youtube_language:
      yt?.youtube_language ||
      yt?.audio_language ||
      yt?.language ||
      yt?.language_slug ||
      "",
    is_dubbed: isDubbedYoutubeTitle(yt),
    match_score: yt?.match_score || null,
    match_type: yt?.match_type || null,
    source: yt?.source || "youtube",
  };
}

function buildYoutubeLinks(movie) {
  if (!movie) return [];

  const directLinks = Array.isArray(movie.youtube_links)
    ? movie.youtube_links
    : [];

  const legacyLinks = [
    ...(Array.isArray(movie.youtube_full_movies)
      ? movie.youtube_full_movies
      : []),
    ...(Array.isArray(movie.youtube_variants) ? movie.youtube_variants : []),
    ...(Array.isArray(movie.youtube) ? movie.youtube : []),
  ];

  const singleHistoricalLink =
    movie.youtube_url || movie.youtube_video_id || movie.youtube_title
      ? [
          {
            video_id: movie.youtube_video_id,
            youtube_video_id: movie.youtube_video_id,
            url: movie.youtube_url,
            youtube_url: movie.youtube_url,
            title: movie.youtube_title,
            youtube_title: movie.youtube_title,
            view_count: movie.youtube_view_count,
            youtube_language: movie.youtube_language,
            audio_language: movie.youtube_language,
            source: "historical_serving_v1",
          },
        ]
      : [];

  const normalized = [...directLinks, ...legacyLinks, ...singleHistoricalLink]
    .map(normalizeYoutubeLink)
    .filter(Boolean);

  const seen = new Set();

  return normalized.filter((link) => {
    if (seen.has(link.video_id)) return false;
    seen.add(link.video_id);
    return true;
  });
}

function buildMovieForYoutubeSection(movie) {
  const youtubeLinks = buildYoutubeLinks(movie);

  return {
    ...movie,
    youtube_links: youtubeLinks,
    best_youtube_link: youtubeLinks[0] || null,
    has_youtube: youtubeLinks.length > 0,
  };
}

function cleanProviderText(value) {
  return String(value || "").trim();
}

function normalizeProviderKey(value) {
  return cleanProviderText(value)
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/\+/g, " plus ")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const PROVIDER_LABELS = {
  youtube: "YouTube",
  zee5: "ZEE5",
  netflix: "Netflix",
  "prime-video": "Prime Video",
  "amazon-prime-video": "Prime Video",
  jiohotstar: "JioHotstar",
  hotstar: "JioHotstar",
  sonyliv: "SonyLIV",
  "sony-liv": "SonyLIV",
  aha: "Aha",
  "sun-nxt": "Sun NXT",
  sunnxt: "Sun NXT",
  "etv-win": "ETV Win",
  etvwin: "ETV Win",
  "apple-tv": "Apple TV",
  "apple-tv-store": "Apple TV",
  "google-tv": "Google TV",
  "google-play": "Google TV",
  "google-play-movies": "Google TV",
};

function isGenericProviderName(value) {
  const normalized = normalizeProviderKey(value);
  return !normalized || normalized === "ott" || normalized === "provider" || normalized === "streaming";
}

function labelFromProviderKey(value) {
  const key = normalizeProviderKey(value);
  if (!key) return "";
  return PROVIDER_LABELS[key] || key.split("-").map((part) => part ? part[0].toUpperCase() + part.slice(1) : "").join(" ");
}

function providerDisplayName(ott) {
  const candidates = [
    ott?.provider_display_name,
    ott?.provider_name,
    ott?.providerName,
    ott?.normalized_provider_name,
    labelFromProviderKey(ott?.provider_key),
    ott?.provider,
    ott?.button_label,
  ];

  return candidates.find((value) => !isGenericProviderName(value)) || "OTT";
}

function isBadWatchUrl(url) {
  const value = cleanProviderText(url).toLowerCase();
  return value.includes("themoviedb.org/") || value.includes("justwatch.com/");
}

function normalizeOttProviders(movie) {
  const rows = Array.isArray(movie?.ott_all) ? movie.ott_all : [];
  const seen = new Set();
  const title = movie?.title || "";

  return rows
    .map((ott) => {
      const name = providerDisplayName(ott);
      const providerKey = normalizeProviderKey(ott?.provider_key || name);
      const normalized = {
        ...ott,
        provider_key: ott?.provider_key || providerKey,
        provider_display_name: name,
        provider_name: name,
        provider: name,
      };
      const resolvedUrl = getBestProviderUrl(normalized, title);
      const url = isBadWatchUrl(resolvedUrl) ? "" : resolvedUrl;

      return {
        ...normalized,
        provider_key: providerKey || normalized.provider_key,
        display_name: name,
        logo: getProviderLogo(providerKey || normalized.provider_key, name),
        url,
      };
    })
    .filter((ott) => !isGenericProviderName(ott.display_name))
    .filter((ott) => {
      const key = normalizeProviderKey(ott.provider_key || ott.display_name);
      const dedupeKey = key || normalizeProviderKey(ott.display_name);
      if (!dedupeKey) return false;
      if (seen.has(dedupeKey)) return false;
      seen.add(dedupeKey);
      return true;
    });
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
    const title = `${movie.title}${yearText} - Where to Watch Online | Flixyfy`;
    const description = movie.overview
      ? String(movie.overview).slice(0, 155)
      : `Find where to watch ${movie.title}${yearText} online across Indian OTT platforms.`;

    setPageSeo({
      title,
      description,
      path: `/movie/${slug}`,
      image: poster,
      type: "video.movie",
    });

    setJsonLd("movie-schema-json", {
      "@context": "https://schema.org",
      "@type": "Movie",
      name: movie.title,
      description,
      image: poster,
      datePublished: movie.release_year ? String(movie.release_year) : undefined,
      inLanguage: movie.primary_language || movie.original_language || undefined,
      director:
        movie.director && movie.director !== "N/A"
          ? {
              "@type": "Person",
              name: movie.director,
            }
          : undefined,
      actor:
        movie.actors && movie.actors !== "N/A"
          ? String(movie.actors)
              .split(",")
              .slice(0, 8)
              .map((name) => ({
                "@type": "Person",
                name: name.trim(),
              }))
          : undefined,
      aggregateRating: movie.rating
        ? {
            "@type": "AggregateRating",
            ratingValue: Number(movie.rating).toFixed(1),
            bestRating: "10",
            worstRating: "1",
            ratingCount: movie.vote_count ? String(movie.vote_count) : "1",
          }
        : undefined,
    });
  }, [movie, slug]);

  const movieForYoutubeSection = useMemo(
    () => buildMovieForYoutubeSection(movie),
    [movie]
  );
  const ottProviders = useMemo(() => normalizeOttProviders(movie), [movie]);

  if (error) {
    return (
      <>
        <div style={messageStyle}>Movie not found</div>
        <Footer />
      </>
    );
  }

  if (!movie) {
    return (
      <>
        <div style={messageStyle}>Loading...</div>
        <Footer />
      </>
    );
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
    <>
      <div style={pageStyle}>
        <img
          src={poster}
          alt={movie.title}
          style={posterStyle}
          loading="eager"
          decoding="async"
        />

        <div style={contentStyle}>
          <h1 style={titleStyle}>{movie.title}</h1>

          <p style={metaStyle}>
            {movie.release_year} •{" "}
            {movie.primary_language || movie.original_language || ""}
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

          <h2 style={sectionTitleStyle}>Available on OTT</h2>

          {ottProviders.length > 0 ? (
            <div style={buttonWrapStyle}>
              {ottProviders.map((ott, index) => {
                const providerName = ott.display_name;
                const logo = ott.logo;
                const url = ott.url;

                return (
                  <a
                    key={`${ott.provider_key || providerName}-${index}`}
                    href={url || "#"}
                    target={url ? "_blank" : undefined}
                    rel={url ? "noopener noreferrer" : undefined}
                    onClick={(e) => {
                      if (!url) {
                        e.preventDefault();
                        return;
                      }

                      trackProviderClick(providerName, movie.title);
                    }}
                    style={ottButtonStyle(Boolean(url))}
                    aria-label={url ? `Watch ${movie.title} on ${providerName}` : `${providerName} availability`}
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
            <p style={mutedStyle}>OTT availability not found.</p>
          )}

          <YouTubeLinksSection movie={movieForYoutubeSection} />

          <h2 style={sectionTitleStyle}>Overview</h2>

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

      <Footer />
    </>
  );
}

const messageStyle = {
  color: "white",
  padding: 30,
  background: "#141414",
  minHeight: "100vh",
};

const pageStyle = {
  background: "#141414",
  minHeight: "100vh",
  padding: "30px",
  color: "white",
  display: "flex",
  flexWrap: "wrap",
  gap: "30px",
  alignItems: "flex-start",
  boxSizing: "border-box",
};

const contentStyle = {
  flex: "1 1 360px",
  minWidth: 0,
  width: "100%",
};

const titleStyle = {
  marginTop: 0,
  lineHeight: 1.15,
};

const metaStyle = {
  opacity: 0.82,
};

const posterStyle = {
  width: "min(100%, 280px)",
  maxWidth: "320px",
  borderRadius: "12px",
  height: "auto",
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

const sectionTitleStyle = {
  marginTop: "26px",
};

const buttonWrapStyle = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginBottom: "24px",
  width: "100%",
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
  flex: "0 0 auto",
};

const mutedStyle = {
  opacity: 0.78,
};

const overviewStyle = {
  maxWidth: "760px",
  lineHeight: "1.6",
};

const infoGridStyle = {
  marginTop: "18px",
  display: "grid",
  gap: "10px",
  maxWidth: "760px",
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
    boxSizing: "border-box",
  };
}
