"use client";

import { FormEvent, KeyboardEvent, useEffect, useId, useRef, useState } from "react";
import { ArrowRight, Search, Sparkles } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { getEntitySearchBlocker } from "@/lib/search-guards";
import { isCurrentSuggestionResponse, shouldOpenSuggestions } from "@/lib/search-ux";

type Suggestion = { entity_type: string; entity_key: string; entity_name: string; release_year?: number };

type SuggestionApiItem = {
  canonical_movie_id?: string;
  title?: string;
  release_year?: number | null;
  entity_type?: string;
  entity_key?: string;
  entity_name?: string;
};

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

  function closeSuggestions() {
    request.current += 1;
    abortRef.current?.abort();
    abortRef.current = null;
    setItems([]);
    setOpen(false);
    setActiveIndex(-1);
  }

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
    const blocked = Boolean(getEntitySearchBlocker(query));
    const id = ++request.current;
    abortRef.current?.abort();
    abortRef.current = null;
    if (query.length < 2 || query === submittedValue.trim() || blocked) {
      setItems([]);
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    const timer = window.setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const response = await apiFetch<{ items?: SuggestionApiItem[]; suggestions?: SuggestionApiItem[] }>(
          "/api/v4/search-suggestions?q=" + encodeURIComponent(query) + "&limit=8",
          15000,
          controller.signal,
        );
        const suggestions = (response.items ?? response.suggestions ?? [])
          .map((item) => ({
            entity_type: item.entity_type ?? "Movie",
            entity_key: item.entity_key ?? item.canonical_movie_id ?? item.title ?? "",
            entity_name: item.entity_name ?? item.title ?? "",
            release_year: item.release_year ?? undefined,
          }))
          .filter((item) => item.entity_name);
        if (!isCurrentSuggestionResponse({
          requestId: id,
          currentRequestId: request.current,
          query,
          currentQuery: value,
          submittedValue,
          focused: focusedRef.current,
          blocked: Boolean(getEntitySearchBlocker(value)),
        })) return;
        setItems(suggestions);
        setOpen(shouldOpenSuggestions({
          focused: focusedRef.current,
          value,
          submittedValue,
          itemCount: suggestions.length,
          blocked: Boolean(getEntitySearchBlocker(value)),
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

  function goToSearch(query: string) {
    const next = query.trim();
    if (!next) return;
    setSubmitting(true);
    setSubmittedValue(next);
    closeSuggestions();
    router.push("/search?q=" + encodeURIComponent(next));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (open && activeIndex >= 0 && items[activeIndex]) goToSearch(items[activeIndex].entity_name);
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
      goToSearch(items[activeIndex].entity_name);
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
            setOpen(shouldOpenSuggestions({
              focused: true,
              value,
              submittedValue,
              itemCount: items.length,
              blocked: Boolean(getEntitySearchBlocker(value)),
            }));
          }}
          onBlur={() => {
            window.setTimeout(() => {
              if (!shellRef.current?.contains(document.activeElement)) {
                focusedRef.current = false;
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
            <button type="button" id={listboxId + "-" + index} key={item.entity_type + "-" + item.entity_key} role="option" aria-selected={index === activeIndex} onMouseEnter={() => setActiveIndex(index)} onMouseDown={(event) => event.preventDefault()} onClick={() => { setValue(item.entity_name); goToSearch(item.entity_name); }}>
              <small>{item.entity_type}</small><span>{item.entity_name}</span>{item.release_year ? <em>{item.release_year}</em> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
