import { expect, test } from "@playwright/test";

const movieDetailFixture = (providers: { key: string; offer_count: number; url?: string | null }[]) => ({
  id: "FXM00013899", title: "Mufti Police", year: 1990, release_date: null, language: "te",
  poster: null, rating: null, provider_count: providers.length, youtube_count: 1,
  overview: "Fixture overview", genres: ["Action"], providers,
  youtube: [{ watch_url: "https://www.youtube.com/watch?v=65daIvuz5l0", language: "te" }],
  cast: [{ person_id: "FXP00001106", name: "Nayanthara", role: "ACTOR", relationship_type: "CAST" }],
});
const moviePageFixture = { total: 1, items: [{ id: "FXM00000001", title: "Related Fixture", year: 1988, release_date: null, language: "te", poster: null, rating: null, provider_count: 0, youtube_count: 0 }], next_cursor: null };

test.setTimeout(90_000);


test("home and search render and navigate", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: /Indian movies in every language/i })).toBeVisible();
  await expect(page.locator(".movie-rail .movie-card").first()).toBeVisible();
  await page.getByRole("textbox", { name: "Search FLIXYFY" }).fill("ANR");
  await page.locator(".hero-search").getByRole("button", { name: "Search", exact: true }).click();
  await expect(page).toHaveURL(/\/search\?q=ANR/);
  await expect(page.getByRole("heading", { name: /Results for/ })).toBeVisible();
  await expect(page.locator(".search-person-heading")).toBeVisible();
});

test("catalog filters are friendly dropdowns and apply to accepted movie search", async ({ page }) => {
  await page.goto("/search", { waitUntil: "domcontentloaded" });
  for (const label of ["Genre", "Language", "Year", "Provider", "Sort"]) await expect(page.getByLabel(label)).toHaveJSProperty("tagName", "SELECT");
  await expect(page.getByLabel("Genre").locator("option", { hasText: "Action" })).toHaveAttribute("value", "action");
  await expect(page.getByLabel("Language").locator("option", { hasText: "Telugu" })).toHaveAttribute("value", "te");
  await expect(page.getByLabel("Year").locator("option").first()).toHaveText("All years");
  await expect(page.getByLabel("Year").locator("option").nth(1)).toHaveText("2026");
  await expect(page.getByLabel("Provider").locator("option", { hasText: "Netflix" })).toHaveAttribute("value", "netflix");
  const languageLabels = await page.getByLabel("Language").locator("option").allTextContents();
  expect(languageLabels).not.toContain("te");
  await page.getByLabel("Genre").selectOption("drama");
  await page.getByLabel("Language").selectOption("te");
  await page.getByRole("button", { name: "Apply filters" }).click();
  await expect(page).toHaveURL(/genre=drama/);
  await expect(page).toHaveURL(/language=te/);
  await expect(page.locator(".movie-card").first()).toBeVisible();
});

test("black and gold movie home, People Legends, and four-item navigation fit all checkpoint viewports", async ({ page }) => {
  for (const viewport of [{ width: 1440, height: 900 }, { width: 1280, height: 800 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 360, height: 800 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { level: 1, name: /Indian movies in every language/i })).toBeVisible();
    await expect(page.getByRole("textbox", { name: "Search FLIXYFY" })).toBeVisible();
    await expect(page.locator(".legends-section")).toHaveCount(0);
    const navigation = viewport.width <= 760 ? page.locator(".mobile-nav") : page.locator(".primary-nav");
    for (const label of ["Home", "Search", "People", "Providers"]) {
      const item = navigation.getByRole("link", { name: label, exact: true });
      await expect(item).toBeVisible();
      const box = await item.boundingBox();
      expect(box?.height, `${label} touch height at ${viewport.width}`).toBeGreaterThanOrEqual(44);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `home overflow at ${viewport.width}`).toBeTruthy();
    if (viewport.width > 760) {
      const navSize = await navigation.locator("a").first().evaluate((node) => Number.parseFloat(getComputedStyle(node).fontSize));
      expect(navSize, `desktop/tablet nav font at ${viewport.width}`).toBeGreaterThanOrEqual(viewport.width <= 1180 ? 14 : 15);
    }
    if (viewport.width === 390) {
      await page.goto("/people", { waitUntil: "domcontentloaded" });
      await expect(page.locator(".legends-section")).toBeVisible();
      await expect(page.locator(".legend-language-row")).toHaveCount(4);
    }
  }
});

test("primary routes load accepted data without failed API calls or browser errors", async ({ page }) => {
  const pageErrors: string[] = [];
  const failedApi: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  page.on("response", (response) => {
    if (response.url().includes("/api/v3/") && response.status() >= 400) failedApi.push(`${response.status()} ${new URL(response.url()).pathname}`);
  });
  for (const route of ["/", "/search?q=ANR", "/people", "/people?q=Sundeep%20Kishan", "/providers"]) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator("main")).toBeVisible();
    if (route === "/") await expect(page.locator(".movie-rail .movie-card").first()).toBeVisible();
    if (route.startsWith("/search")) await expect(page.locator(".movie-card").first()).toBeVisible();
    if (route === "/people") await expect(page.locator(".person-card").first()).toBeVisible();
    if (route.startsWith("/people?")) await expect(page.getByRole("link", { name: /Sundeep Kishan/ })).toHaveAttribute("href", "/people/sundeep-kishan-FXP00032940");
    if (route === "/providers") await expect(page.locator(".provider-card").first()).toBeVisible();
  }
  expect(pageErrors).toEqual([]);
  expect(failedApi).toEqual([]);
});

test("people aliases resolve to canonical FXP links", async ({ page }) => {
  await page.goto("/people?q=Sundeep%20Kishan", { waitUntil: "domcontentloaded" });
  await expect(page.getByRole("heading", { name: "Search results" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Sundeep Kishan/ })).toHaveAttribute("href", "/people/sundeep-kishan-FXP00032940");
});

test("checkpoint accepted Person totals and Nayanthara pagination match V3", async ({ page }) => {
  const expected = [["Allu Arjun", 26], ["Shah Rukh Khan", 95], ["Prakash Raj", 383], ["Sobhan Babu", 63]] as const;
  for (const [name, count] of expected) {
    const response = await page.request.get(`/api/v3/people/search?q=${encodeURIComponent(name)}`);
    expect(response.ok(), `${name} search API`).toBeTruthy();
    const result = await response.json() as { items: { display_name: string; filmography_total: number }[] };
    const person = result.items.find((item) => item.display_name.toLowerCase() === name.toLowerCase());
    expect(person, `${name} accepted identity`).toBeTruthy();
    expect(person!.filmography_total, `${name} accepted films`).toBe(count);
  }

  const search = await page.request.get("/api/v3/people/search?q=nayanthara");
  expect(search.ok()).toBeTruthy();
  const nayanthara = (await search.json() as { items: { id: string; filmography_total: number }[] }).items[0];
  expect(nayanthara.filmography_total).toBe(85);
  const pageSizes: number[] = [];
  let cursor = "";
  for (let index = 0; index < 3; index += 1) {
    const params = new URLSearchParams({ limit: "30" });
    if (cursor) params.set("cursor", cursor);
    const result = await page.request.get(`/api/v3/people/${nayanthara.id}/movies?${params}`);
    expect(result.ok(), `Nayanthara page ${index + 1}`).toBeTruthy();
    const body = await result.json() as { items: unknown[]; next_cursor: string | null };
    pageSizes.push(body.items.length);
    cursor = body.next_cursor || "";
  }
  expect(pageSizes).toEqual([30, 30, 25]);
  expect(cursor).toBe("");
});

test("all checkpoint search aliases show their canonical Person card", async ({ page }) => {
  test.setTimeout(240_000);
  const cases: [string, string, number][] = [
    ["shobanbabu", "FXP00000132", 63], ["sobhan babu", "FXP00000132", 63],
    ["krishnamraju", "FXP00000234", 39], ["krishnam raju", "FXP00000234", 39],
    ["balakrishna", "FXP00003500", 91], ["nbk", "FXP00003500", 91],
    ["balayya", "FXP00003500", 91], ["balayya babu", "FXP00003500", 91],
    ["sandeep kishan", "FXP00032940", 34], ["sundeep kishan", "FXP00032940", 34],
    ["raviteja", "FXP00017751", 1], ["ravi teja", "FXP00017751", 1],
  ];
  for (const [query, personId, filmographyTotal] of cases) {
    await page.goto(`/search?q=${encodeURIComponent(query)}`, { waitUntil: "domcontentloaded" });
    const card = page.locator(`.search-person-heading[href$="${personId}"]`).first();
    await expect(card, query).toBeVisible();
    await expect(card.locator(".person-portrait")).toBeVisible();
    await expect(card).toContainText(`${filmographyTotal} accepted films`);
    await expect(card).not.toContainText(personId);
  }
});

test("Nayanthara aliases return JSON and show filmography directly in General Search", async ({ page }) => {
  const queries = ["nayanthara", "Nayanthara", "nayantara", "Nayantara"];
  for (const query of queries) {
    const apiResponses: { status: number; contentType: string }[] = [];
    page.on("response", (response) => {
      if (response.url().includes("/api/v3/search")) apiResponses.push({ status: response.status(), contentType: response.headers()["content-type"] ?? "" });
    });
    await page.goto(`/search?q=${query}`, { waitUntil: "domcontentloaded" });
    await expect(page.locator(".search-person-heading")).toContainText("Nayanthara");
    await expect(page.locator(".search-person-heading")).toContainText("85 accepted films");
    await expect(page.locator(".search-person-result .movie-card")).toHaveCount(30);
    expect(apiResponses.length).toBeGreaterThan(0);
    expect(apiResponses.every((response) => response.status === 200 && response.contentType.includes("application/json"))).toBeTruthy();
    expect(await page.locator("main").innerText()).not.toContain("Search failed");
    expect(await page.locator("main").innerText()).not.toMatch(/<!doctype html/i);
    await page.goto(`/people?q=${encodeURIComponent(query)}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("link", { name: /Nayanthara/ }).first()).toHaveAttribute("href", "/people/nayanthara-FXP00001106");
    page.removeAllListeners("response");
  }
});

test("FXP-only Person URLs canonicalize and autocomplete selects one identity directly", async ({ page }) => {
  await page.goto("/people/FXP00001106", { waitUntil: "domcontentloaded" });
  await expect(page).toHaveURL(/\/people\/nayanthara-FXP00001106$/);
  await expect(page.getByRole("heading", { name: "Nayanthara" })).toBeVisible();
  await expect(page.locator(".person-hero + .person-tabs ~ section .movie-card").first()).toBeVisible();

  await page.goto("/", { waitUntil: "domcontentloaded" });
  const search = page.getByRole("combobox", { name: "Search movies and people" });
  await search.fill("naya");
  const suggestion = page.getByRole("option", { name: /Nayanthara.*85 films/i });
  await expect(suggestion).toBeVisible();
  await suggestion.click();
  await expect(page).toHaveURL(/\/people\/nayanthara-FXP00001106$/);
  await expect(page.getByRole("heading", { name: "Nayanthara" })).toBeVisible();
  await expect(page.locator(".movie-card").first()).toBeVisible();
});

test("Person search, discovery rails, and first filmography page fit mobile, tablet, and TV viewports", async ({ page }) => {
  test.setTimeout(180_000);
  for (const viewport of [{ width: 390, height: 844 }, { width: 768, height: 1024 }, { width: 1366, height: 768 }, { width: 1920, height: 1080 }]) {
    await page.setViewportSize(viewport);
    await page.goto("/people", { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("group", { name: "People category" }).getByRole("button", { name: "All", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Heroes \/ Leads/ })).toBeVisible();
    await expect(page.locator(".people-section .person-card").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `People overflow at ${viewport.width}`).toBeTruthy();
    await page.goto("/search?q=nayanthara", { waitUntil: "domcontentloaded" });
    await expect(page.locator(".search-person-heading")).toBeVisible();
    await expect(page.locator(".search-person-result .movie-card").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `Search overflow at ${viewport.width}`).toBeTruthy();
  }
});

test("people discovery uses cinematic cards, all friendly languages, and eligible filmographies", async ({ page }) => {
  await page.goto("/people", { waitUntil: "domcontentloaded" });
  for (const language of ["All", "Telugu", "Hindi", "Tamil", "Malayalam", "Kannada", "Bengali", "Marathi", "Punjabi", "Urdu", "Nepali", "Odia", "Gujarati", "Assamese"]) {
    await expect(page.getByRole("group", { name: "People language" }).getByRole("button", { name: language, exact: true })).toBeVisible();
  }
  const cards = page.locator(".people-section .person-card");
  await expect(cards.first()).toBeVisible();
  const visible = await cards.evaluateAll((items) => items.map((item) => ({
    text: item.textContent ?? "",
    name: item.querySelector("strong")?.textContent ?? "",
    hasImageOrFallback: Boolean(item.querySelector(".person-avatar")),
  })));
  expect(visible.length).toBeGreaterThan(0);
  expect(visible.every((item) => Number(item.text.match(/(\d+) accepted films/)?.[1] ?? 0) >= 20)).toBeTruthy();
  expect(visible.every((item) => item.hasImageOrFallback && !/^FXP\d{8}$/.test(item.name))).toBeTruthy();
});

test("providers start with 100-plus catalogs and expand to human-readable long tail", async ({ page }) => {
  await page.goto("/providers", { waitUntil: "domcontentloaded" });
  const cards = page.locator(".provider-card");
  await expect(cards.first()).toBeVisible();
  const primaryCounts = await cards.locator(".provider-copy small").allTextContents();
  expect(primaryCounts.length).toBeGreaterThan(0);
  expect(primaryCounts.every((text) => Number(text.replace(/[^\d]/g, "")) >= 100)).toBeTruthy();
  const labels = await cards.locator(".provider-copy strong").allTextContents();
  expect(labels.every((label) => !label.includes("_") && label.trim().length > 0)).toBeTruthy();
  await page.getByRole("button", { name: /View all \d+ providers/ }).click();
  await expect(cards).toHaveCount(50);
  const expandedCounts = await cards.locator(".provider-copy small").allTextContents();
  expect(expandedCounts.some((text) => Number(text.replace(/[^\d]/g, "")) < 100)).toBeTruthy();
  const expandedLabels = await cards.locator(".provider-copy strong").allTextContents();
  expect(expandedLabels.every((label) => !label.includes("_") && label.trim().length > 0)).toBeTruthy();
});

test("person pages expose role filters and paginate accepted credits", async ({ page }) => {
  await page.goto("/people?q=ANR", { waitUntil: "domcontentloaded" });
  const personLink = page.locator('a[href^="/people/"]').first();
  await expect(personLink).toBeVisible();
  await personLink.click();
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await expect(page.getByRole("button", { name: /filmography/i })).toBeVisible();
  const leadFilter = page.getByRole("button", { name: "Hero / Lead" });
  if (await leadFilter.isVisible()) await leadFilter.click();
  const more = page.getByRole("button", { name: "Load more films" });
  if (await more.isVisible()) {
    const before = await page.locator(".movie-card").count();
    await more.click();
    await expect.poll(() => page.locator(".movie-card").count(), { timeout: 30_000 }).toBeGreaterThan(before);
  }
});

test("movie detail exposes accepted watch sections", async ({ page }) => {
  await page.goto("/movies/FXM00014668", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".detail-hero h1")).toBeVisible();
  const watermark = await page.locator(".detail-hero").evaluate((node) => getComputedStyle(node, "::after").content);
  expect(watermark).toContain("FLIXYFY");
  await expect(page.getByRole("heading", { name: "Where to Watch in India" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Watch Free on YouTube" })).toBeVisible();
  await expect(page.locator(".related-section .section-head h2")).toContainText("Related");
});

test("watch-first detail layout passes six responsive viewports and V3 offer regressions", async ({ page }) => {
  test.setTimeout(240_000);
  const targets = [
    { id: "FXM00013899", title: "Mufti Police", providers: ["Sun NXT"], logoProviders: ["Sun NXT"], youtube: ["Telugu", "Hindi", "Kannada"], watchable: true },
    { id: "FXM00013614", title: "Jigris", providers: ["Prime Video"], logoProviders: ["Prime Video"], youtube: [], watchable: true },
    { id: "FXM00007323", title: "Border 2", providers: ["Netflix"], logoProviders: ["Netflix"], youtube: ["English", "English"], watchable: true },
    { id: "FXM00037500", title: "Aaya Toofan", providers: [], logoProviders: [], youtube: ["Hindi"], watchable: true },
    { id: "FXM00033981", title: "Arjun", providers: ["JioHotstar", "Vi Movies & TV"], logoProviders: ["JioHotstar"], youtube: ["Telugu", "English", "English"], watchable: true },
    { id: "FXM00038267", title: "Dharma Patni", providers: [], logoProviders: [], youtube: [], watchable: false },
  ];
  const providerKeys: Record<string, string> = { "Sun NXT": "sun_nxt", "Prime Video": "prime_video", Netflix: "netflix", JioHotstar: "jiohotstar", "Vi Movies & TV": "vi_movies_and_tv" };
  const forbiddenRaw = /sun_nxt|prime_video|vi_movies_and_tv|\b(?:te|hi|kn|en|zxx)\b/i;
  const viewports = [
    { width: 390, height: 844 }, { width: 768, height: 1024 },
    { width: 1024, height: 768 }, { width: 1366, height: 768 },
    { width: 1440, height: 900 }, { width: 1920, height: 1080 },
  ];
  for (const target of targets) {
    const response = await page.request.get(`/api/v3/movies/${target.id}`);
    expect(response.ok(), `${target.id} detail API`).toBeTruthy();
    const detail = await response.json() as { title: string; providers: { key: string }[]; youtube: { language: string | null }[]; overview: string | null; cast: { person_id: string }[] };
    expect(detail.title).toBe(target.title);
    expect(detail.providers.map((item) => item.key)).toEqual(expect.arrayContaining(target.providers.map((name) => providerKeys[name])));
    expect(detail.providers.length).toBe(target.providers.length);
    expect(detail.youtube.length).toBe(target.youtube.length);
    expect(detail.cast.every((credit) => /^FXP\d{8}$/.test(credit.person_id))).toBeTruthy();

    for (const viewport of viewports) {
      await page.setViewportSize(viewport);
      await page.goto(`/movies/${target.id}`, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".detail-hero h1", { hasText: target.title })).toBeVisible();
      const body = await page.locator("main").innerText();
      expect(body).not.toMatch(forbiddenRaw);
      const heroSections = await page.locator(".hero-watch-grid .hero-watch-section").evaluateAll((nodes) => nodes.map((node) => node.querySelector("h2")?.textContent?.trim()));
      const watchIndex = heroSections.findIndex((label) => label === "Where to Watch in India");
      const youtubeIndex = heroSections.findIndex((label) => label === "Watch Free on YouTube");
      const sections = await page.locator(".detail-body > .detail-section").evaluateAll((nodes) => nodes.map((node) => node.querySelector("h2")?.textContent?.trim()));
      const overviewIndex = sections.findIndex((label) => label === "Overview");
      const castIndex = sections.findIndex((label) => label === "Cast & Crew");
      expect(watchIndex).toBeGreaterThanOrEqual(0);
      expect(youtubeIndex).toBeGreaterThan(watchIndex);
      expect(overviewIndex).toBeGreaterThanOrEqual(0);
      if (castIndex >= 0) expect(castIndex).toBeGreaterThan(overviewIndex);
      const overview = await page.locator(".hero-overview").innerText();
      if (detail.overview) expect(overview).toContain(detail.overview);
      else expect(overview.length).toBeGreaterThan(0);
      for (const provider of target.providers) {
        if (provider === "Sun NXT") await expect(page.getByRole("link", { name: "Visit Sun NXT" })).toBeVisible();
        else await expect(page.getByText(`Available on ${provider}`, { exact: true })).toBeVisible();
      }
      for (const language of target.youtube) await expect(page.locator(".youtube-action strong", { hasText: `YouTube · ${language}` }).first()).toBeVisible();
      const youtubeLogos = page.locator(".youtube-logo");
      await expect(youtubeLogos).toHaveCount(target.youtube.length);
      await expect.poll(() => youtubeLogos.evaluateAll((images) => images.every((image) => {
        const img = image as HTMLImageElement;
        return img.complete && img.naturalWidth > 0;
      })), { timeout: 10_000, message: `${target.title} YouTube logos must finish loading at ${viewport.width}` }).toBeTruthy();

      if (target.watchable) {
        const action = page.locator(".offer-card, .youtube-action").first();
        await expect(action).toBeVisible();
        const box = await action.boundingBox();
        expect(box).not.toBeNull();
        expect(box!.y).toBeGreaterThanOrEqual(0);
        expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
        expect(box!.width).toBeGreaterThanOrEqual(44);
        expect(box!.height).toBeGreaterThanOrEqual(44);
      } else {
        await expect(page.locator(".offer-card, .youtube-action")).toHaveCount(0);
        await expect(page.getByText("No accepted India streaming offer is listed.")).toBeVisible();
        await expect(page.getByText("No approved YouTube full-movie link available.")).toBeVisible();
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth), `${target.title} overflow at ${viewport.width}`).toBeFalsy();
      const providerLogos = page.locator(".offer-card .provider-logo img");
      await expect(providerLogos).toHaveCount(target.logoProviders.length);
      await expect.poll(() => providerLogos.evaluateAll((images) => images.every((image) => {
        const img = image as HTMLImageElement;
        return img.complete && img.naturalWidth > 0;
      })), { timeout: 10_000, message: `${target.title} provider logos must finish loading at ${viewport.width}` }).toBeTruthy();
    }
  }

  await page.setViewportSize({ width: 3840, height: 2160 });
  await page.goto("/movies/FXM00013899", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".detail-hero h1", { hasText: "Mufti Police" })).toBeVisible();
  await expect(page.locator(".offer-card").first()).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBeFalsy();

  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/movies/FXM00013899", { waitUntil: "domcontentloaded" });
  let youtubeFocused = false;
  let castFocused = false;
  for (let step = 0; step < 24; step += 1) {
    await page.keyboard.press("Tab");
    const state = await page.evaluate(() => ({
      className: (document.activeElement as HTMLElement | null)?.className?.toString() ?? "",
      rect: document.activeElement?.getBoundingClientRect().toJSON(),
      outline: getComputedStyle(document.activeElement as Element).outlineStyle,
    }));
    if (state.className.includes("youtube-action")) {
      youtubeFocused = true;
      expect(state.outline).not.toBe("none");
      expect(state.rect && state.rect.y).toBeGreaterThanOrEqual(0);
      expect(state.rect && state.rect.y + state.rect.height).toBeLessThanOrEqual(1080);
    }
    if (state.className.includes("cast-card")) {
      castFocused = true;
      expect(youtubeFocused).toBeTruthy();
      break;
    }
  }
  expect(youtubeFocused).toBeTruthy();
  expect(castFocused).toBeTruthy();
});

test("provider links use valid HTTPS destinations and stay keyboard and touch accessible", async ({ page, context }) => {
  await page.route("**/api/v3/movies?*", async (route) => route.fulfill({ status: 200, contentType: "application/json", json: moviePageFixture }));
  await page.route("**/api/v3/movies/FXM00013899", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", json: movieDetailFixture([{ key: "sun_nxt", offer_count: 1, url: "https://www.sunnxt.com/" }]) });
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/movies/FXM00013899", { waitUntil: "domcontentloaded" });
  const providerLink = page.getByRole("link", { name: "Visit Sun NXT" });
  await expect(providerLink).toHaveAttribute("href", "https://www.sunnxt.com/");
  await expect(providerLink).toHaveAttribute("target", "_blank");
  await expect(providerLink).toHaveAttribute("rel", "noopener noreferrer");
  await expect(page.locator(".offer-card a.offer-action")).toHaveCount(1);
  const box = await providerLink.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(44);
  expect(box!.width).toBeGreaterThanOrEqual(44);
  await providerLink.focus();
  expect(await providerLink.evaluate((node) => getComputedStyle(node).outlineStyle)).not.toBe("none");
  await expect(page.locator(".offer-card .provider-logo img")).toHaveAttribute("src", /\/sun_nxt\.png$/);
  await expect(page.getByRole("heading", { name: "Where to Watch in India" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Watch Free on YouTube" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Cast & Crew" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Related" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Related Fixture/ })).toBeVisible();
  const heroOrder = await page.locator(".hero-watch-section h2").allTextContents();
  expect(heroOrder.indexOf("Where to Watch in India")).toBeLessThan(heroOrder.indexOf("Watch Free on YouTube"));
  const sectionOrder = await page.locator(".detail-body > .detail-section h2").allTextContents();
  expect(sectionOrder.indexOf("Cast & Crew")).toBeLessThan(sectionOrder.indexOf("Related"));
  await expect(page.locator(".youtube-action").first()).toHaveAttribute("href", /^https:\/\/www\.youtube\.com\//);
  const [providerTab] = await Promise.all([context.waitForEvent("page"), providerLink.press("Enter")]);
  await expect.poll(() => new URL(providerTab.url()).hostname).toBe("www.sunnxt.com");
  await providerTab.close();
  const [youtubeTab] = await Promise.all([context.waitForEvent("page"), page.locator(".youtube-action").first().press("Enter")]);
  await expect.poll(() => new URL(youtubeTab.url()).hostname).toBe("www.youtube.com");
  await youtubeTab.close();
});

test("label-only provider remains informational instead of a fake action", async ({ page }) => {
  await page.route("**/api/v3/movies?*", async (route) => route.fulfill({ status: 200, contentType: "application/json", json: moviePageFixture }));
  await page.route("**/api/v3/movies/FXM00013899", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", json: movieDetailFixture([{ key: "unrouted_provider_fixture", offer_count: 1 }]) });
  });
  await page.goto("/movies/FXM00013899", { waitUntil: "domcontentloaded" });
  await expect(page.getByText("Available on Unrouted Provider Fixture", { exact: true })).toBeVisible();
  await expect(page.locator(".offer-card a, .offer-card button")).toHaveCount(0);
  await expect(page.locator(".youtube-action").first()).toBeVisible();
});

test("provider destination uses a focused Watch CTA only when a safe URL exists", async ({ page }) => {
  await page.route("**/api/v3/movies?*", async (route) => route.fulfill({ status: 200, contentType: "application/json", json: moviePageFixture }));
  await page.route("**/api/v3/movies/FXM00013899", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", json: movieDetailFixture([{ key: "prime_video", offer_count: 1, url: "https://www.primevideo.com/" }]) });
  });
  await page.goto("/movies/FXM00013899", { waitUntil: "domcontentloaded" });
  const action = page.getByRole("link", { name: "Watch on Prime Video" });
  await expect(action).toHaveAttribute("href", "https://www.primevideo.com/");
  await expect(action).toHaveAttribute("target", "_blank");
  const box = await action.boundingBox();
  expect(box?.height).toBeLessThanOrEqual(48);
});

test("Jigris Prime Video logo loads from the packaged root asset and falls back accessibly", async ({ page }) => {
  await page.route("**/api/v3/movies?*", async (route) => route.fulfill({ status: 200, contentType: "application/json", json: moviePageFixture }));
  const jigris = { ...movieDetailFixture([{ key: "prime_video", offer_count: 1 }]), id: "FXM00013614", title: "Jigris" };
  await page.route("**/api/v3/movies/FXM00013614", async (route) => route.fulfill({ status: 200, contentType: "application/json", json: jigris }));
  await page.goto("/movies/FXM00013614", { waitUntil: "domcontentloaded" });
  const logo = page.locator('.offer-card img[alt="Prime Video logo"]');
  await expect(logo).toHaveAttribute("src", /\/prime_video\.png$/);
  await expect.poll(() => logo.evaluate((image) => (image as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  await expect(page.getByText("Available on Prime Video", { exact: true })).toBeVisible();
  await expect(page.locator(".offer-card a.offer-action")).toHaveCount(0);

  await page.route("**/prime_video.png", async (route) => route.fulfill({ status: 404, body: "missing fixture asset" }));
  await page.reload({ waitUntil: "domcontentloaded" });
  await expect(page.locator('.offer-card [aria-label="Prime Video logo unavailable"]')).toHaveText("PR");
  await expect(page.locator(".offer-card img")).toHaveCount(0);
});
