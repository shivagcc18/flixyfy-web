import { expect, test } from "@playwright/test";
import path from "node:path";

const evidence = process.env.FLIXYFY_SCREENSHOT_DIR || path.resolve(process.cwd(), "../../../../files-pasted-by-the-user-flixyfy-5/outputs/founder-ui-screenshots");

async function noOverflow(page: import("@playwright/test").Page, label: string) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${label} horizontal overflow`).toBeTruthy();
}

test("founder UI responsive matrix has readable navigation, visible branding, and no overflow", async ({ page }) => {
  test.setTimeout(300_000);
  for (const viewport of [
    { width: 1440, height: 900 }, { width: 1280, height: 800 }, { width: 1024, height: 768 },
    { width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 360, height: 800 },
  ]) {
    await page.setViewportSize(viewport);
    for (const route of ["/", "/search", "/people", "/movies/FXM00013614"]) {
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expect(page.locator(".brand-image-frame img")).toBeVisible();
      const nav = viewport.width <= 760 ? page.locator(".mobile-nav") : page.locator(".primary-nav");
      for (const label of ["Home", "Search", "People", "Providers"]) {
        const item = nav.locator(".nav-item").filter({ hasText: new RegExp(`^${label}$`) });
        await expect(item).toBeVisible();
        const box = await item.boundingBox();
        expect(box?.height, `${label} target at ${viewport.width}`).toBeGreaterThanOrEqual(44);
      }
      await expect(nav.getByRole("link", { name: "Languages", exact: true })).toHaveCount(0);
      await noOverflow(page, `${route} at ${viewport.width}`);
      if (route === "/search") await expect(page.getByLabel("Language")).toBeVisible();
      if (route === "/people") await expect(page.locator(".person-card").first()).toBeVisible();
      if (route.startsWith("/movies")) {
        await expect(page.locator(".detail-poster")).toBeVisible();
        await expect(page.locator(".hero-watch-grid")).toBeVisible();
        await expect(page.getByRole("heading", { name: "Where to Watch in India" })).toBeVisible();
        await expect(page.getByRole("heading", { name: "Watch Free on YouTube" })).toBeVisible();
      }
    }
  }
});

test("compact home hero and approved bright logo fit desktop and mobile", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  const desktopHero = await page.locator(".cinema-hero").boundingBox();
  expect(desktopHero?.height).toBeLessThanOrEqual(380);
  const logoStyle = await page.locator(".brand-image-frame").evaluate((node) => ({ width: node.getBoundingClientRect().width, background: getComputedStyle(node).backgroundColor }));
  expect(logoStyle.width).toBeGreaterThanOrEqual(60);
  expect(logoStyle.background).toBe("rgb(255, 255, 255)");
  await expect(page.locator(".hero-artwork")).toBeVisible();
  await expect(page.locator(".primary-nav a", { hasText: "Languages" })).toHaveCount(0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "domcontentloaded" });
  const mobileHero = await page.locator(".cinema-hero").boundingBox();
  expect(mobileHero?.height).toBeLessThanOrEqual(390);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await expect(page.locator(".mobile-nav a", { hasText: "Languages" })).toHaveCount(0);
});

test("People browse uses circular portrait tiles and a dense desktop grid", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/people", { waitUntil: "domcontentloaded" });
  const grid = page.locator(".people-section .people-grid").first();
  await expect(grid.locator(".person-card").first()).toBeVisible();
  const columns = await grid.evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(" ").length);
  expect(columns).toBeGreaterThanOrEqual(5);
  const avatar = grid.locator(".person-avatar").first();
  await expect(avatar).toBeVisible();
  expect(await avatar.evaluate((node) => getComputedStyle(node).borderRadius)).toBe("50%");
  const hasImageOrInitials = await avatar.evaluate((node) => Boolean(node.querySelector("img") || node.textContent?.trim()));
  expect(hasImageOrInitials).toBeTruthy();

  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "domcontentloaded" });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  await expect(page.locator(".legends-section")).toBeVisible();
});

test("Jigris detail keeps the cinematic hero and compact honest provider status", async ({ page }) => {
  await page.goto("/movies/FXM00013614", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".detail-hero h1", { hasText: "Jigris" })).toBeVisible();
  await expect(page.locator(".detail-poster")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Where to Watch in India" })).toBeVisible();
  await expect(page.getByText("OTT and store options", { exact: true })).toBeVisible();
  await expect(page.locator('.offer-card.offer-cta img[alt="Prime Video logo"]')).toBeVisible();
  await expect(page.getByText("Available on Prime Video", { exact: true })).toBeVisible();
  await expect(page.locator(".offer-card.offer-cta a.offer-action")).toHaveCount(0);
  await expect(page.getByRole("heading", { name: "Watch Free on YouTube" })).toBeVisible();
});

test("People categories call accepted API filters and Legends stay People-only", async ({ page }) => {
  const categoryRequests: string[] = [];
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes("/api/v3/people/languages/")) categoryRequests.push(url);
  });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".movie-rail .movie-card").first()).toBeVisible();
  await expect(page.locator(".legends-section")).toHaveCount(0);
  await page.goto("/people", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".people-section .person-card").first()).toBeVisible();
  await expect(page.locator(".legends-section")).toBeVisible();
  await expect(page.locator(".legend-language-row")).toHaveCount(4);
  for (const [name, category] of [["Heroes / Leads", "HEROES"], ["Heroines / Leads", "HEROINES"], ["Directors", "DIRECTORS"], ["Actors", "ACTORS"], ["All", "ALL"]]) {
    await page.getByRole("group", { name: "People category" }).getByRole("button", { name: new RegExp(`^${name}`) }).click();
    await expect.poll(() => categoryRequests.some((url) => new URL(url).searchParams.get("category") === category)).toBeTruthy();
    await noOverflow(page, `People ${category}`);
  }
  const imageState = await page.locator(".people-section .person-card").first().locator(".person-avatar").evaluate((avatar) => {
    const image = avatar.querySelector("img");
    return image ? { rendered: image.complete && image.naturalWidth > 0, fallback: false } : { rendered: false, fallback: Boolean(avatar.textContent?.trim()) };
  });
  expect(imageState.rendered || imageState.fallback).toBeTruthy();
});

test("capture founder desktop and mobile screenshot acceptance set", async ({ page }) => {
  test.setTimeout(240_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".movie-rail .movie-card").first()).toBeVisible();
  await page.screenshot({ path: path.join(evidence, "01_home_desktop.png"), fullPage: true });
  await page.screenshot({ path: path.join(evidence, "12_nav_desktop.png") });

  await page.goto("/search", { waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Genre")).toBeVisible();
  await page.screenshot({ path: path.join(evidence, "03_search_filters_desktop.png"), fullPage: true });

  await page.goto("/people", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".people-section .person-card").first()).toBeVisible();
  await expect(page.locator(".legends-section")).toBeVisible();
  await page.screenshot({ path: path.join(evidence, "05_people_all.png"), fullPage: true });
  await page.getByRole("group", { name: "People category" }).getByRole("button", { name: /^Heroes \/ Leads/ }).click();
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(evidence, "06_people_heroes.png"), fullPage: true });
  await page.getByRole("group", { name: "People category" }).getByRole("button", { name: /^Heroines \/ Leads/ }).click();
  await page.waitForTimeout(350);
  await page.screenshot({ path: path.join(evidence, "07_people_heroines.png"), fullPage: true });
  await page.getByRole("group", { name: "People category" }).getByRole("button", { name: /^All/ }).click();
  await page.waitForTimeout(350);
  await page.locator(".legends-section").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(evidence, "08_people_legends_desktop.png"), fullPage: true });

  await page.goto("/movies/FXM00013614", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".detail-hero h1", { hasText: "Jigris" })).toBeVisible();
  await expect(page.locator(".hero-watch-grid")).toBeVisible();
  await page.screenshot({ path: path.join(evidence, "10_jigris_detail_desktop.png"), fullPage: true });

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".movie-rail .movie-card").first()).toBeVisible();
  await page.screenshot({ path: path.join(evidence, "02_home_mobile.png"), fullPage: true });
  await page.screenshot({ path: path.join(evidence, "13_nav_mobile.png") });
  await page.goto("/search", { waitUntil: "domcontentloaded" });
  await expect(page.getByLabel("Genre")).toBeVisible();
  await page.screenshot({ path: path.join(evidence, "04_search_filters_mobile.png"), fullPage: true });
  await page.goto("/people", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".legends-section")).toBeVisible();
  await page.locator(".legends-section").scrollIntoViewIfNeeded();
  await page.screenshot({ path: path.join(evidence, "09_people_legends_mobile.png"), fullPage: true });
  await page.goto("/movies/FXM00013614", { waitUntil: "domcontentloaded" });
  await expect(page.locator(".detail-hero h1", { hasText: "Jigris" })).toBeVisible();
  await page.screenshot({ path: path.join(evidence, "11_jigris_detail_mobile.png"), fullPage: true });
});
