import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import Row from "../components/Row";
import SearchBar from "../components/SearchBar";
import MovieGrid from "../components/MovieGrid";

import { getHome, searchMovies } from "../api/watchindiaApi";
import "./Home.css";

const LANGUAGES = [
  { label: "Hindi", slug: "hindi" },
  { label: "Telugu", slug: "telugu" },
  { label: "Tamil", slug: "tamil" },
  { label: "Malayalam", slug: "malayalam" },
  { label: "Kannada", slug: "kannada" },
  { label: "Bengali", slug: "bengali" },
  { label: "Marathi", slug: "marathi" },
  { label: "Punjabi", slug: "punjabi" },
  { label: "Gujarati", slug: "gujarati" },
  { label: "Odia", slug: "odia" },
  { label: "Assamese", slug: "assamese" },
];

const YEARS = ["2026", "2025", "2024", "2023", "2022", "2021", "2020", "2019", "2018", "2017"];

export default function Home() {
  const [sections, setSections] = useState({});
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("");
  const [filterTotal, setFilterTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadHome();
  }, []);

  useEffect(() => {
    if (!loadedRef.current) return;

    if (year || query) {
      runSearch(query, year);
    } else {
      setResults([]);
      setFilterTotal(0);
      loadHome();
    }
  }, [year]);

  const loadHome = async () => {
    try {
      const data = await getHome();

      setSections({
        "Popular Movies": data.trending || [],
        Latest: data.latest || [],
        "Free to Watch": data.free || [],
        "Hindi Movies": data.hindi || [],
        "Telugu Movies": data.telugu || [],
        "Tamil Movies": data.tamil || [],
      });
    } catch (err) {
      console.error("Home API failed:", err);
      setSections({});
    }
  };

  const runSearch = async (searchText = "", selectedYear = "") => {
    try {
      setLoading(true);

      const data = await searchMovies({
        q: searchText || "",
        year: selectedYear || "",
        limit: 100,
      });

      console.log("HOME FILTER API RESULT:", {
        searchText,
        selectedYear,
        total: data.total,
        count: data.count,
        first: data.items?.[0],
      });

      setResults(data.items || []);
      setFilterTotal(data.total || 0);
    } catch (err) {
      console.error("Search API failed:", err);
      setResults([]);
      setFilterTotal(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (q) => {
    const clean = q.trim();
    setQuery(clean);

    if (!clean && !year) {
      setResults([]);
      setFilterTotal(0);
      await loadHome();
      return;
    }

    await runSearch(clean, year);
  };

  const showingFiltered = Boolean(query || year);

  const resultTitle =
    query && year
      ? `Search Results for "${query}" in ${year} (${filterTotal})`
      : query
      ? `Search Results for "${query}" (${filterTotal})`
      : `${year} Movies (${filterTotal})`;

  return (
    <div className="home-page">
      <Navbar />

      {!query && (
        <div className="home-filter-row">
          <div className="language-nav">
            {LANGUAGES.map((lang) => (
              <Link key={lang.slug} to={`/language/${lang.slug}`}>
                {lang.label}
              </Link>
            ))}
          </div>

          <select
            className="year-dropdown"
            value={year}
            onChange={(e) => setYear(e.target.value)}
          >
            <option value="">All Years</option>
            {YEARS.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="home-search-wrap">
        <SearchBar onSearch={handleSearch} large />
      </div>

      {showingFiltered ? (
        <section className="home-filter-results">
          <h2>{loading ? "Loading movies..." : resultTitle}</h2>

          {!loading && results.length === 0 ? (
            <p className="home-empty">No movies found.</p>
          ) : (
            <MovieGrid movies={results} />
          )}
        </section>
      ) : (
        <>
          {Object.entries(sections).map(([title, movies]) => (
            <Row key={title} title={title} movies={movies} />
          ))}
        </>
      )}
    </div>
  );
}