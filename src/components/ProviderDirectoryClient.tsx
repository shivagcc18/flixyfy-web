"use client";

import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import AppShell from "./AppShell";
import ProviderLogo from "./ProviderLogo";

type ProviderRow = {
  provider_key: string;
  provider_name: string;
  provider_type: string;
  movie_count: number;
  flatrate_rows: number;
  rent_rows: number;
  buy_rows: number;
  home_url?: string | null;
};

const YOUTUBE_BROWSE_PROVIDER: ProviderRow = {
  provider_key: "youtube",
  provider_name: "YouTube",
  provider_type: "FREE_STREAMING",
  movie_count: 9936,
  flatrate_rows: 9936,
  rent_rows: 0,
  buy_rows: 0,
};

export default function ProviderDirectoryClient() {
  const [items, setItems] = useState<ProviderRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch<{ items?: Array<{ provider_key: string; provider_name: string; provider_type?: string; row_count?: number; content_count?: number }> }>("/api/v4/providers")
      .then((data) => {
        const apiItems = (data.items ?? []).map((item) => ({
          provider_key: item.provider_key,
          provider_name: item.provider_name,
          provider_type: item.provider_type ?? "UNKNOWN_OR_UNAPPROVED",
          movie_count: Number(item.content_count ?? 0),
          flatrate_rows: Number(item.row_count ?? 0),
          rent_rows: 0,
          buy_rows: 0,
        }));
        setItems(apiItems.some((item) => item.provider_key === "youtube")
          ? apiItems
          : [...apiItems, YOUTUBE_BROWSE_PROVIDER]);
      })
      .catch((reason: unknown) =>
        setError(reason instanceof Error ? reason.message : "Failed to load"),
      );
  }, []);

  return (
    <AppShell>
      <main className="page-content">
        <section className="search-header">
          <span className="section-kicker">PROVIDER DIRECTORY</span>
          <h1>Approved watch providers in India</h1>
          <p className="page-lead">
            Counts and categories from the approved India availability serving relation.
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
              href={`/search?provider=${encodeURIComponent(provider.provider_key)}`}
              className="provider-directory-card"
            >
              <div className="provider-directory-card__meta">
                <span>{provider.provider_type.replaceAll("_", " ")}</span>
                <div className="provider-count">
                  {provider.movie_count.toLocaleString()}
                  <span>movies</span>
                  <ArrowRight size={15} aria-hidden="true" />
                </div>
              </div>
              <div className="provider-icon provider-directory-card__logo">
                <ProviderLogo providerKey={provider.provider_key} providerName={provider.provider_name} />
              </div>
              <div className="provider-directory-card__name">
                <strong>{provider.provider_name}</strong>
              </div>
            </a>
          ))}
        </div>
      </main>
    </AppShell>
  );
}
