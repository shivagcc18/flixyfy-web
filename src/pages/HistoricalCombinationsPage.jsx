import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import SkeletonRow from "../components/SkeletonRow";
import { setPageSeo } from "../utils/seo";
import "./HistoricalPeoplePage.css";

const API_BASE = "https://flixyfy-api-fresh-production.up.railway.app";

function comboTypeLabel(value) {
  return String(value || "combination").replace(/_/g, " ");
}

export default function HistoricalCombinationsPage() {
  const [combos, setCombos] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setPageSeo({
      title: "Historical Indian Movie Combinations",
      description:
        "Explore classic Indian actor, director, producer, and music combinations with shared movie lists.",
      path: "/historical/combinations",
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadCombinations() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        params.set("limit", "72");
        params.set("min_movies", "5");
        if (query.trim()) params.set("q", query.trim());

        const res = await fetch(`${API_BASE}/api/v4/historical/combinations?${params.toString()}`);
        if (!res.ok) throw new Error(`Combinations API failed: ${res.status}`);

        const data = await res.json();
        if (cancelled) return;
        setCombos(data.items || []);
      } catch (err) {
        if (cancelled) return;
        console.error("Historical combinations API failed:", err);
        setError("Combination list is not available yet.");
        setCombos([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const timeout = setTimeout(loadCombinations, 180);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query]);

  return (
    <div className="historical-people-page">
      <Navbar />
      <main>
        <section className="historical-people-hero">
          <Link className="historical-people-back" to="/historical">
            Historical Movies
          </Link>
          <h1>Historical Movie Combinations</h1>
          <p>Classic Indian movie pairings and collaborations with more than three shared movies.</p>
          <input
            className="historical-people-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search combinations..."
            aria-label="Search historical combinations"
          />
        </section>

        <section className="historical-people-list">
          {loading ? (
            <SkeletonRow />
          ) : error ? (
            <p className="historical-people-empty">{error}</p>
          ) : combos.length === 0 ? (
            <p className="historical-people-empty">No combinations found.</p>
          ) : (
            combos.map((combo) => (
              <Link
                className="historical-person-card"
                to={`/historical/combination/${combo.person_a_slug}-${combo.person_b_slug}`}
                key={combo.combo_key}
              >
                <span className="historical-person-name">
                  {combo.person_a} + {combo.person_b}
                </span>
                <span className="historical-person-role">{comboTypeLabel(combo.combo_type)}</span>
                <span className="historical-person-meta">
                  {combo.movie_count} movies / {combo.youtube_movie_count} YouTube
                </span>
              </Link>
            ))
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}
