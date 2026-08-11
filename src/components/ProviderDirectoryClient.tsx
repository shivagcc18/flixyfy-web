"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import AppShell from "./AppShell";

type ProviderRow = {
  provider_key: string;
  provider_name: string;
  category: string;
  movie_count: number;
  flatrate_rows: number;
  rent_rows: number;
  buy_rows: number;
  home_url?: string | null;
};

export default function ProviderDirectoryClient() {
  const [items, setItems] = useState<ProviderRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<{
      items?: Array<{
        provider_key: string;
        provider_name: string;
        row_count?: number;
        content_count?: number;
      }>;
    }>("/api/v4/providers")
      .then((data) => setItems((data.items ?? []).map((item) => ({
        provider_key: item.provider_key,
        provider_name: item.provider_name,
        category: "OTT",
        movie_count: Number(item.content_count ?? 0),
        flatrate_rows: Number(item.row_count ?? 0),
        rent_rows: 0,
        buy_rows: 0,
      }))))
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Failed to load providers"),
      );
  }, []);

  const sorted = useMemo(
    () => [...items].sort((a, b) => b.movie_count - a.movie_count || a.provider_name.localeCompare(b.provider_name)),
    [items],
  );

  return (
    <AppShell>
      <main className="page-content providers-page">
        <section className="search-header provider-header">
          <small>PROVIDERS</small>
          <h1>Browse by streaming service</h1>
          <p className="page-lead">
            Pick a provider to discover movies associated with that service. Watch actions remain on movie detail pages.
          </p>
        </section>

        {error ? <section className="error-panel"><p>{error}</p></section> : null}

        {!sorted.length && !error ? (
          <div className="provider-skeleton-grid" aria-busy="true">
            {Array.from({ length: 9 }, (_, index) => <span key={index} />)}
          </div>
        ) : null}

        <div className="provider-directory">
          {sorted.map((provider) => (
            <a
              key={provider.provider_key}
              href={`/search?provider=${encodeURIComponent(provider.provider_key)}`}
              aria-label={`Browse ${provider.provider_name} movies`}
            >
              <div className="provider-wordmark-large">{provider.provider_name}</div>
              <div className="provider-count">
                {provider.movie_count.toLocaleString()}
                <span>movies</span>
              </div>
              <ArrowRight aria-hidden="true" size={18} />
            </a>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
