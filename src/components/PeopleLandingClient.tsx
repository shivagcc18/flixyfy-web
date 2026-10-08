"use client";

import { useEffect, useState } from "react";
import { Search, Users } from "lucide-react";
import AppShell from "./AppShell";
import { apiFetch, type PersonEntityResponse, type PersonSearchEntity } from "@/lib/api";
import { resolvePersonQuery } from "@/lib/person-search";
import { mergePeopleById, peopleFilmographyHref, type PeopleCatalogItem } from "@/lib/people-landing";

type CatalogResponse = { items?: PeopleCatalogItem[]; results?: PeopleCatalogItem[]; total?: number };
const languages = [{ id: "te", label: "Telugu" }, { id: "hi", label: "Hindi" }, { id: "ta", label: "Tamil" }, { id: "ml", label: "Malayalam" }, { id: "kn", label: "Kannada" }];

export default function PeopleLandingClient() {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("");
  const [directory, setDirectory] = useState<PeopleCatalogItem[]>([]);
  const [searchResults, setSearchResults] = useState<PersonSearchEntity[]>([]);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [searchState, setSearchState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  useEffect(() => {
    let active = true;
    setState("loading");
    const params = new URLSearchParams({ page: "1", limit: "24" });
    if (filter) params.set("language", filter);
    Promise.allSettled([
      apiFetch<CatalogResponse>(`/api/v4/people?${params}`),
      apiFetch<CatalogResponse>(`/api/v4/historical/people?${params}`),
    ]).then(([current, historical]) => {
      if (!active) return;
      const currentValue = current.status === "fulfilled" ? current.value : null;
      const historicalValue = historical.status === "fulfilled" ? historical.value : null;
      setDirectory(mergePeopleById(currentValue?.items ?? currentValue?.results ?? [], historicalValue?.items ?? historicalValue?.results ?? []) as PeopleCatalogItem[]);
      setTotal((currentValue?.total ?? 0) + (historicalValue?.total ?? 0));
      setState(currentValue || historicalValue ? "ready" : "error");
      setPage(1);
    });
    return () => { active = false; };
  }, [filter]);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) { setSearchResults([]); setSearchState("idle"); return; }
    let active = true;
    const timeout = window.setTimeout(() => {
      setSearchState("loading");
      apiFetch<PersonEntityResponse>(`/api/v1/search/entities?q=${encodeURIComponent(term)}`)
        .then((response) => {
          if (!active) return;
          const candidates = response.items ?? response.entities ?? [];
          const resolution = resolvePersonQuery(term, candidates);
          setSearchResults(resolution.kind === "person" ? [resolution.person] : resolution.kind === "choices" ? resolution.people : candidates);
          setSearchState("ready");
        })
        .catch(() => { if (active) { setSearchResults([]); setSearchState("error"); } });
    }, 180);
    return () => { active = false; window.clearTimeout(timeout); };
  }, [query]);

  const loadMore = async () => {
    const nextPage = page + 1;
    const params = new URLSearchParams({ page: String(nextPage), limit: "24" });
    if (filter) params.set("language", filter);
    setState("loading");
    const [current, historical] = await Promise.allSettled([
      apiFetch<CatalogResponse>(`/api/v4/people?${params}`),
      apiFetch<CatalogResponse>(`/api/v4/historical/people?${params}`),
    ]);
    const next = mergePeopleById(
      current.status === "fulfilled" ? current.value.items ?? current.value.results ?? [] : [],
      historical.status === "fulfilled" ? historical.value.items ?? historical.value.results ?? [] : [],
    );
    setDirectory((existing) => mergePeopleById(existing, next) as PeopleCatalogItem[]);
    setPage(nextPage);
    setState(current.status === "rejected" && historical.status === "rejected" ? "error" : "ready");
  };

  const searching = query.trim().length >= 2;
  const shown = searching ? searchResults : directory;
  const hasMore = !searching && directory.length < total;

  return <AppShell><main className="page-content people-page">
    <header className="people-page-heading"><div><small>DISCOVER</small><h1>People</h1><p>Find actors, directors and filmmakers across Indian cinema.</p></div></header>
    <label className="people-search-box"><Search size={19} aria-hidden="true"/><span className="sr-only">Search people by name</span><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search people by name" autoComplete="off"/></label>
    <nav className="people-language-filters" aria-label="Filter people by language"><button type="button" aria-pressed={!filter} className={!filter ? "is-selected" : ""} onClick={() => setFilter("")}>All</button>{languages.map((language) => <button key={language.id} type="button" aria-pressed={filter === language.id} className={filter === language.id ? "is-selected" : ""} onClick={() => setFilter(language.id)}>{language.label}</button>)}</nav>
    <section className="people-directory-results" aria-label="People results" aria-live="polite">
      {searching && searchState === "loading" ? <p role="status">Searching people…</p> : null}
      {searching && searchState === "error" ? <p role="alert">People search is unavailable right now.</p> : null}
      {searching && searchState === "ready" && !searchResults.length ? <p role="status">No people matched that search.</p> : null}
      {!searching && state === "loading" && !directory.length ? <p role="status">Loading people…</p> : null}
      {!searching && state === "error" ? <p role="alert">The People directory could not be loaded right now.</p> : null}
      {shown.length ? <div className="people-results-grid">{shown.map((person) => <a className="people-result-card" key={person.person_id} href={peopleFilmographyHref(person)}><span className="people-result-icon"><Users size={22} aria-hidden="true"/></span><strong>{person.display_name}</strong>{person.roles?.length ? <small>{person.roles.join(", ")}</small> : null}</a>)}</div> : null}
      {hasMore ? <button className="people-load-more" type="button" onClick={() => void loadMore()} disabled={state === "loading"}>{state === "loading" ? "Loading…" : "Load more people"}</button> : null}
    </section>
  </main></AppShell>;
}
