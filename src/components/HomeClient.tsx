"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Database, SearchCheck, Sparkles, Tv2 } from "lucide-react";
import { apiFetch, type Movie } from "@/lib/api";
import AppShell from "./AppShell";
import MovieCard from "./MovieCard";
import SearchInput from "./SearchInput";

type HomeData = {
  sections: { key: string; title: string; description: string; items: Movie[] }[];
};

type HomePayload = {
  current?: { items?: Movie[] };
  historical?: { items?: Movie[] };
};

const examples = [
  "NTR movies",
  "Prabhas on Netflix",
  "Telugu action movies",
  "Tamil classics",
];

function LoadingRail() {
  return (
    <div className="movie-rail" aria-label="Loading movies" aria-busy="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="skeleton-card" key={index}>
          <div className="skeleton-poster" />
          <div className="skeleton-line long" />
          <div className="skeleton-line short" />
        </div>
      ))}
    </div>
  );
}

export default function HomeClient() {
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState("");
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let active = true;
    setData(null);
    setError("");
    apiFetch<HomePayload>("/api/v4/home?limit=12")
      .then((response) => {
        if (!active) return;
        setData({
          sections: [
            {
              key: "current",
              title: "Current Indian movies",
              description: "Recent titles in the accepted serving snapshot.",
              items: response.current?.items ?? [],
            },
            {
              key: "historical",
              title: "Indian classics",
              description: "Historical titles, kept in their own discovery lane.",
              items: response.historical?.items ?? [],
            },
          ].filter((section) => section.items.length > 0),
        });
      })
      .catch((reason: unknown) => {
        if (active) setError(reason instanceof Error ? reason.message : "Backend unavailable");
      });
    return () => {
      active = false;
    };
  }, [retryKey]);

  return (
    <AppShell>
      <main className="page-content">
        <section className="hero" aria-labelledby="home-heading">
          <div className="hero-orbit" aria-hidden="true" />
          <div className="hero-copy">
            <div className="eyebrow"><Sparkles size={15} aria-hidden="true" />Indian cinema discovery</div>
            <h1 id="home-heading">Search smarter.<br /><span>Watch with confidence.</span></h1>
            <p>
              Explore current and historical Indian movies by title, person,
              language, year, genre, provider or natural search.
            </p>
            <SearchInput large />
            <div className="discovery-chips" aria-label="Popular searches">
              {examples.map((item) => (
                <Link href={`/search?q=${encodeURIComponent(item)}`} key={item}>{item}</Link>
              ))}
            </div>
          </div>
          <div className="hero-signals" aria-label="FLIXYFY capabilities">
            <div><Database size={17} aria-hidden="true" /><strong>Serving snapshot</strong><span>clean indexed data</span></div>
            <div><Tv2 size={17} aria-hidden="true" /><strong>Availability aware</strong><span>provider detail stays separate</span></div>
            <div><SearchCheck size={17} aria-hidden="true" /><strong>Entity-aware</strong><span>titles, people and metadata</span></div>
          </div>
        </section>

        {error ? (
          <div className="status-banner" role="status">
            <div><strong>Discovery is taking a moment.</strong><span>{error}</span></div>
            <button type="button" onClick={() => setRetryKey((value) => value + 1)}>Retry <ArrowRight size={15} aria-hidden="true" /></button>
          </div>
        ) : null}

        {!data && !error ? <LoadingRail /> : null}

        {data?.sections.map((section, index) => (
          <section className="content-section" key={section.key} aria-labelledby={`${section.key}-heading`}>
            <div className="section-heading">
              <div><small>{index === 0 ? "NOW DISCOVERING" : "FROM THE ARCHIVE"}</small><h2 id={`${section.key}-heading`}>{section.title}</h2><p>{section.description}</p></div>
              <Link href={`/search?domain=${section.key === "historical" ? "historical" : "current"}`}>Explore all <ArrowRight size={15} aria-hidden="true" /></Link>
            </div>
            <div className={index === 0 ? "movie-rail" : "movie-grid"}>
              {section.items.map((movie) => <MovieCard movie={movie} key={movie.canonical_movie_id} />)}
            </div>
          </section>
        ))}

        {data && !data.sections.length ? (
          <section className="empty-state">
            <Sparkles size={22} aria-hidden="true" />
            <div><strong>No titles are available in this snapshot yet.</strong><span>Try the search route for a specific movie or person.</span></div>
            <Link href="/search">Open search <ArrowRight size={15} aria-hidden="true" /></Link>
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}
