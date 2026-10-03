"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowRight, LoaderCircle, UserRound } from "lucide-react";
import AppShell from "./AppShell";
import { apiFetch } from "@/lib/api";
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

export default function PeopleLandingClient() {
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
          <div className="people-hero-orbit" aria-hidden="true" />
          <div className="people-hero-copy">
            <span className="people-eyebrow">Cinema legends</span>
            <h1 id="people-title" className="flixyfy-metallic-gold people-display-gold">The Legends of Indian Cinema</h1>
            <p>Icons. Stories. Generations. All in one place.</p>
            <div className="people-hero-rule" aria-hidden="true" />
            <span className="people-hero-caption">A living history, told through the people behind the films.</span>
          </div>
          <span className="people-hero-word flixyfy-metallic-gold people-display-gold" aria-hidden="true">Legends</span>
        </section>

        <div className="people-catalog-heading">
          <div>
            <small>Across languages and generations</small>
            <h2 className="flixyfy-metallic-gold people-display-gold">Legends</h2>
          </div>
          <p>Explore the artists connected to FLIXYFY’s film catalog.</p>
        </div>

        {PEOPLE_LANGUAGES.map(({ slug, name, subtitle }) => {
          const group = groups[slug] ?? emptyGroup();
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
                          <span className={`people-portrait people-portrait-tone-${initialsColor(nameText)}`} aria-hidden="true">
                            <span className="people-portrait-inner"><UserRound size={38} strokeWidth={1.35} aria-hidden="true" /></span>
                            <span className="people-initials">{personInitials(nameText)}</span>
                          </span>
                          <strong>{nameText}</strong>
                          <span className="people-person-language">{name.replace(" Legends", "")}</span>
                          <span className="people-card-arrow" aria-hidden="true"><ArrowRight size={15} /></span>
                        </a>
                      );
                    })}
                  </div>
                  {group.currentPage * PEOPLE_PAGE_SIZE < group.currentTotal || group.historicalPage * PEOPLE_PAGE_SIZE < group.historicalTotal ? (
                    <button className="people-load-more" type="button" onClick={() => void loadMore(slug)} disabled={group.loading}>
                      {group.loading ? "Loading…" : "Load more legends"}
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
