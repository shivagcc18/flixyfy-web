import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { getBestProviderUrl, providerUrl } from "../utils/providerLinks";
import { getProviderLogo } from "../utils/providerLogos";
import { setPageSeo } from "../utils/seo";
import "./DomainDetail.css";

const API_BASE = "https://flixyfy-api-fresh-production.up.railway.app";

const LOCAL_LOGO_BASE = "/provider-logos";

function domainName(domain) {
  return domain === "historical" ? "Historical Indian" : "Hollywood";
}

function fallbackPoster(title) {
  return (
    "https://dummyimage.com/500x750/111827/ffffff&text=" +
    encodeURIComponent(title || "FLIXYFY")
  );
}

function logoUrl(path) {
  if (!path) return null;

  const value = String(path).trim();

  if (!value) return null;

  let filename = "";

  if (value.startsWith("http")) {
    try {
      const url = new URL(value);
      filename = url.pathname.split("/").filter(Boolean).pop() || "";
    } catch {
      return null;
    }
  } else {
    filename = value.replace(/^\/+/, "").replace(/\//g, "_");
  }

  if (!filename) return null;

  return `${LOCAL_LOGO_BASE}/${filename}`;
}

function cleanName(value) {
  return String(value || "")
    .replace(/^watch on\s+/i, "")
    .trim();
}

function normalizeProviderKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
}

function providerTypeLabel(type) {
  const value = String(type || "").toLowerCase();

  if (value === "subscription") return "Subscription";
  if (value === "free") return "Free";
  if (value === "free_with_ads") return "Free with Ads";
  if (value === "rent") return "Rent";
  if (value === "buy") return "Buy";

  return "";
}

function regionLabel(region) {
  const value = String(region || "").toUpperCase();

  if (value === "IN") return "India";
  if (value === "US") return "US";
  if (value === "GB") return "UK";
  if (value) return value;

  return "";
}

function providerName(item) {
  return cleanName(
    item.provider_display_name ||
      item.provider_name ||
      item.provider ||
      item.button_label ||
      "Watch"
  );
}

function providerRank(item) {
  const region = String(item.region || "").toUpperCase();
  const type = String(item.provider_type || "").toLowerCase();

  const regionRank =
    region === "IN" ? 0 :
    region === "US" ? 1 :
    region === "GB" ? 2 :
    3;

  const typeRank = {
    subscription: 0,
    free: 1,
    free_with_ads: 2,
    rent: 3,
    buy: 4,
  }[type] ?? 9;

  const priority = Number(item.display_priority || item.priority || 999);

  return regionRank * 10000 + typeRank * 1000 + priority;
}

function cleanProviders(items, title = "") {
  if (!Array.isArray(items)) return [];

  const sorted = [...items]
    .filter((item) => item && providerUrl(item, title))
    .sort((a, b) => providerRank(a) - providerRank(b));

  const seen = new Set();
  const output = [];

  for (const item of sorted) {
    const name = providerName(item);
    const key = normalizeProviderKey(item.provider_key || name);

    if (!key || key === "watch") continue;
    if (seen.has(key)) continue;

    seen.add(key);
    output.push(item);

    if (output.length >= 10) break;
  }

  return output;
}

function cleanYoutube(items) {
  if (!Array.isArray(items)) return [];

  const seen = new Set();
  const output = [];

  for (const item of items) {
    const url = item.video_url || item.final_url || item.youtube_url;
    if (!url) continue;

    const key = item.video_id || url;
    if (seen.has(key)) continue;

    seen.add(key);
    output.push(item);

    if (output.length >= 3) break;
  }

  return output;
}

export default function DomainDetail({ domain }) {
  const { slug } = useParams();
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);

  const apiPath = useMemo(() => `/api/v4/${domain}/${slug}`, [domain, slug]);

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

  const availability = cleanProviders(
    movie?.availability || movie?.ott_all || movie?.watch_providers || [],
    movie?.title || ""
  );

  const youtube = cleanYoutube(movie?.youtube_full_movies || []);

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
                      href={item.video_url || item.final_url || item.youtube_url}
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

                <div className="provider-grid">
                  {availability.map((item, index) => {
                    const url = getBestProviderUrl(item, movie?.title || "") || item.youtube_url || item.video_url || "";
                    const name = providerName(item);
                    const img =
                      logoUrl(item.logo_path) ||
                      getProviderLogo(item.provider_key || item.provider, name);
                    const type = providerTypeLabel(item.provider_type);
                    const region = regionLabel(item.region);

                    return (
                      <a
                        key={`${item.provider_key || name || index}`}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="provider-card"
                      >
                        <span className="provider-logo-wrap">
                          {img ? (
                            <img
                              src={img}
                              alt=""
                              className="provider-logo"
                              loading="lazy"
                              decoding="async"
                            />
                          ) : (
                            <span className="provider-logo-fallback">
                              {name.slice(0, 1)}
                            </span>
                          )}
                        </span>

                        <span className="provider-copy">
                          <strong>{name}</strong>

                          {(type || region) && (
                            <small>
                              {[type, region].filter(Boolean).join(" • ")}
                            </small>
                          )}
                        </span>
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

