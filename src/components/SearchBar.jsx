import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./SearchBar.css";

export default function SearchBar({ large = false, language = "", onSearch }) {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  function submit(e) {
    e.preventDefault();
    const clean = q.trim();
    if (!clean) return;

    if (onSearch) {
      onSearch(clean);
      return;
    }

    if (language) {
      navigate(`/language/${language}?q=${encodeURIComponent(clean)}`);
      return;
    }

    navigate(`/search?q=${encodeURIComponent(clean)}`);
  }

  return (
    <form className={`search-box ${large ? "search-box-large" : ""}`} onSubmit={submit}>
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search movies, languages, OTT platforms..."
      />
      <button type="submit">Search</button>
    </form>
  );
}