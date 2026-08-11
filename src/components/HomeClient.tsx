"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, CircleCheckBig, Compass, Sparkles, Tv2 } from "lucide-react";
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
  webseries?: { items?: Movie[] };
  hollywood?: { items?: Movie[] };
};

type ProviderRow = {
  provider_key: string;
  provider_name: string;
  content_count?: number;
  row_count?: number;
};

const examples = [
  "Telugu action movies",
  "1990s Tamil classics",
  "Hindi comedy movies",
];

const languages = [
  { key: "", label: "All" },
  { key: "te", label: "Telugu" },
  { key: "hi", label: "Hindi" },
  { key: "ta", label: "Tamil" },
  { key: "ml", label: "Malayalam" },
  { key: "kn", label: "Kannada" },
  { key: "bn", label: "Bengali" },
  { key: "mr", label: "Marathi" },
];

function sectionSearch(sectionKey: string) {
  if (sectionKey === "historical") return "/search?q=Indian%20classics";
  if (sectionKey === "webseries") return "/search?q=Indian%20web%20series";
  return "/search";
}

export default function HomeClient() {
  const [data, setData] = useState<HomeData | null>(null);
  const [providers, setProviders] = useState<ProviderRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    Promise.allSettled([
      apiFetch<HomePayload>("/api/v4/home?limit=12"),
      apiFetch<{ items?: ProviderRow[] }>("/api/v4/providers"),
    ]).then(([homeResult, providerResult]) => {
      if (!active) return;

      if (homeResult.status === "fulfilled") {
        const response = homeResult.value;
        setData({
          sections: [
            { key: "current", title: "Current Indian movies", items: response.current?.items ?? [] },
            { key: "historical", title: "Indian classics", items: response.historical?.items ?? [] },
            { key: "webseries", title: "Indian web series", items: response.webseries?.items ?? [] },
          ].filter((section) => section.items.length > 0),
        });
      } else {
        setError(homeResult.reason instanceof Error ? homeResult.reason.message : "Backend unavailable");
      }

      if (providerResult.status === "fulfilled") {
        setProviders((providerResult.value.items ?? []).slice(0, 16));
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const providerTiles = useMemo(
    () => providers.filter((item) => item.provider_key && item.provider_name),
    [providers],
  );

  return (
    <AppShell>
      <main className="page-content home-page">
        <section className="hero" aria-labelledby="home-hero-title">
          <div className="hero-copy">
            <div className="eyebrow">
              <Sparkles size={15} aria-hidden="true" />
              Indian movies and web series
            </div>
            <h1 id="home-hero-title">
              Find Indian movies.
              <span>Know where to watch.</span>
            </h1>
            <p>Search by movie, person, language, genre, year or provider.</p>
          </div>

          <SearchInput large />

          <div className="discovery-chips" aria-label="Example searches">
            {examples.map((item) => (
              <a href={`/search?q=${encodeURIComponent(item)}`} key={item}>{item}</a>
            ))}
          </div>

          <div className="hero-trust">
            <span><CircleCheckBig size={17} aria-hidden="true" />Current movies and classics</span>
            <span><Tv2 size={17} aria-hidden="true" />OTT and YouTube shown separately</span>
            <span><Compass size={17} aria-hidden="true" />Browse by language and provider</span>
          </div>

          <div className="hero-orbit hero-orbit-one" aria-hidden="true" />
          <div className="hero-orbit hero-orbit-two" aria-hidden="true" />
        </section>

        <section className="shortcut-section" aria-labelledby="language-title">
          <div className="section-heading compact-heading">
            <div>
              <small>START WITH A SHORTCUT</small>
              <h2 id="language-title">Language-first discovery</h2>
            </div>
            <a href="/search">Open full search <ArrowRight size={16} aria-hidden="true" /></a>
          </div>
          <div className="language-rail" aria-label="Browse by language">
            {languages.map((language) => (
              <a
                className={language.key === "" ? "active" : undefined}
                href={language.key ? `/search?language=${language.key}` : "/search"}
                key={language.label}
              >
                {language.label}
              </a>
            ))}
            <a href="/search" className="more-chip">More</a>
          </div>
        </section>

        {providerTiles.length ? (
          <section className="shortcut-section provider-shortcut" aria-labelledby="provider-title">
            <div className="section-heading compact-heading">
              <div>
                <small>WATCH BY PROVIDER</small>
                <h2 id="provider-title">Browse streaming services</h2>
              </div>
              <a href="/providers">All providers <ArrowRight size={16} aria-hidden="true" /></a>
            </div>
            <div className="provider-rail" tabIndex={0} aria-label="Provider shortcuts">
              {providerTiles.map((provider) => (
                <a href={`/search?provider=${encodeURIComponent(provider.provider_key)}`} key={provider.provider_key}>
                  <span className="provider-wordmark">{provider.provider_name}</span>
                  <small>{Number(provider.content_count ?? 0).toLocaleString()} movies</small>
                </a>
              ))}
            </div>
          </section>
        ) : null}

        {error ? (
          <section className="error-panel">
            <h2>Backend is not reachable</h2>
            <p>{error}</p>
          </section>
        ) : null}

        {!data && !error ? (
          <div className="skeleton-row" aria-label="Loading movies" aria-busy="true">
            {Array.from({ length: 7 }, (_, index) => <span key={index} />)}
          </div>
        ) : null}

        {data?.sections.map((section) => (
          <section className="content-section poster-section" key={section.key} aria-labelledby={`section-${section.key}`}>
            <div className="section-heading">
              <div>
                <small>DISCOVER</small>
                <h2 id={`section-${section.key}`}>{section.title}</h2>
              </div>
              <a href={sectionSearch(section.key)}>View all <ArrowRight size={16} aria-hidden="true" /></a>
            </div>
            <div className="poster-row" tabIndex={0} aria-label={`${section.title} poster row`}>
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
