"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "./AppShell";

type PersonSlugResponse = {
  person?: {
    person_id?: string | number | null;
    name?: string | null;
    display_name?: string | null;
  } | null;
  detail?: { code?: string; candidate_person_ids?: unknown };
};

type ViewState = "loading" | "ambiguous" | "missing" | "error";

async function fetchPerson(path: string) {
  const response = await fetch(path, { cache: "no-store", headers: { accept: "application/json" } });
  let data: PersonSlugResponse | null = null;
  try {
    data = (await response.json()) as PersonSlugResponse;
  } catch {
    // Keep status handling deterministic when the backend returns a non-JSON error.
  }
  return { response, data };
}

export default function PersonDetailClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [state, setState] = useState<ViewState>("loading");

  useEffect(() => {
    let active = true;

    async function resolvePerson() {
      try {
        let result = await fetchPerson(`/api/v1/person/current/${encodeURIComponent(slug)}`);
        if (result.response.status === 404) {
          result = await fetchPerson(`/api/v1/person/historical/${encodeURIComponent(slug)}`);
        }
        if (result.response.status === 409 || result.data?.detail?.code === "ambiguous_person_slug") {
          if (active) setState("ambiguous");
          return;
        }
        if (result.response.status === 404) {
          if (active) setState("missing");
          return;
        }
        if (!result.response.ok || !result.data?.person) throw new Error("Person slug lookup failed");

        const personId = String(result.data.person.person_id ?? "").trim();
        const name = String(result.data.person.display_name ?? result.data.person.name ?? "").trim();
        if (!personId || !name) throw new Error("Person identity missing");
        if (active) {
          const query = new URLSearchParams({ person_id: personId, q: name });
          router.replace(`/search?${query.toString()}`);
        }
      } catch {
        if (active) setState("error");
      }
    }

    void resolvePerson();
    return () => {
      active = false;
    };
  }, [router, slug]);

  return (
    <AppShell>
      <main className="page-content person-detail-page">
        <Link className="person-detail-back" href="/people">← People</Link>
        {state === "loading" ? <p role="status">Loading person…</p> : null}
        {state === "missing" ? <section className="person-detail-panel"><h1>Person not found</h1><p>No person matches this URL.</p></section> : null}
        {state === "error" ? <section className="person-detail-panel"><h1>Person details unavailable</h1><p>We could not verify this person right now. Please try again.</p></section> : null}
        {state === "ambiguous" ? (
          <section className="person-detail-panel" aria-live="polite">
            <h1>This Person URL matches more than one person</h1>
            <p>No person was selected. Search People and choose the intended result.</p>
            <Link href="/people">Search People</Link>
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}
