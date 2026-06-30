import "./OttProviderCards.css";
import { getBestProviderUrl } from "../utils/providerLinks";

const PROVIDER_LOGOS = {
  "Prime Video": "/ott/prime-video.png",
  Netflix: "/ott/netflix.png",
  JioHotstar: "/ott/jiohotstar.png",
  ZEE5: "/ott/zee5.png",
  SonyLIV: "/ott/sonyliv.png",
  "Sun NXT": "/ott/sunnxt.png",
  Aha: "/ott/aha.png",
  "ETV Win": "/ott/etv-win.png",
};

const PRIORITY = {
  free: 1,
  subscription: 2,
  rent: 3,
  buy: 4,
};

function normalizeType(type) {
  if (!type) return "subscription";
  return String(type).toLowerCase();
}

export default function OttProviderCards({ providers = [] }) {
  const sortedProviders = [...providers].sort((a, b) => {
    const aType = normalizeType(a.provider_type);
    const bType = normalizeType(b.provider_type);
    return (PRIORITY[aType] || 99) - (PRIORITY[bType] || 99);
  });

  if (!sortedProviders.length) {
    return (
      <section className="ott-section">
        <h2>Where to Watch</h2>
        <div className="ott-empty">OTT availability not found yet.</div>
      </section>
    );
  }

  return (
    <section className="ott-section">
      <div className="ott-header">
        <h2>Where to Watch</h2>
        <span>{sortedProviders.length} platform{sortedProviders.length > 1 ? "s" : ""}</span>
      </div>

      <div className="ott-grid">
        {sortedProviders.map((item, index) => {
          const name = item.provider_name;
          const type = normalizeType(item.provider_type);
          const logo = PROVIDER_LOGOS[name];
          const url = getBestProviderUrl(item);

          return (
            <a
              key={`${name}-${index}`}
              className="ott-card"
              href={url || "#"}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Watch on ${name}`}
            >
              <div className="ott-logo-wrap">
                {logo ? (
                  <img src={logo} alt={name} className="ott-logo" />
                ) : (
                  <div className="ott-logo-fallback">{name?.slice(0, 2)}</div>
                )}
              </div>

              <div className="ott-info">
                <strong>{name}</strong>
                <span className={`ott-type ott-type-${type}`}>{type}</span>
              </div>

              <div className="ott-action">Watch Now</div>
            </a>
          );
        })}
      </div>
    </section>
  );
}
