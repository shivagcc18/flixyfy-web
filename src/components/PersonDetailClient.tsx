"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AppShell from "./AppShell";
import { apiFetch, type Movie } from "@/lib/api";

type PersonPayload = {
  person?: { person_id?: string | number; name?: string; display_name?: string; roles?: string[]; career_attached_movie_count?: number };
  items?: Movie[];
  total?: number;
};

export default function PersonDetailClient({ personId }: { personId: string }) {
  const [payload, setPayload] = useState<PersonPayload | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    if (!/^\d+$/.test(personId)) { setError("This Person URL needs a canonical numeric ID."); return () => { active = false; }; }
    apiFetch<PersonPayload>(`/api/v4/people/${encodeURIComponent(personId)}?limit=100`)
      .then((value) => { if (active) setPayload(value); })
      .catch(() => { if (active) setError("Person details are unavailable right now."); });
    return () => { active = false; };
  }, [personId]);

  const person = payload?.person;
  return <AppShell><main className="page-content person-detail-page">
    <Link className="person-detail-back" href="/people">← People</Link>
    {error ? <section className="person-detail-panel" role="alert"><h1>{error}</h1></section> : !payload ? <section className="person-detail-panel" role="status"><h1>Loading person…</h1></section> : <>
      <header className="person-detail-panel"><small>PERSON · ID {person?.person_id}</small><h1>{person?.display_name ?? person?.name ?? `Person ${personId}`}</h1><p>{(person?.roles ?? []).join(", ")}</p><p>{person?.career_attached_movie_count ?? payload.total ?? 0} mapped movies</p></header>
      <section aria-label={`${person?.display_name ?? person?.name ?? "Person"} filmography`}><h2>Filmography</h2>{payload.items?.length ? <ul>{payload.items.map((movie) => <li key={movie.canonical_movie_id}><strong>{movie.title}</strong> · {movie.release_year ?? "Year unavailable"}</li>)}</ul> : <p>No serving filmography is available for this Person ID.</p>}</section>
    </>}
  </main></AppShell>;
}
