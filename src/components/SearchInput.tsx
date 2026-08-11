"use client";

import { FormEvent, KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowRight, Clock3, Search, Sparkles, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Suggestion = {
  entity_type: "Movie" | "Recent";
  entity_key: string;
  entity_name: string;
  release_year?: number;
};

const RECENT_KEY = "flixyfy-recent-searches-v1";
const RECENT_LIMIT = 6;

function readRecent(): string[] {
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string").slice(0, RECENT_LIMIT) : [];
  } catch {
    return [];
  }
}

function writeRecent(query: string) {
  try {
    const next = [query, ...readRecent().filter((item) => item.toLowerCase() !== query.toLowerCase())]
      .slice(0, RECENT_LIMIT);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch {
    // Browser storage is optional.
  }
}

export default function SearchInput({
  initialValue = "",
  large = false,
  placeholder = "Movie, actor, director, genre, language or provider...",
}: {
  initialValue?: string;
  large?: boolean;
  placeholder?: string;
}) {
  const router = useRouter();
  const listboxId = useId();
  const [value, setValue] = useState(initialValue);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [recent, setRecent] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const request = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setRecent(readRecent()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) return;

    const id = ++request.current;
    const timer = window.setTimeout(async () => {
      try {
        const data = await apiFetch<{
          items?: Array<{
            canonical_movie_id: string;
            title: string;
            release_year?: number | null;
          }>;
        }>(`/api/v4/search-suggestions?q=${encodeURIComponent(query)}&limit=8`);

        if (id !== request.current) return;

        const suggestions = (data.items ?? []).map((item) => ({
          entity_type: "Movie" as const,
          entity_key: item.canonical_movie_id,
          entity_name: item.title,
          release_year: item.release_year ?? undefined,
        }));
        setItems(suggestions);
        setOpen(suggestions.length > 0);
        setActiveIndex(suggestions.length > 0 ? 0 : -1);
      } catch {
        if (id === request.current) {
          setItems([]);
          setActiveIndex(-1);
        }
      }
    }, 180);

    return () => window.clearTimeout(timer);
  }, [value]);

  const displayed = useMemo<Suggestion[]>(() => {
    if (value.trim().length >= 2) return items;
    return recent.map((query) => ({
      entity_type: "Recent",
      entity_key: query,
      entity_name: query,
    }));
  }, [items, recent, value]);

  function goToSearch(query: string) {
    const next = query.trim();
    if (!next) return;
    writeRecent(next);
    setRecent(readRecent());
    setOpen(false);
    setActiveIndex(-1);
    router.push(`/search?q=${encodeURIComponent(next)}`);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (open && activeIndex >= 0 && displayed[activeIndex]) {
      goToSearch(displayed[activeIndex].entity_name);
      return;
    }
    goToSearch(value);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (!displayed.length) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % displayed.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index <= 0 ? displayed.length - 1 : index - 1));
    } else if (event.key === "Enter" && open && activeIndex >= 0) {
      event.preventDefault();
      goToSearch(displayed[activeIndex].entity_name);
    }
  }

  function clearRecent() {
    try {
      window.localStorage.removeItem(RECENT_KEY);
    } catch {
      // Optional storage.
    }
    setRecent([]);
    setOpen(false);
  }

  const showPanel = open && displayed.length > 0;

  return (
    <div
      className={large ? "search-input-shell large" : "search-input-shell"}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <form className="search-form" onSubmit={submit} role="search">
        <Search size={large ? 23 : 20} aria-hidden="true" />
        <input
          value={value}
          onChange={(event) => {
            const nextValue = event.target.value;
            setValue(nextValue);
            if (nextValue.trim().length < 2) {
              request.current += 1;
              setItems([]);
              setActiveIndex(-1);
            }
            setOpen(true);
          }}
          onFocus={() => {
            const nextRecent = readRecent();
            setRecent(nextRecent);
            if (items.length > 0 || nextRecent.length > 0) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          aria-label="Search FLIXYFY"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={showPanel}
          aria-activedescendant={showPanel && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
          role="combobox"
          autoComplete="off"
        />
        <button type="submit"><span>Search</span><ArrowRight size={18} aria-hidden="true" /></button>
      </form>

      {showPanel ? (
        <div className="suggestion-panel" id={listboxId} role="listbox" aria-label="Search suggestions">
          <div className="suggestion-panel-head">
            <div className="suggestion-label">
              {value.trim().length >= 2 ? <Sparkles size={15} aria-hidden="true" /> : <Clock3 size={15} aria-hidden="true" />}
              {value.trim().length >= 2 ? "Suggestions" : "Recent searches"}
            </div>
            {value.trim().length < 2 && recent.length ? (
              <button className="recent-clear" type="button" onClick={clearRecent} aria-label="Clear recent searches">
                <X size={14} aria-hidden="true" /> Clear
              </button>
            ) : null}
          </div>

          {displayed.map((item, index) => (
            <button
              type="button"
              id={`${listboxId}-${index}`}
              key={`${item.entity_type}-${item.entity_key}`}
              role="option"
              aria-selected={index === activeIndex}
              onMouseEnter={() => setActiveIndex(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => {
                setValue(item.entity_name);
                goToSearch(item.entity_name);
              }}
            >
              <small className="suggestion-type">{item.entity_type}</small>
              <span>{item.entity_name}</span>
              {item.release_year ? <em>{item.release_year}</em> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
