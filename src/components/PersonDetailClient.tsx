"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "./AppShell";

type Person = {
  person_id: string | number;
  person_name?: string | null;
  display_name?: string | null;
  name?: string | null;
  page_title?: string | null;
  page_summary?: string | null;
  meta_description?: string | null;
  primary_language_movie_count?: number | null;
  career_attached_movie_count?: number | null;
  movie_count?: number | null;
  roles?: string[] | null;
};

type SlugResponse = {
  person?: Person | null;
  items?: { match_evidence?: { person_id?: string | number | null } | null }[];
  total?: number;
};

type ViewState =
  | { kind: "loading" }
  | { kind: "ready"; person: Person; total: number }
  | { kind: "ambiguous"; candidateIds: string[] }
  | { kind: "missing" }
  | { kind: "error" };

async function fetchSlug(path: string) {
  const response = await fetch(path, { cache: "no-store", headers: { accept: "application/json" } });
  let data: SlugResponse | null = null;
  try {
    data = (await response.json()) as SlugResponse;
  } catch {
    // The response status still distinguishes not-found and ambiguity from transport failures.
  }
  return { response, data };
}

function candidateIds(detail: unknown): string[] {
  if (!detail || typeof detail !== "object") return [];
  const value = (detail as { candidate_person_ids?: unknown }).candidate_person_ids;
  return Array.isArray(value) ? value.map(String) : [];
}

function ambiguityState(data: SlugResponse | null): ViewState | null {
  const detail = (data as (SlugResponse & { detail?: unknown }) | null)?.detail;
  const code = detail && typeof detail === "object" ? (detail as { code?: string }).code : "";
  if (code !== "ambiguous_person_slug") return null;
  return { kind: "ambiguous", candidateIds: candidateIds(detail) };
}

export default function PersonDetailClient({ slug }: { slug: string }) {
  const [state, setState] = useState<ViewState>({ kind: "loading" });

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ limit: "160" });

    async function load() {
      try {
        let result = await fetchSlug(`/api/v4/person/${encodeURIComponent(slug)}?${params.toString()}`);
        if (result.response.status === 409) {
          if (active) setState(ambiguityState(result.data) ?? { kind: "error" });
          return;
        }

        if (result.response.status === 404) {
          result = await fetchSlug(`/api/v4/historical/person/${encodeURIComponent(slug)}?${params.toString()}`);
        }
        if (result.response.status === 409) {
          if (active) setState(ambiguityState(result.data) ?? { kind: "error" });
          return;
        }
        if (result.response.status === 404) {
          if (active) setState({ kind: "missing" });
          return;
        }
        if (!result.response.ok || !result.data?.person) throw new Error("Person lookup failed");

        const personId = result.data.person.person_id;
        if (personId === null || personId === undefined || String(personId) === "") throw new Error("Person ID missing");
        const items = result.data.items ?? [];
        if (items.some((item) => String(item.match_evidence?.person_id ?? "") !== String(personId))) {
          throw new Error("Person evidence does not match resolved identity");
        }
        if (active) setState({ kind: "ready", person: result.data.person, total: result.data.total ?? items.length });
      } catch {
        if (active) setState({ kind: "error" });
      }
    }

    void load();
    return () => { active = false; };
  }, [slug]);

  const person = state.kind === "ready" ? state.person : null;
  const title = person?.page_title || person?.person_name || person?.display_name || person?.name || "Person";
  const filmographyHref = person
    ? `/search?${new URLSearchParams({ person_id: String(person.person_id), q: person.person_name || person.display_name || person.name || "" }).toString()}`
    : "";

  return (
    <AppShell>
      <main className="page-content person-detail-page">
        <Link className="person-detail-back" href="/people">← People</Link>
        {state.kind === "loading" ? <p role="status">Loading person…</p> : null}
        {state.kind === "missing" ? <section className="person-detail-panel"><h1>Person not found</h1><p>No person matches this URL.</p></section> : null}
        {state.kind === "error" ? <section className="person-detail-panel"><h1>Person details unavailable</h1><p>We could not verify this person right now. Please try again.</p></section> : null}
        {state.kind === "ambiguous" ? (
          <section className="person-detail-panel" aria-live="polite">
            <h1>This Person URL matches more than one person</h1>
            <p>No person was selected. Search People and choose the intended result.</p>
            {state.candidateIds.length ? <p>Candidate person IDs: {state.candidateIds.join(", ")}</p> : null}
            <Link href="/people">Search People</Link>
          </section>
        ) : null}
        {state.kind === "ready" ? (
          <section className="person-detail-panel">
            <p className="person-detail-eyebrow">Person filmography</p>
            <h1>{title}</h1>
            {person?.page_summary || person?.meta_description ? <p>{person.page_summary || person.meta_description}</p> : null}
            <dl className="person-detail-stats">
              <div><dt>Movies</dt><dd>{state.total}</dd></div>
              {state.person.roles?.length ? <div><dt>Known for</dt><dd>{state.person.roles.join(", ")}</dd></div> : null}
              {state.person.career_attached_movie_count || state.person.primary_language_movie_count || state.person.movie_count ? <div><dt>Career titles</dt><dd>{state.person.career_attached_movie_count ?? state.person.primary_language_movie_count ?? state.person.movie_count}</dd></div> : null}
            </dl>
            <Link className="person-detail-filmography-link" href={filmographyHref}>Open exact-ID filmography</Link>
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}
