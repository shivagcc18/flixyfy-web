import { useEffect, useState } from "react";

export default function WatchProviders({ tmdbId }) {
  const [providers, setProviders] = useState([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!tmdbId) return;

    fetch(`http://127.0.0.1:8000/api/indian/movies/${tmdbId}/watch`)
      .then((res) => res.json())
      .then((data) => {
        setProviders(Array.isArray(data.providers) ? data.providers : []);
        setLoaded(true);
      })
      .catch(() => {
        setProviders([]);
        setLoaded(true);
      });
  }, [tmdbId]);

  if (!loaded) return <p>Loading watch options...</p>;

  if (!providers.length) {
    return (
      <div style={{ marginTop: "24px" }}>
        <h2>Where to Watch</h2>
        <p>OTT availability not added yet.</p>
      </div>
    );
  }

  return (
    <div style={{ marginTop: "24px" }}>
      <h2>Where to Watch</h2>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
        {providers.map((p) => (
          <div
            key={`${p.provider_name}-${p.provider_type}`}
            style={{
              background: "#111",
              border: "1px solid #333",
              borderRadius: "10px",
              padding: "12px 16px",
              minWidth: "140px",
            }}
          >
            <strong>{p.provider_name}</strong>
            <div style={{ fontSize: "13px", opacity: 0.75 }}>
              {p.provider_type}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}