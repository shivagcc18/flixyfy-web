import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../config/api";
import { trackSearch } from "../utils/analytics";
import "./SearchBar.css";

export default function SearchBar({
  large = false,
  language = "",
  onSearch,
  suggestionType = "all",
  suggestionScope = "global",
  suggestionDomain = "",
  placeholder = "Search movies, people, webseries...",
  focusKey = "",
}) {
  const [q, setQ] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const abortRef = useRef(null);
  const inputRef = useRef(null);
  const suggestionCacheRef = useRef(new Map());
  const navigate = useNavigate();

  const submitQuery = (value = q) => {
    const clean = value.trim();
    if (!clean) return;

    trackSearch(clean, language);
    setShowSuggestions(false);
    setActiveIndex(-1);

    if (onSearch) {
      onSearch(clean);
      return;
    }

    if (language) {
      navigate(`/language/${language}?q=${encodeURIComponent(clean)}`);
      return;
    }

    navigate(`/search?q=${encodeURIComponent(clean)}`);
  };

  function submit(e) {
    e.preventDefault();
    submitQuery();
  }

  useEffect(() => {
    const clean = q.trim();

    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
    }

    if (clean.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveIndex(-1);
      return undefined;
    }

    const controller = new AbortController();
    abortRef.current = controller;

    const timeout = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        params.set("q", clean);
        params.set("limit", "8");
        params.set("type", suggestionType || "all");

        if (suggestionDomain) {
          params.set("domain", suggestionDomain);
        } else if (suggestionScope === "indian") {
          params.set("domain", "indian");
        }

        if (language) params.set("language", language);

        const cacheKey = params.toString();
        if (suggestionCacheRef.current.has(cacheKey)) {
          const cached = suggestionCacheRef.current.get(cacheKey);
          setSuggestions(cached);
          setShowSuggestions(cached.length > 0);
          setActiveIndex(-1);
          return;
        }

        const res = await fetch(`${API_BASE}/api/v3/search-suggestions?${params.toString()}`, {
          signal: controller.signal,
        });

        if (!res.ok) throw new Error(`Suggestions failed: ${res.status}`);
        const data = await res.json();
        const next = data.items || [];
        suggestionCacheRef.current.set(cacheKey, next);
        if (suggestionCacheRef.current.size > 40) {
          const firstKey = suggestionCacheRef.current.keys().next().value;
          suggestionCacheRef.current.delete(firstKey);
        }
        setSuggestions(next);
        setShowSuggestions(next.length > 0);
        setActiveIndex(-1);
      } catch (err) {
        if (err.name !== "AbortError") {
          setSuggestions([]);
          setShowSuggestions(false);
        }
      }
    }, 320);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [q, language, suggestionType, suggestionScope, suggestionDomain]);

  useEffect(() => {
    if (!focusKey || !inputRef.current) return;
    inputRef.current.focus();
  }, [focusKey]);

  const handleKeyDown = (e) => {
    if (!showSuggestions || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((current) => (current <= 0 ? suggestions.length - 1 : current - 1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      const selected = suggestions[activeIndex];
      const selectedTitle = selected?.title || q;
      setQ(selectedTitle);
      submitQuery(selectedTitle);
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setActiveIndex(-1);
    }
  };

  return (
    <div className={`search-shell ${large ? "search-shell-large" : ""}`}>
      <form className={`search-box ${large ? "search-box-large" : ""}`} onSubmit={submit}>
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setShowSuggestions(suggestions.length > 0)}
          onBlur={() => window.setTimeout(() => setShowSuggestions(false), 120)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={showSuggestions}
        />
        <button type="submit">Search</button>
      </form>

      {showSuggestions && (
        <div className="search-suggestions" role="listbox">
          {suggestions.map((item, index) => (
            <button
              key={`${item.domain}-${item.slug || item.title}-${index}`}
              type="button"
              className={`search-suggestion ${index === activeIndex ? "active" : ""}`}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(e) => {
                e.preventDefault();
                const selectedTitle = item.title || q;
                setQ(selectedTitle);
                submitQuery(selectedTitle);
              }}
              role="option"
              aria-selected={index === activeIndex}
            >
              <span className="search-suggestion-title">{item.title}</span>
              <span className="search-suggestion-meta">
                {[item.source_label, item.release_year || item.year].filter(Boolean).join(" / ")}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
