import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MovieGrid from "../components/MovieGrid";
import SkeletonRow from "../components/SkeletonRow";
import { setPageSeo } from "../utils/seo";
import "./HistoricalCombinationPage.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://flixyfy-api-fresh-production.up.railway.app";

function formatList(values, fallback = "All languages") {
  if (!Array.isArray(values) || values.length === 0) return fallback;
  return values.slice(0, 6).join(", ");
}

export default function HistoricalCombinationPage() {
  const { slug } = useParams();
  const [combo, setCombo] = useState(null);
  const [movies, setMovies] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadCombination() {
      try {
        setLoading(true);
        setError("");

        const res = await fetch(
          `${API_BASE}/api/v3/historical/combination/${encodeURIComponent(slug)}?limit=160`
        );

        if (!res.ok) throw new Error(`Combination API failed: ${res.status}`);

        const data = await res.json();
        if (cancelled) return;

        const nextCombo = data.combo || null;
        const nextMovies = data.items || data.movies || [];

        setCombo(nextCombo);
        setMovies(nextMovies);
        setTotal(data.total || nextMovies.length || 0);

        setPageSeo({
          title: nextCombo?.seo_title || nextCombo?.title || "Historical Combination Movies",
          description:
            nextCombo?.meta_description ||
            "Explore classic Indian movie combinations, cast details, and free YouTube links where available.",
          path: `/historical/combination/${slug}`,
        });
      } catch (err) {
        if (cancelled) return;
        console.error("Historical combination API failed:", err);
        setError("Combination page is not available yet.");
        setCombo(null);
        setMovies([]);
        setTotal(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadCombination();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  const title = combo?.title || combo?.seo_title || "Historical Combination Movies";
  const yearText = formatList(combo?.years, "Classic era");
  const languageText = formatList(combo?.languages);

  return (
    <div className="historical-combo-page">
      <Navbar />

      <main>
        <section className="historical-combo-hero">
          <Link className="historical-combo-back" to="/historical">
            Historical Movies
          </Link>

          <h1>{title}</h1>

          {combo?.meta_description && <p>{combo.meta_description}</p>}

          <div className="historical-combo-stats" aria-label="Combination stats">
            <span>{total || combo?.movie_count || 0} movies</span>
            <span>{combo?.youtube_movie_count || 0} with YouTube</span>
            <span>{languageText}</span>
            <span>{yearText}</span>
          </div>
        </section>

        <section className="historical-combo-results">
          <h2>{loading ? "Loading..." : "Movies in this combination"}</h2>

          {loading ? (
            <SkeletonRow />
          ) : error ? (
            <p className="historical-combo-empty">{error}</p>
          ) : movies.length === 0 ? (
            <p className="historical-combo-empty">No movies found for this combination.</p>
          ) : (
            <MovieGrid movies={movies} />
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
