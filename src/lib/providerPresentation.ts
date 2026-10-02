type Presentation = { label: string; logo?: string };

const providers: Record<string, Presentation> = {
  aha: { label: "Aha", logo: "/ott/aha.png" },
  apple_tv: { label: "Apple TV", logo: "/ott/AppleTV.png" },
  etv_win: { label: "ETV Win", logo: "/ott/etv-win.png" },
  google_play: { label: "Google Play", logo: "/ott/Google.png" },
  jiohotstar: { label: "JioHotstar", logo: "/ott/jiohotstar.png" },
  netflix: { label: "Netflix", logo: "/ott/netflix.png" },
  prime_video: { label: "Prime Video", logo: "/ott/prime-video.png" },
  sonyliv: { label: "SonyLIV", logo: "/ott/sonyliv.png" },
  sun_nxt: { label: "Sun NXT", logo: "/ott/sun-nxt.png" },
  vi_movies_and_tv: { label: "VI Movies & TV", logo: "/ott/VI_movies.png" },
  zee5: { label: "ZEE5", logo: "/ott/zee5.png" },
  youtube: { label: "YouTube", logo: "/logos/indian-providers/youtube.svg" },
  manoramamax: { label: "ManoramaMAX" },
  shemaroome: { label: "ShemarooMe" },
  hoichoi: { label: "Hoichoi" },
  hungama_play: { label: "Hungama Play" },
  kableone: { label: "KableOne" },
  plex: { label: "Plex" },
  lionsgate_play: { label: "Lionsgate Play" },
  brew: { label: "Brew" },
  epic_on: { label: "EPIC ON" },
  docalliance_films: { label: "DocAlliance Films" },
  mubi: { label: "MUBI" },
  dekkoo: { label: "Dekkoo" },
  artiflix: { label: "Artiflix" },
  bloodstream: { label: "Bloodstream" },
  eventive: { label: "Eventive" },
  filmbox_plus: { label: "FilmBox+" },
  wow_presents_plus: { label: "WOW Presents Plus" },
};

export function providerPresentation(providerKey?: string | null, providerName?: string | null) {
  const canonicalKey = providerKey?.trim().toLowerCase();
  const known = canonicalKey ? providers[canonicalKey] : undefined;
  const fallbackName = (providerName || providerKey || "Provider").trim();
  return {
    label: known?.label ?? fallbackName.replace(/_/g, " "),
    logo: known?.logo,
  };
}
