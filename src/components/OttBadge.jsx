const PROVIDER_LOGOS = {
  netflix: "netflix.svg",
  prime_video: "prime-video.svg",
  jiohotstar: "jiohotstar.svg",
  hotstar: "jiohotstar.svg",
  youtube: "youtube.svg",
  zee5: "zee5.svg",
  mxplayer: "mx-player.svg",
  sunnxt: "sun-nxt.svg",
  sonyliv: "sony-liv.svg",
  aha: "aha.svg",
  hoichoi: "hoichoi.svg",
  manoramamax: "manoramamax.svg",
  shemaroome: "shemaroome.svg",
};

function normalizeProviderKey(key, provider) {
  const raw = key || provider || "";
  return raw
    .toLowerCase()
    .replaceAll(" ", "_")
    .replaceAll("-", "_")
    .replaceAll(".", "")
    .replaceAll("&", "and");
}

export default function OttBadge({ provider, providerKey }) {
  if (!provider) return null;

  const key = normalizeProviderKey(providerKey, provider);
  const logo = PROVIDER_LOGOS[key];

  return (
    <div className="ott-badge" title={provider}>
      {logo ? (
        <img src={`/ott/${logo}`} alt={provider} className="ott-badge-logo" />
      ) : (
        <span className="ott-badge-text">{provider}</span>
      )}
    </div>
  );
}