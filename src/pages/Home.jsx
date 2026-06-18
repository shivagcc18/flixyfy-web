import { useEffect, useState, useRef } from "react";

import Navbar from "../components/Navbar";
import Row from "../components/Row";

import { getHome, searchMovies } from "../api/watchindiaApi";

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