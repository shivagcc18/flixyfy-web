import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MovieGrid from "../components/MovieGrid";
import SkeletonRow from "../components/SkeletonRow";
import { setPageSeo } from "../utils/seo";
import "./HistoricalPeoplePage.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://flixyfy-api-production.up.railway.app";

function roleLabel(value) {
  const text = String(value || "film person").replace(/_/g, " ");
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

function PersonStats({ person, total }) {
  return (
    <div className="historical-people-stats">
      <span>{total || person?.movie_count || 0} movies</span>
      <span>{person?.youtube_movie_count || 0} with YouTube</span>
      <span>{roleLabel(person?.primary_role)}</span>
    </div>
  );
}

export function HistoricalPersonPage({ mode = "historical" }) {
  const { slug } = useParams();
  const isUnified = mode === "unified";
  const [person, setPerson] = useState(null);
  const [movies, setMovies] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadPerson() {
      try {
        setLoading(true);
        setError("");

        const apiPath = isUnified ? "person" : "historical/person";
        const res = await fetch(`${API_BASE}/api/v3/${apiPath}/${encodeURIComponent(slug)}?limit=160`);
        if (!res.ok) throw new Error(`Person API failed: ${res.status}`);

        const data = await res.json();
        if (cancelled) return;

        const nextPerson = data.person || null;
        const nextMovies = data.items || data.movies || [];

        setPerson(nextPerson);
        setMovies(nextMovies);
        setTotal(data.total || nextMovies.length || 0);

        setPageSeo({
          title: nextPerson?.seo_title || `${nextPerson?.person_name || "Historical Person"} Movies`,
          description:
            nextPerson?.meta_description ||
            "Explore classic Indian filmography, roles, and YouTube full movie links where available.",
          path: isUnified ? `/person/${slug}` : `/historical/person/${slug}`,
        });
      } catch (err) {
        if (cancelled) return;
        console.error("Historical person API failed:", err);
        setError("Person page is not available yet.");
        setPerson(null);
        setMovies([]);
        setTotal(0);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadPerson();

    return () => {
      cancelled = true;
    };
  }, [slug, isUnified]);

  const title = person?.person_name ? `${person.person_name} Movies` : "Historical Person Movies";

  return (
    <div className="historical-people-page">
      <Navbar />
      <main>
        <section className="historical-people-hero">
          <Link className="historical-people-back" to="/historical/people">
            {isUnified ? "People" : "Historical People"}
          </Link>
          <h1>{title}</h1>
          {person?.meta_description && <p>{person.meta_description}</p>}
          {person && <PersonStats person={person} total={total} />}
        </section>

        <section className="historical-people-results">
          <h2>{loading ? "Loading..." : "Movies"}</h2>
          {loading ? (
            <SkeletonRow />
          ) : error ? (
            <p className="historical-people-empty">{error}</p>
          ) : movies.length === 0 ? (
            <p className="historical-people-empty">No movies found for this person.</p>
          ) : (
            <MovieGrid movies={movies} />
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

export default function HistoricalPeoplePage() {
  const [people, setPeople] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setPageSeo({
      title: "Historical Indian Movie People",
      description:
        "Explore classic Indian actors, directors, producers, music directors, filmographies, and watch links on Flixyfy.",
      path: "/historical/people",
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPeople() {
      try {
        setLoading(true);
        setError("");

        const params = new URLSearchParams();
        params.set("limit", "72");
        params.set("min_movies", "50");
        if (query.trim()) params.set("q", query.trim());

        const res = await fetch(`${API_BASE}/api/v3/historical/people?${params.toString()}`);
        if (!res.ok) throw new Error(`People API failed: ${res.status}`);

        const data = await res.json();
        if (cancelled) return;
        setPeople(data.items || []);
      } catch (err) {
        if (cancelled) return;
        console.error("Historical people API failed:", err);
        setError("People list is not available yet.");
        setPeople([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    const timeout = setTimeout(loadPeople, 180);
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
          <h1>Historical Movie People</h1>
          <p>Classic Indian actors, directors, producers, and music directors with filmography pages.</p>
          <input
            className="historical-people-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search people..."
            aria-label="Search historical people"
          />
        </section>

        <section className="historical-people-list">
          {loading ? (
            <SkeletonRow />
          ) : error ? (
            <p className="historical-people-empty">{error}</p>
          ) : people.length === 0 ? (
            <p className="historical-people-empty">No people found.</p>
          ) : (
            people.map((person) => (
              <Link
                className="historical-person-card"
                to={`/historical/person/${person.person_slug}`}
                key={person.person_slug}
              >
                <span className="historical-person-name">{person.person_name}</span>
                <span className="historical-person-role">{roleLabel(person.primary_role)}</span>
                <span className="historical-person-meta">
                  {person.movie_count} movies / {person.youtube_movie_count} YouTube
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
