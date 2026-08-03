"use client";

import { FormEvent, KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

type Suggestion = {
  entity_type: string;
  entity_key: string;
  entity_name: string;
  release_year?: number;
};

export default function SearchInput({
  initialValue = "",
  large = false,
}: {
  initialValue?: string;
  large?: boolean;
}) {
  const router = useRouter();
  const listboxId = useId();
  const [value, setValue] = useState(initialValue);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const request = useRef(0);
  useEffect(() => {
    const query = value.trim();
    if (query.length < 2) {
      const clearTimer = window.setTimeout(() => {
        request.current += 1;
        setItems([]);
        setOpen(false);
        setActiveIndex(-1);
      }, 0);
      return () => window.clearTimeout(clearTimer);
    }
    const id = ++request.current;
    const timer = window.setTimeout(async () => {
      try {
        const data = await apiFetch<{ items?: Array<{ canonical_movie_id: string; title: string; release_year?: number | null }> }>(
          `/api/v4/search-suggestions?q=${encodeURIComponent(query)}&limit=8`,
        );
        if (id === request.current) {
          const suggestions = (data.items ?? []).map((item) => ({
            entity_type: "Movie",
            entity_key: item.canonical_movie_id,
            entity_name: item.title,
            release_year: item.release_year ?? undefined,
          }));
          setItems(suggestions);
          setOpen(suggestions.length > 0);
          setActiveIndex(suggestions.length > 0 ? 0 : -1);
        }
      } catch {
        if (id === request.current) {
          setItems([]);
          setOpen(false);
          setActiveIndex(-1);
        }
      }
    }, 180);
    return () => window.clearTimeout(timer);
  }, [value]);

  function goToSearch(query: string) {
    const next = query.trim();
    if (!next) return;
    setOpen(false);
    setActiveIndex(-1);
    router.push(`/search?q=${encodeURIComponent(next)}`);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (open && activeIndex >= 0 && items[activeIndex]) {
      goToSearch(items[activeIndex].entity_name);
      return;
    }
    goToSearch(value);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!items.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index <= 0 ? items.length - 1 : index - 1));
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    } else if (event.key === "Enter" && open && activeIndex >= 0) {
      event.preventDefault();
      goToSearch(items[activeIndex].entity_name);
    }
  }

  return (
    <div
      className={large ? "search-input-shell large" : "search-input-shell"}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <form className="search-form" onSubmit={submit} role="search">
        <Search size={large ? 24 : 20} aria-hidden="true" />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onFocus={() => items.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Movie, actor, director, language, genre or provider..."
          aria-label="Search FLIXYFY"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={open && items.length > 0}
          aria-activedescendant={open && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
          role="combobox"
          autoComplete="off"
        />
        <button type="submit"><span>Search</span><ArrowRight size={18} aria-hidden="true" /></button>
      </form>
      {open && items.length ? (
        <div className="suggestion-panel" id={listboxId} role="listbox" aria-label="Search suggestions">
          <div className="suggestion-label"><Sparkles size={15} aria-hidden="true" />Search intelligence</div>
          {items.map((item, index) => (
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
