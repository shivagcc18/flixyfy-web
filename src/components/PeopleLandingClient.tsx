"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, Search, UserRound } from "lucide-react";
import AppShell from "./AppShell";
import { apiFetch, type PersonEntityResponse, type PersonSearchEntity } from "@/lib/api";
import {
  mergePeopleCatalogs,
  PEOPLE_LANGUAGES,
  PEOPLE_PAGE_SIZE,
  personDisplayName,
  peopleFilmographyHref,
  personInitials,
  type PeopleCatalogItem,
  type PeopleCatalogResponse,
} from "@/lib/people-landing";
import { trackPersonResultOpened } from "@/lib/analytics";

type DirectoryState = {
  people: PeopleCatalogItem[];
  currentPage: number;
  historicalPage: number;
  currentTotal: number;
  historicalTotal: number;
  loading: boolean;
  error: boolean;
};

type DirectoryFilter = "all" | (typeof PEOPLE_LANGUAGES)[number]["slug"];

const emptyDirectory = (): DirectoryState => ({
  people: [],
  currentPage: 1,
  historicalPage: 1,
  currentTotal: 0,
  historicalTotal: 0,
  loading: true,
  error: false,
});

function rows(response: PeopleCatalogResponse): PeopleCatalogItem[] {
  return response.items ?? response.results ?? [];
}

function initialsColor(name: string) {
  return Array.from(name).reduce((sum, character) => sum + character.charCodeAt(0), 0) % 3;
}

function PersonPortrait({ person, name, tone }: { person: PeopleCatalogItem | PersonSearchEntity; name: string; tone: number }) {
  const [imageFailed, setImageFailed] = useState(false);
  const photoPerson = person as PeopleCatalogItem;
  const imageUrl = (() => {
    const raw = photoPerson.photo_url ?? photoPerson.profile_image_url ?? photoPerson.profile_path;
    if (!raw) return null;
    const value = raw.trim();
    if (value.startsWith("/")) return `https://image.tmdb.org/t/p/w342${value}`;
    return /^https?:\/\//i.test(value) ? value : null;
  })();

  return (
    <span className={`people-portrait people-portrait-tone-${tone}`}>
      {imageUrl && !imageFailed ? (
        <img className="people-portrait-image" src={imageUrl} alt={`${name} portrait`} loading="lazy" decoding="async" onError={() => setImageFailed(true)} />
      ) : (
        <>
          <span className="people-portrait-inner"><UserRound size={38} strokeWidth={1.35} aria-hidden="true" /></span>
          <span className="people-initials" aria-hidden="true">{personInitials(name)}</span>
          <span className="sr-only">Portrait unavailable; initials {personInitials(name)}</span>
        </>
      )}
    </span>
  );
}

export default function PeopleLandingClient() {
  const [query, setQuery] = useState("");
  const [searchPeople, setSearchPeople] = useState<PersonSearchEntity[]>([]);
  const [searchState, setSearchState] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [filter, setFilter] = useState<DirectoryFilter>("all");
  const [directory, setDirectory] = useState<DirectoryState>(emptyDirectory);

  const fetchPage = useCallback(async (language: DirectoryFilter, domain: "current" | "historical", page: number) => {
    const params = new URLSearchParams({ page: String(page), limit: String(PEOPLE_PAGE_SIZE) });
    if (language !== "all") params.set("language", language);
    if (domain === "current") params.set("domain", "current");
    const path = domain === "historical"
      ? `/api/v4/historical/people?${params.toString()}`
      : `/api/v4/people?${params.toString()}`;
    return apiFetch<PeopleCatalogResponse>(path);
  }, []);

  const loadFilter = useCallback(async (nextFilter: DirectoryFilter) => {
    setFilter(nextFilter);
    setDirectory(emptyDirectory());
    const [current, historical] = await Promise.allSettled([
      fetchPage(nextFilter, "current", 1),
      fetchPage(nextFilter, "historical", 1),
    ]);
    const currentResult = current.status === "fulfilled" ? current.value : null;
    const historicalResult = historical.status === "fulfilled" ? historical.value : null;
    setDirectory({
      ...emptyDirectory(),
      people: mergePeopleCatalogs(currentResult ? rows(currentResult) : [], historicalResult ? rows(historicalResult) : []),
      currentTotal: currentResult?.total ?? 0,
      historicalTotal: historicalResult?.total ?? 0,
      loading: false,
      error: !currentResult && !historicalResult,
    });
  }, [fetchPage]);

  useEffect(() => { void loadFilter("all"); }, [loadFilter]);

  useEffect(() => {
    const normalizedQuery = query.trim();
    if (normalizedQuery.length < 2) {
      setSearchPeople([]);
      setSearchState("idle");
      return;
    }

    let active = true;
    setSearchState("loading");
    const timeout = window.setTimeout(() => {
      apiFetch<PersonEntityResponse>(`/api/v1/search/entities?q=${encodeURIComponent(normalizedQuery)}`)
        .then((response) => {
          if (!active) return;
          setSearchPeople(response.items ?? response.entities ?? []);
          setSearchState("ready");
        })
        .catch(() => {
          if (!active) return;
          setSearchPeople([]);
          setSearchState("error");
        });
    }, 250);

    return () => { active = false; window.clearTimeout(timeout); };
  }, [query]);

  const loadMore = async () => {
    if (directory.loading) return;
    const currentHasMore = directory.currentPage * PEOPLE_PAGE_SIZE < directory.currentTotal;
    const historicalHasMore = directory.historicalPage * PEOPLE_PAGE_SIZE < directory.historicalTotal;
    if (!currentHasMore && !historicalHasMore) return;
    const nextCurrentPage = directory.currentPage + (currentHasMore ? 1 : 0);
    const nextHistoricalPage = directory.historicalPage + (historicalHasMore ? 1 : 0);
    setDirectory((existing) => ({ ...existing, loading: true }));
    const [current, historical] = await Promise.allSettled([
      currentHasMore ? fetchPage(filter, "current", nextCurrentPage) : Promise.resolve(null),
      historicalHasMore ? fetchPage(filter, "historical", nextHistoricalPage) : Promise.resolve(null),
    ]);
    const currentResult = current.status === "fulfilled" ? current.value : null;
    const historicalResult = historical.status === "fulfilled" ? historical.value : null;
    setDirectory((existing) => ({
      ...existing,
      people: mergePeopleCatalogs(existing.people, currentResult ? rows(currentResult) : [], historicalResult ? rows(historicalResult) : []),
      currentPage: currentResult ? nextCurrentPage : existing.currentPage,
      historicalPage: historicalResult ? nextHistoricalPage : existing.historicalPage,
      loading: false,
      error: !currentResult && !historicalResult,
    }));
  };

  const hasMore = directory.currentPage * PEOPLE_PAGE_SIZE < directory.currentTotal
    || directory.historicalPage * PEOPLE_PAGE_SIZE < directory.historicalTotal;
  const searching = query.trim().length >= 2;
  const visiblePeople = searching && searchState === "ready" ? searchPeople : directory.people;

  return (
    <AppShell>
      <main className="page-content people-page">
        <header className="people-page-heading">
          <div>
            <h1 id="people-title" className="flixyfy-metallic-gold people-display-gold">People</h1>
            <p>Find your favourite actors, actresses and filmmakers.</p>
          </div>
        </header>

        <section className="people-search-section" aria-label="Search people">
          <label className="people-search-box">
            <Search size={19} aria-hidden="true" />
            <span className="sr-only">Search actors, actresses, directors, and other film people</span>
            <input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search actors, actresses, directors..." autoComplete="off" />
          </label>
        </section>

        <nav className="people-language-filters" aria-label="Filter people by language">
          <button type="button" className={filter === "all" ? "is-selected" : ""} aria-pressed={filter === "all"} onClick={() => void loadFilter("all")}>All</button>
          {PEOPLE_LANGUAGES.map(({ slug, name }) => (
            <button key={slug} type="button" className={filter === slug ? "is-selected" : ""} aria-pressed={filter === slug} onClick={() => void loadFilter(slug)}>{name}</button>
          ))}
        </nav>

        <section className="people-directory-results" aria-label={filter === "all" ? "All people" : `${PEOPLE_LANGUAGES.find(({ slug }) => slug === filter)?.name ?? "Language"} people`}>
          {searching && searchState === "loading" ? (
            <p className="people-search-message" role="status">Searching people…</p>
          ) : searching && searchState === "error" ? (
            <p className="people-search-message" role="status">People search is unavailable right now.</p>
          ) : searching && searchState === "ready" && !searchPeople.length ? (
            <p className="people-search-message" role="status">No people matched that search.</p>
          ) : directory.loading && !directory.people.length ? (
            <div className="people-loading" role="status"><LoaderCircle size={18} className="people-spinner" aria-hidden="true" /> Loading people…</div>
          ) : directory.error ? (
            <p className="people-empty" role="status">The People directory could not be loaded right now.</p>
          ) : visiblePeople.length ? (
            <>
              <div className="people-portrait-rail">
                {visiblePeople.map((person) => {
                  const name = personDisplayName(person);
                  const personId = String(person.person_id);
                  return (
                    <a className="people-person-card" key={personId} href={peopleFilmographyHref(person)} aria-label={`Open ${name} filmography`} onClick={() => trackPersonResultOpened(personId, searching ? "people_directory_search" : "people_directory")}>
                      <PersonPortrait person={person} name={name} tone={initialsColor(name)} />
                      <strong>{name}</strong>
                      {(person as PeopleCatalogItem).roles?.length ? <span className="people-person-language">{(person as PeopleCatalogItem).roles?.join(", ")}</span> : null}
                    </a>
                  );
                })}
              </div>
              {!searching && hasMore ? <button className="people-load-more" type="button" onClick={() => void loadMore()} disabled={directory.loading}>{directory.loading ? "Loading…" : "Load more people"}</button> : null}
            </>
          ) : (
            <div className="people-empty-state">
              <UserRound size={26} aria-hidden="true" />
              <p>The People API returned no records for this selection.</p>
            </div>
          )}
        </section>
      </main>
    </AppShell>
  );
}
