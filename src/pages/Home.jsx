import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";
import Row from "../components/Row";

import { getHome, searchMovies } from "../api/watchindiaApi";

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

export default function Home() {
  const [sections, setSections] = useState({});
  const [results, setResults] = useState([]);
  const [query, setQuery] = useState("");

  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    loadHome();
  }, []);

  const loadHome = async () => {
    try {
      const data = await getHome();

      setSections({
        Trending: data.trending || [],
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

  const handleSearch = async (q) => {
    setQuery(q);

    if (!q || !q.trim()) {
      setResults([]);
      await loadHome();
      return;
    }

    try {
      const data = await searchMovies({ q, limit: 48 });
      setResults(data.items || []);
    } catch (err) {
      console.error("Search API failed:", err);
      setResults([]);
    }
  };

  return (
    <div style={{ background: "#141414", minHeight: "100vh", color: "white" }}>
      <Navbar onSearch={handleSearch} />

      {!query && (
        <div
          style={{
            padding: "20px 20px 8px",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "10px",
              justifyContent: "center",
              maxWidth: "1100px",
            }}
          >
            {LANGUAGES.map((lang) => (
              <Link
                key={lang.slug}
                to={`/language/${lang.slug}`}
                style={{
                  padding: "8px 16px",
                  borderRadius: "999px",
                  textDecoration: "none",
                  color: "#fff",
                  background: "#1b1b1b",
                  border: "1px solid #333",
                  fontWeight: 700,
                  boxShadow: "0 0 0 rgba(0,191,255,0)",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#00bfff";
                  e.currentTarget.style.borderColor = "#00bfff";
                  e.currentTarget.style.boxShadow =
                    "0 0 15px rgba(0,191,255,.6)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#1b1b1b";
                  e.currentTarget.style.borderColor = "#333";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 rgba(0,191,255,0)";
                }}
              >
                {lang.label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {query ? (
        <Row title={`Search Results (${results.length})`} movies={results} />
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