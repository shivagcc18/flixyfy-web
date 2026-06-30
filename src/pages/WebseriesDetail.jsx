import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Footer from "../components/Footer";
import Navbar from "../components/Navbar";
import { getBestProviderUrl } from "../utils/providerLinks";
import { setPageSeo } from "../utils/seo";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://flixyfy-api-production.up.railway.app";

function imageUrl(path) {
  if (!path) return "/no-poster.png";
  if (path.startsWith("http")) return path;
  return `https://image.tmdb.org/t/p/w500${path}`;
}

export default function WebseriesDetail() {
  const { slug } = useParams();
  const [series, setSeries] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(`${API_BASE}/api/v3/webseries/${encodeURIComponent(slug)}`);
        if (!res.ok) throw new Error(`Webseries API failed: ${res.status}`);

        const data = await res.json();
        if (!active) return;

        setSeries(data);
        setPageSeo({
          title: `${data.title || "Webseries"} Streaming Availability`,
          description: data.overview || `Find where to watch ${data.title || "this webseries"}.`,
          path: `/webseries/${slug}`,
        });
      } catch (err) {
        console.error("Webseries detail failed:", err);
        if (active) setError("Webseries not found.");
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <div style={pageStyle}>
        <Navbar />
        <main style={contentStyle}>Loading webseries...</main>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div style={pageStyle}>
        <Navbar />
        <main style={contentStyle}>
          <Link style={backStyle} to="/">Back</Link>
          <p>{error || "Webseries not found."}</p>
        </main>
        <Footer />
      </div>
    );
  }

  const providers = series.ott_all || series.availability || [];
  const meta = [
    series.release_year,
    series.primary_language,
    series.number_of_seasons ? `${series.number_of_seasons} seasons` : null,
    series.number_of_episodes ? `${series.number_of_episodes} episodes` : null,
  ].filter(Boolean);

  return (
    <div style={pageStyle}>
      <Navbar />
      <main style={contentStyle}>
        <Link style={backStyle} to="/">Back</Link>

        <section style={heroStyle}>
          <img src={imageUrl(series.poster_url)} alt={series.title} style={posterStyle} />

          <div>
            <p style={kickerStyle}>Webseries</p>
            <h1 style={titleStyle}>{series.title}</h1>
            <p style={metaStyle}>{meta.join(" / ")}</p>

            {series.imdb_rating && <p style={ratingStyle}>IMDb {series.imdb_rating}</p>}
            {series.overview && <p style={overviewStyle}>{series.overview}</p>}

            {providers.length > 0 && (
              <div style={providerWrapStyle}>
                {providers.map((item, index) => {
                  const url = getBestProviderUrl(item);

                  return (
                    <a
                      key={`${item.provider_key || item.provider_display_name}-${index}`}
                      href={url || "#"}
                      target={url ? "_blank" : undefined}
                      rel={url ? "noopener noreferrer" : undefined}
                      style={providerStyle}
                    >
                      {item.provider_display_name || item.button_label || "Watch"}
                    </a>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}

const pageStyle = {
  minHeight: "100vh",
  background: "#141414",
  color: "#fff",
};

const contentStyle = {
  width: "min(1120px, calc(100% - 32px))",
  margin: "0 auto",
  padding: "32px 0 64px",
};

const backStyle = {
  color: "#20d9ff",
  textDecoration: "none",
  fontWeight: 800,
};

const heroStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))",
  gap: 28,
  alignItems: "start",
  marginTop: 24,
};

const posterStyle = {
  width: "100%",
  maxWidth: 280,
  borderRadius: 8,
  background: "#222",
};

const kickerStyle = {
  margin: "0 0 8px",
  color: "#20d9ff",
  fontWeight: 900,
  textTransform: "uppercase",
};

const titleStyle = {
  margin: 0,
  fontSize: "clamp(32px, 5vw, 56px)",
};

const metaStyle = {
  color: "#b8c2d6",
  fontWeight: 700,
};

const ratingStyle = {
  display: "inline-block",
  padding: "7px 10px",
  borderRadius: 6,
  background: "#202a33",
  fontWeight: 850,
};

const overviewStyle = {
  maxWidth: 760,
  lineHeight: 1.65,
  color: "#e8eef5",
};

const providerWrapStyle = {
  display: "flex",
  flexWrap: "wrap",
  gap: 10,
  marginTop: 22,
};

const providerStyle = {
  color: "#071018",
  background: "#20d9ff",
  borderRadius: 6,
  padding: "10px 14px",
  textDecoration: "none",
  fontWeight: 900,
};
