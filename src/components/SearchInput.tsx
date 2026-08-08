/* global HTMLDivElement, PointerEvent, Node */

"use client";

import { FormEvent, KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Clock3, Search, Sparkles, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch, normalizePosterUrl } from "@/lib/api";
import { isCurrentSuggestionResponse, shouldOpenSuggestions } from "@/lib/search-ux";
import { serializeSearchParams } from "@/lib/search-interpretation";
import { normalizeProviderForApi } from "../utils/providerFetchPatch";

type Suggestion = {
  entity_type: string;
  entity_key: string;
  entity_name: string;
  person_id?: string;
  disambiguation?: string;
  release_year?: number;
  poster_url?: string;
};

type SuggestionApiItem = {
  canonical_movie_id?: string;
  title?: string;
  release_year?: number | null;
  entity_type?: string;
  entity_key?: string;
  entity_name?: string;
  person_id?: string;
  display_name?: string;
  disambiguation?: string;
  roles?: string[];
  poster_url?: string | null;
  poster_path?: string | null;
};

const RECENT_SEARCH_KEY = "flixyfy_recent_searches_v1";
const MAX_RECENT_SEARCHES = 6;

function readRecentSearches() {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(RECENT_SEARCH_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === "string").slice(0, MAX_RECENT_SEARCHES) : [];
  } catch {
    return [];
  }
}

export default function SearchInput({ initialValue = "", large = false }: { initialValue?: string; large?: boolean }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";
  const routeKey = pathname + "?" + initialValue.trim();
  const listboxId = useId();
  const shellRef = useRef<HTMLDivElement>(null);
  const focusedRef = useRef(false);
  const request = useRef(0);
  const abortRef = useRef<AbortController | null>(null);
  const [value, setValue] = useState(initialValue);
  const [submittedValue, setSubmittedValue] = useState(initialValue);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [submitting, setSubmitting] = useState(false);
  const [focused, setFocused] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);

  function closeSuggestions() {
    request.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    setItems([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setRecent(readRecentSearches()), 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    setValue(initialValue);
    setSubmittedValue(initialValue);
    setSubmitting(false);
    closeSuggestions();
  }, [initialValue]);

  useEffect(() => {
    closeSuggestions();
  }, [routeKey]);

  useEffect(() => {
    const query = value.trim();
    const lookupQuery = query.replace(/\s+(?:on|from|available\s+on|streaming\s+on)\s+[^?]+$/i, "").trim();
    const id = ++request.current;
    abortRef.current?.abort();
    abortRef.current = null;
    if (query.length < 2 || query === submittedValue.trim()) {
      setItems([]);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    const timer = window.setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const [peopleResponse, movieResponse] = await Promise.all([
          apiFetch<{ items?: SuggestionApiItem[] }>(
            "/api/v1/search/entities?entity_type=person&q=" + encodeURIComponent(lookupQuery || query) + "&limit=6",
            15000,
            controller.signal,
          ).catch(() => ({ items: [] })),
          apiFetch<{ items?: SuggestionApiItem[]; suggestions?: SuggestionApiItem[] }>(
            "/api/v4/search-suggestions?q=" + encodeURIComponent(query) + "&limit=6",
            15000,
            controller.signal,
          ).catch(() => ({ items: [], suggestions: [] })),
        ]);
        const people = (peopleResponse.items ?? [])
          .map((item) => ({
            entity_type: "Person",
            entity_key: "person-" + (item.person_id ?? item.display_name ?? ""),
            entity_name: item.display_name ?? item.entity_name ?? "",
            person_id: item.person_id,
            disambiguation: item.disambiguation,
          }))
          .filter((item) => item.entity_name);
        const movies = (movieResponse.items ?? movieResponse.suggestions ?? [])
          .map((item) => ({
            entity_type: item.entity_type ?? "Movie",
            entity_key: item.entity_key ?? item.canonical_movie_id ?? item.title ?? "",
            entity_name: item.entity_name ?? item.title ?? "",
            release_year: item.release_year ?? undefined,
            poster_url: normalizePosterUrl(item.poster_url ?? item.poster_path) ?? undefined,
          }))
          .filter((item) => item.entity_name);
        const suggestions = [...people, ...movies].slice(0, 8);
        if (!isCurrentSuggestionResponse({
          requestId: id,
          currentRequestId: request.current,
          query,
          currentQuery: value,
          submittedValue,
          focused: focusedRef.current,
          blocked: false,
        })) return;
        setItems(suggestions);
        setOpen(shouldOpenSuggestions({
          focused: focusedRef.current,
          value,
          submittedValue,
          itemCount: suggestions.length,
          blocked: false,
        }));
        setActiveIndex(suggestions.length ? 0 : -1);
      } catch {
        if (id === request.current && !controller.signal.aborted) {
          setItems([]);
          setOpen(false);
          setActiveIndex(-1);
        }
      } finally {
        if (abortRef.current === controller) abortRef.current = null;
      }
    }, 180);
    return () => {
      window.clearTimeout(timer);
      abortRef.current?.abort();
    };
  }, [value, submittedValue]);

  useEffect(() => {
    function onOutsidePointerDown(event: PointerEvent) {
      if (!shellRef.current?.contains(event.target as Node)) closeSuggestions();
    }
    document.addEventListener("pointerdown", onOutsidePointerDown);
    return () => document.removeEventListener("pointerdown", onOutsidePointerDown);
  }, []);

  useEffect(() => () => {
    abortRef.current?.abort();
  }, []);

  function rememberSearch(query: string) {
    const normalized = query.trim();
    if (!normalized) return;
    const next = [normalized, ...recent.filter((item) => item.toLowerCase() !== normalized.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
    setRecent(next);
    try {
      window.localStorage.setItem(RECENT_SEARCH_KEY, JSON.stringify(next));
    } catch {
      // Local history is optional.
    }
  }

  function clearRecentSearches() {
    setRecent([]);
    try {
      window.localStorage.removeItem(RECENT_SEARCH_KEY);
    } catch {
      // Local history is optional.
    }
  }

  function goToSearch(query: string, selected?: Suggestion) {
    const next = (selected?.entity_name ?? query).trim();
    if (!next) return;
    setSubmitting(true);
    setSubmittedValue(next);
    rememberSearch(next);
    closeSuggestions();
    const providerMatch = value.match(/\s+(?:on|from|available\s+on|streaming\s+on)\s+(.+)$/i);
    const provider = providerMatch ? normalizeProviderForApi(providerMatch[1]) : "";
    const search = serializeSearchParams({
      q: next,
      person_id: selected?.person_id,
      provider: provider || undefined,
    });
    router.push("/search?" + search);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (open && activeIndex >= 0 && items[activeIndex]) goToSearch(items[activeIndex].entity_name, items[activeIndex]);
    else goToSearch(value);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      closeSuggestions();
      return;
    }
    if (!items.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index + 1) % items.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => (index <= 0 ? items.length - 1 : index - 1));
    } else if (event.key === "Enter" && open && activeIndex >= 0) {
      event.preventDefault();
      goToSearch(items[activeIndex].entity_name, items[activeIndex]);
    }
  }

  return (
    <div ref={shellRef} className={large ? "search-input-shell large" : "search-input-shell"} onBlur={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget)) {
        focusedRef.current = false;
        closeSuggestions();
      }
    }}>
      <form className="search-form" onSubmit={submit} role="search" aria-busy={submitting}>
        <Search size={large ? 21 : 18} aria-hidden="true" />
        <input
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setSubmitting(false);
            closeSuggestions();
          }}
          onFocus={() => {
            focusedRef.current = true;
            setFocused(true);
            setOpen(shouldOpenSuggestions({
              focused: true,
              value,
              submittedValue,
              itemCount: items.length,
              blocked: false,
            }));
          }}
          onBlur={() => {
            window.setTimeout(() => {
              if (!shellRef.current?.contains(document.activeElement)) {
                focusedRef.current = false;
                setFocused(false);
                closeSuggestions();
              }
            }, 0);
          }}
          onKeyDown={onKeyDown}
          placeholder="Movie, actor, director, genre, language or provider"
          aria-label="Search FLIXYFY"
          aria-autocomplete="list"
          aria-controls={listboxId}
          aria-expanded={open && items.length > 0}
          aria-activedescendant={open && activeIndex >= 0 ? listboxId + "-" + activeIndex : undefined}
          role="combobox"
          autoComplete="off"
        />
        <button type="submit" disabled={!value.trim() || submitting}>
          <span>{submitting ? "Opening" : "Search"}</span><ArrowRight size={17} aria-hidden="true" />
        </button>
      </form>
      {open && items.length ? (
        <div className="suggestion-panel" id={listboxId} role="listbox" aria-label="Search suggestions">
          <div className="suggestion-label"><Sparkles size={14} aria-hidden="true" />Indexed suggestions</div>
          {items.map((item, index) => (
            <button type="button" id={listboxId + "-" + index} key={item.entity_type + "-" + item.entity_key} role="option" aria-selected={index === activeIndex} onMouseEnter={() => setActiveIndex(index)} onMouseDown={(event) => event.preventDefault()} onClick={() => { setValue(item.entity_name); goToSearch(item.entity_name, item); }}>
              <span className="suggestion-thumb" aria-hidden="true">
                {item.poster_url ? <img src={item.poster_url} alt="" loading="lazy" /> : <Search size={15} />}
              </span>
              <span className="suggestion-copy"><small>{item.entity_type}</small><strong>{item.entity_name}</strong></span>
              {item.disambiguation ? <em>{item.disambiguation}</em> : item.release_year ? <em>{item.release_year}</em> : null}
            </button>
          ))}
        </div>
      ) : null}

      {focused && !value.trim() && recent.length ? (
        <div className="recent-search-panel" aria-label="Recent searches">
          <div className="recent-search-heading"><span><Clock3 size={13} aria-hidden="true" />Recent searches</span><button type="button" onMouseDown={(event) => event.preventDefault()} onClick={clearRecentSearches}>Clear <X size={12} /></button></div>
          <div className="recent-search-list">
            {recent.map((query) => <button type="button" key={query} onMouseDown={(event) => event.preventDefault()} onClick={() => { setValue(query); goToSearch(query); }}>{query}</button>)}
          </div>
        </div>
      ) : null}
    </div>
  );
}
