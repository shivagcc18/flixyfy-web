import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  function runSearch(e) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    navigate(`/?q=${encodeURIComponent(query)}`);
  }

  return (
    <header className="navbar">
      <a href="/" className="brand">FLIXYFY</a>

      <form className="nav-search" onSubmit={runSearch}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search movies, series..."
        />
      </form>
    </header>
  );
}