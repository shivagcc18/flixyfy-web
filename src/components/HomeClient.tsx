"use client";

import { useEffect, useState } from "react";
import { Database, SearchCheck, Sparkles, Tv2 } from "lucide-react";
import { apiFetch, type Movie } from "@/lib/api";
import AppShell from "./AppShell";
import MovieCard from "./MovieCard";
import SearchInput from "./SearchInput";

type HomeData = {
  sections: { key: string; title: string; items: Movie[] }[];
};

type HomePayload = {
  current?: { items?: Movie[] };
  historical?: { items?: Movie[] };
};

const examples = [
  "NTR movies",
  "Prabhas on Netflix",
  "Telugu action movies",
  "Hindi movies on Prime Video",
  "Tamil classics",
  "Movies from 2022",
];

export default function HomeClient() {
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<HomePayload>("/api/v4/home?limit=12")
      .then((response) => setData({
        sections: [
          { key: "current", title: "Current movies", items: response.current?.items ?? [] },
          { key: "historical", title: "Indian classics", items: response.historical?.items ?? [] },
        ].filter((section) => section.items.length > 0),
      }))
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Backend unavailable"),
      );
  }, []);

  return (
    <AppShell>
      <main className="page-content">
        <section className="hero">
          <div className="eyebrow"><Sparkles size={16} aria-hidden="true" />Search intelligence for Indian cinema</div>
          <h1>Search smarter.<br /><span>Watch with confidence.</span></h1>
          <p>
            Search active Indian movie data by title, person, language, year,
            provider and current or historical domain.
          </p>
          <SearchInput large />
          <div className="discovery-chips">
            {examples.map((item) => (
              <a href={`/search?q=${encodeURIComponent(item)}`} key={item}>{item}</a>
            ))}
          </div>
          <div className="hero-stats">
            <div><Database size={20} aria-hidden="true" /><strong>Live</strong><span>serving snapshot</span></div>
            <div><Tv2 size={20} aria-hidden="true" /><strong>Verified</strong><span>availability data</span></div>
            <div><SearchCheck size={20} aria-hidden="true" /><strong>Cross-entity</strong><span>search</span></div>
          </div>
        </section>

        {error ? (
          <section className="error-panel">
            <h2>Backend is not reachable</h2>
            <p>{error}</p>
          </section>
        ) : null}
        {!data && !error ? <div className="loading-panel">Loading FLIXYFY...</div> : null}

        {data?.sections.map((section) => (
          <section className="content-section" key={section.key}>
            <div className="section-heading">
              <div><small>DISCOVER</small><h2>{section.title}</h2></div>
              <a href="/search">Explore all</a>
            </div>
            <div className="movie-grid">
              {section.items.map((movie) => (
                <MovieCard movie={movie} key={movie.canonical_movie_id} />
              ))}
            </div>
          </section>
        ))}
      </main>
    </AppShell>
  );
}
