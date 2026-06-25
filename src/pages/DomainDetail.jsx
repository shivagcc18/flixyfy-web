import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { setPageSeo } from "../utils/seo";
import "./DomainDetail.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://flixyfy-api-production.up.railway.app";

function domainName(domain) {
  return domain === "historical" ? "Historical Indian" : "Hollywood";
}

function fallbackPoster(title) {
  return (
    "https://dummyimage.com/500x750/111827/ffffff&text=" +
    encodeURIComponent(title || "FLIXYFY")
  );
}

export default function DomainDetail({ domain }) {
  const { slug } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  const apiPath = useMemo(() => `/api/v3/${domain}/${slug}`, [domain, slug]);

  useEffect(() => {
    let mounted = true;

    async function loadMovie() {
      try {
        setLoading(true);

        const res = await fetch(`${API_BASE}${apiPath}`);

        if (!res.ok) {
          throw new Error(`API failed: ${res.status}`);
        }

        const data = await res.json();

        if (mounted) {
          setMovie(data);

          setPageSeo({
            title: `${data.title || "Movie"} (${data.release_year || ""}) - ${domainName(domain)}`,
            description:
              data.overview ||
              `Find where to watch ${data.title || "this movie"} on Flixyfy.`,
            path: `/${domain}/${slug}`,
          });
        }
      } catch (err) {
        console.error(`${domain} detail failed:`, err);

        if (mounted) {
          setMovie(null);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadMovie();

    return () => {
      mounted = false;
    };
  }, [apiPath, domain, slug]);

  const availability = movie?.availability || movie?.ott_all || movie?.watch_providers || [];
  const youtube = movie?.youtube_full_movies || [];

  return (
    <div className="domain-detail-page">
      <Navbar />

      {loading ? (
        <div className="domain-detail-loading">Loading movie...</div>
      ) : !movie ? (
        <div className="domain-detail-loading">
          <h1>Movie not found</h1>
          <Link to={`/${domain}`}>Back to {domainName(domain)}</Link>
        </div>
      ) : (
        <main className="domain-detail">
          <div className="domain-poster-wrap">
            <img
              className="domain-poster"
              src={movie.poster_url || fallbackPoster(movie.title)}
              alt={movie.title}
              loading="eager"
            />
          </div>

          <section className="domain-info">
            <p className="domain-badge">{movie.source_label || domainName(domain)}</p>

            <h1>{movie.title}</h1>

            <div className="domain-meta">
              {movie.release_year && <span>{movie.release_year}</span>}
              {movie.language_name || movie.primary_language ? (
                <span>{movie.language_name || movie.primary_language}</span>
              ) : null}
              {movie.rating && <span>Rating {movie.rating}</span>}
            </div>

            {movie.overview && <p className="domain-overview">{movie.overview}</p>}

            {movie.director && (
              <p className="domain-line">
                <strong>Director:</strong> {movie.director}
              </p>
            )}

            {movie.actors && (
              <p className="domain-line">
                <strong>Cast:</strong> {movie.actors}
              </p>
            )}

            {youtube.length > 0 && (
              <div className="watch-block">
                <h2>Free Full Movie</h2>
                <div className="watch-buttons">
                  {youtube.map((item, index) => (
                    <a
                      key={`${item.video_id || item.video_url || index}`}
                      href={item.video_url || item.final_url}
                      target="_blank"
                      rel="noreferrer"
                      className="watch-button youtube"
                    >
                      Watch on YouTube
                    </a>
                  ))}
                </div>
              </div>
            )}

            {availability.length > 0 && (
              <div className="watch-block">
                <h2>Where to Watch</h2>
                <div className="watch-buttons">
                  {availability.map((item, index) => {
                    const url =
                      item.final_url ||
                      item.deep_link ||
                      item.provider_deep_link ||
                      item.youtube_url ||
                      item.video_url;

                    if (!url) return null;

                    return (
                      <a
                        key={`${item.provider_key || item.provider_display_name || index}`}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="watch-button"
                      >
                        {item.button_label ||
                          item.provider_display_name ||
                          item.provider_name ||
                          "Watch"}
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {availability.length === 0 && youtube.length === 0 && (
              <p className="domain-no-watch">No confirmed watch link found yet.</p>
            )}
          </section>
        </main>
      )}

      <Footer />
    </div>
  );
}