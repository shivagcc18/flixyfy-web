"use client";

import { useEffect, useState } from "react";
import { Tv2 } from "lucide-react";
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
    apiFetch<{ items?: Array<{ provider_key: string; provider_name: string; row_count?: number; content_count?: number }> }>("/api/v4/providers")
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
        setError(reason instanceof Error ? reason.message : "Failed to load"),
      );
  }, []);

  return (
    <AppShell>
      <main className="page-content">
        <section className="search-header">
          <span className="section-kicker">PROVIDER DIRECTORY</span>
          <h1>OTT coverage in the final snapshot</h1>
          <p className="page-lead">
            Provider-wise movie counts from the accepted fresh India availability dataset.
          </p>
        </section>

        {error ? (
          <section className="error-panel">
            <p>{error}</p>
          </section>
        ) : null}

        <div className="provider-directory">
          {items.map((provider) => (
            <a
              key={provider.provider_key}
              href={`/search?q=${encodeURIComponent(provider.provider_name)}`}
            >
              <div className="provider-icon">
                <Tv2 size={24} />
              </div>
              <div>
                <strong>{provider.provider_name}</strong>
                <span>{provider.category}</span>
              </div>
              <div className="provider-count">
                {provider.movie_count.toLocaleString()}
                <span>movies</span>
              </div>
            </a>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
