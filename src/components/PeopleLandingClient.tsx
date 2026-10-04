"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, LoaderCircle, Search, UserRound } from "lucide-react";
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

type LanguageGroupState = {
  people: PeopleCatalogItem[];
  currentPage: number;
  historicalPage: number;
  currentTotal: number;
  historicalTotal: number;
  loading: boolean;
  error: boolean;
};

type PeopleGroups = Record<string, LanguageGroupState>;

const emptyGroup = (): LanguageGroupState => ({
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
  const value = Array.from(name).reduce((sum, character) => sum + character.charCodeAt(0), 0);
  return value % 3;
}

function PersonPortrait({ person, name, tone }: { person: PeopleCatalogItem; name: string; tone: number }) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = (() => {
    const raw = person.photo_url ?? person.profile_image_url ?? person.profile_path;
    if (!raw) return null;
    const value = raw.trim();
    if (value.startsWith("/")) return `https://image.tmdb.org/t/p/w342${value}`;
    return /^https?:\/\//i.test(value) ? value : null;
  })();

  return (
    <span className={`people-portrait people-portrait-tone-${tone}`}>
      {imageUrl && !imageFailed ? (
        <img
          className="people-portrait-image"
          src={imageUrl}
          alt={`${name} portrait`}
          loading="lazy"
          decoding="async"
          onError={() => setImageFailed(true)}
        />
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
  const [groups, setGroups] = useState<PeopleGroups>(() =>
    Object.fromEntries(PEOPLE_LANGUAGES.map(({ slug }) => [slug, emptyGroup()])),
  );

  const fetchPage = useCallback(async (language: string, domain: "current" | "historical", page: number) => {
    const query = { language, page: String(page), limit: String(PEOPLE_PAGE_SIZE) };
    const path = domain === "historical"
      ? `/api/v4/historical/people?${new URLSearchParams(query).toString()}`
      : `/api/v4/people?${new URLSearchParams({ ...query, domain }).toString()}`;
    return apiFetch<PeopleCatalogResponse>(path);
  }, []);

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

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [query]);

  useEffect(() => {
    let active = true;
    Promise.all(PEOPLE_LANGUAGES.map(async ({ slug }) => {
      const current = await Promise.allSettled([fetchPage(slug, "current", 1)]);
      if (!active) return;
      const currentResult = current[0].status === "fulfilled" ? current[0].value : null;
      const historicalResult = currentResult && rows(currentResult).length
        ? await fetchPage(slug, "historical", 1).catch(() => null)
        : null;
      if (!active) return;
      setGroups((existing) => ({
        ...existing,
        [slug]: {
          ...emptyGroup(),
          people: mergePeopleCatalogs(
            currentResult ? rows(currentResult) : [],
            historicalResult ? rows(historicalResult) : [],
          ),
          currentTotal: currentResult?.total ?? 0,
          historicalTotal: historicalResult?.total ?? 0,
          loading: false,
          error: !currentResult,
        },
      }));
    })).catch(() => undefined);
    return () => { active = false; };
  }, [fetchPage]);

  const loadMore = async (slug: string) => {
    const group = groups[slug];
    if (!group || group.loading) return;
    const currentHasMore = group.currentPage * PEOPLE_PAGE_SIZE < group.currentTotal;
    const historicalHasMore = group.historicalPage * PEOPLE_PAGE_SIZE < group.historicalTotal;
    if (!currentHasMore && !historicalHasMore) return;

    const nextCurrentPage = group.currentPage + (currentHasMore ? 1 : 0);
    const nextHistoricalPage = group.historicalPage + (historicalHasMore ? 1 : 0);
    setGroups((existing) => ({ ...existing, [slug]: { ...group, loading: true } }));

    const [current, historical] = await Promise.allSettled([
      currentHasMore ? fetchPage(slug, "current", nextCurrentPage) : Promise.resolve(null),
      historicalHasMore ? fetchPage(slug, "historical", nextHistoricalPage) : Promise.resolve(null),
    ]);
    const currentResult = current.status === "fulfilled" ? current.value : null;
    const historicalResult = historical.status === "fulfilled" ? historical.value : null;
    setGroups((existing) => {
      const latest = existing[slug] ?? group;
      return {
        ...existing,
        [slug]: {
          ...latest,
          people: mergePeopleCatalogs(
            latest.people,
            currentResult ? rows(currentResult) : [],
            historicalResult ? rows(historicalResult) : [],
          ),
          currentPage: currentResult ? nextCurrentPage : latest.currentPage,
          historicalPage: historicalResult ? nextHistoricalPage : latest.historicalPage,
          loading: false,
          error: !currentResult && !historicalResult,
        },
      };
    });
  };

  const hasPeople = PEOPLE_LANGUAGES.some(({ slug }) => (groups[slug]?.people.length ?? 0) > 0);
  const loading = PEOPLE_LANGUAGES.some(({ slug }) => groups[slug]?.loading);

  return (
    <AppShell>
      <main className="page-content people-page">
        <section className="people-hero" aria-labelledby="people-title">
          <div className="people-hero-copy">
            <span className="people-eyebrow">FLIXYFY directory</span>
            <h1 id="people-title" className="flixyfy-metallic-gold people-display-gold">Discover People</h1>
            <p>Stars. Stories. Filmographies.</p>
          </div>
        </section>

        <div className="people-catalog-heading">
          <div>
            <small>Across languages and generations</small>
            <h2 className="flixyfy-metallic-gold people-display-gold">People</h2>
          </div>
          <p>Find a person and open their filmography.</p>
        </div>

        <section className="people-search-section" aria-label="Search people">
          <label className="people-search-box">
            <Search size={21} aria-hidden="true" />
            <span className="sr-only">Search actors, actresses, directors, and other film people</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search actors, actresses, directors…"
              autoComplete="off"
            />
          </label>
          {query.trim().length >= 2 ? (
            <div className="people-search-results" aria-live="polite">
              {searchState === "loading" ? <p className="people-search-message" role="status">Searching people…</p> : null}
              {searchState === "error" ? <p className="people-search-message" role="status">People search is unavailable right now.</p> : null}
              {searchState === "ready" && !searchPeople.length ? <p className="people-search-message" role="status">No people matched that search.</p> : null}
              {searchPeople.length ? (
                <div className="people-portrait-rail people-search-rail">
                  {searchPeople.map((person) => {
                    const name = person.display_name;
                    const personId = String(person.person_id);
                    const cardPerson = { person_id: personId, display_name: name, roles: person.roles };
                    return (
                      <a
                        className="people-person-card"
                        key={personId}
                        href={peopleFilmographyHref(cardPerson)}
                        aria-label={`Open ${name} filmography`}
                        onClick={() => trackPersonResultOpened(personId, "people_directory_search")}
                      >
                        <PersonPortrait person={cardPerson} name={name} tone={initialsColor(name)} />
                        <strong>{name}</strong>
                        <span className="people-person-language">{person.disambiguation || person.roles?.join(", ") || "Filmography"}</span>
                      </a>
                    );
                  })}
                </div>
              ) : null}
            </div>
          ) : null}
        </section>

        {PEOPLE_LANGUAGES.map(({ slug, name, subtitle }) => {
          const group = groups[slug] ?? emptyGroup();
          if (!group.loading && !group.people.length) return null;
          return (
            <section className="people-language-section" key={slug} aria-labelledby={`people-${slug}`}>
              <header className="people-language-heading">
                <div>
                  <span className="people-language-kicker">{slug.toUpperCase()}</span>
                  <h2 id={`people-${slug}`} className="flixyfy-metallic-gold people-display-gold">{name}</h2>
                  <p>{subtitle}</p>
                </div>
                {group.people.length ? <span className="people-group-count">{group.people.length.toLocaleString()} shown</span> : null}
              </header>

              {group.loading ? (
                <div className="people-loading" role="status"><LoaderCircle size={18} className="people-spinner" aria-hidden="true" /> Gathering names from the catalog…</div>
              ) : group.error ? (
                <p className="people-empty" role="status">This language group could not be loaded right now.</p>
              ) : !group.people.length ? (
                <p className="people-empty" role="status">No results were returned for this language by the current People endpoint.</p>
              ) : (
                <>
                  <div className="people-portrait-rail">
                    {group.people.map((person) => {
                      const nameText = personDisplayName(person);
                      const personId = String(person.person_id);
                      const href = peopleFilmographyHref(person);
                      return (
                        <a
                          className="people-person-card"
                          key={personId}
                          href={href}
                          aria-label={`Open ${nameText} filmography`}
                          onClick={() => trackPersonResultOpened(personId, "people_legend_card")}
                        >
                          <PersonPortrait person={person} name={nameText} tone={initialsColor(nameText)} />
                          <strong>{nameText}</strong>
                          <span className="people-person-language">{name.replace(" Legends", "")}</span>
                          <span className="people-card-arrow" aria-hidden="true"><ArrowRight size={15} /></span>
                        </a>
                      );
                    })}
                  </div>
                  {group.currentPage * PEOPLE_PAGE_SIZE < group.currentTotal || group.historicalPage * PEOPLE_PAGE_SIZE < group.historicalTotal ? (
                    <button className="people-load-more" type="button" onClick={() => void loadMore(slug)} disabled={group.loading}>
                      {group.loading ? "Loading…" : "Load more people"}
                    </button>
                  ) : null}
                </>
              )}
            </section>
          );
        })}

        {!hasPeople && !loading ? (
          <section className="people-empty-state">
            <UserRound size={28} aria-hidden="true" />
            <h2>People are taking the stage</h2>
            <p>There are no language-grouped people available from the catalog right now.</p>
          </section>
        ) : null}

        <p className="people-data-note">People and filmography links use the currently served catalog identities. Identity review is ongoing; these associations are not presented as fully verified.</p>
      </main>
    </AppShell>
  );
}
