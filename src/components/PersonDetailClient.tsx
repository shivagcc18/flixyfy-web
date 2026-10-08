"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AppShell from "./AppShell";

type PersonPayload = { person?: { person_id?: string | number; name?: string; display_name?: string }; detail?: { code?: string } };
type Status = "loading" | "missing" | "ambiguous" | "error";

export default function PersonDetailClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>("loading");
  useEffect(() => {
    let active = true;
    const resolve = async () => {
      try {
        let response = await fetch(`/api/v1/person/current/${encodeURIComponent(slug)}`, { cache: "no-store", headers: { accept: "application/json" } });
        if (response.status === 404) response = await fetch(`/api/v1/person/historical/${encodeURIComponent(slug)}`, { cache: "no-store", headers: { accept: "application/json" } });
        const payload = await response.json() as PersonPayload;
        if (response.status === 409 || payload.detail?.code === "ambiguous_person_slug") { if (active) setStatus("ambiguous"); return; }
        if (response.status === 404) { if (active) setStatus("missing"); return; }
        if (!response.ok || !payload.person?.person_id) throw new Error("Person lookup failed");
        const id = String(payload.person.person_id);
        const name = payload.person.display_name?.trim() || payload.person.name?.trim() || `Person ${id}`;
        if (active) router.replace(`/search?${new URLSearchParams({ person_id: id, q: name })}`);
      } catch { if (active) setStatus("error"); }
    };
    void resolve();
    return () => { active = false; };
  }, [router, slug]);

  const message = status === "loading" ? "Resolving person…" : status === "missing" ? "Person not found" : status === "ambiguous" ? "This URL matches more than one person" : "Person details are unavailable right now";
  return <AppShell><main className="page-content person-detail-page"><Link className="person-detail-back" href="/people">← People</Link><section className="person-detail-panel" role={status === "error" ? "alert" : "status"}><small>PERSON</small><h1>{message}</h1>{status === "ambiguous" ? <p>Search People and choose the intended result.</p> : null}{status !== "loading" ? <Link href="/people">Search People</Link> : <p>Loading canonical identity…</p>}</section></main></AppShell>;
}
